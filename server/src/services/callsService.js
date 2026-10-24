// src/services/callsService.js
// All database operations for calls and stage_results.
// Every function returns { data, error } so callers can handle
// failures without try/catch at the route level.

import { supabase } from '../config/supabase.js';

// ─── Valid outcomes (matches schema ENUM) ─────────────────────
export const VALID_OUTCOMES = [
  'not_interested',
  'agreed_to_receive_report',
  'follow_up',
  'not_logged',
  'next_step_agreed',
  'do_not_call',
  'wrong_person',
  'interested',
  'moved_company',
  'call_again',
];

// ─── Create a new call ─────────────────────────────────────────
export async function createCall(fields) {
  const { data, error } = await supabase
    .from('calls')
    .insert([{
      prospect_name:    fields.prospectName,
      company:          fields.company          || '',
      prospect_role:    fields.prospectRole     || fields.prospectTitle || '',
      caller_name:      fields.callerName       || 'FDE',
      prospect_phone:   fields.phone            || '',
      prospect_email:   fields.email            || '',
      prospect_location:fields.location         || '',
      company_type:     fields.companyType      || '',
      status:           'in_progress',
      furthest_stage:   1,
    }])
    .select()
    .single();

  return { data, error };
}

// ─── Get all calls (history list) ─────────────────────────────
export async function listCalls() {
  const { data, error } = await supabase
    .from('calls')
    .select(`
      id, prospect_name, company, prospect_role, company_type,
      prospect_email, prospect_phone, prospect_location,
      status, furthest_stage, outcome, next_step, summary,
      summary_source, llm_suggested_outcome,
      started_at, closed_at, created_at
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

// ─── Get one call with its stage results ──────────────────────
export async function getCallById(id) {
  const [callResult, stagesResult] = await Promise.all([
    supabase
      .from('calls')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('stage_results')
      .select('*')
      .eq('call_id', id)
      .order('stage_number', { ascending: true }),
  ]);

  if (callResult.error) return { data: null, error: callResult.error };

  return {
    data: {
      ...callResult.data,
      stageResults: stagesResult.data || [],
    },
    error: null,
  };
}

// ─── Upsert stage result ──────────────────────────────────────
// Safe to call multiple times — idempotent via ON CONFLICT.
// Never reduces furthest_stage.
export async function saveStageResult({ callId, stageNumber, whatHappened, prospectWords }) {
  // Upsert the stage result
  const { error: stageError } = await supabase
    .from('stage_results')
    .upsert(
      {
        call_id:       callId,
        stage_number:  stageNumber,
        what_happened: whatHappened !== undefined
          ? JSON.stringify(whatHappened)
          : null,
        prospect_words: prospectWords !== undefined ? prospectWords : null,
      },
      { onConflict: 'call_id,stage_number' }
    );

  if (stageError) return { error: stageError };

  // Update furthest_stage on the call only if this stage is further ahead
  const { error: callError } = await supabase.rpc('advance_furthest_stage', {
    p_call_id: callId,
    p_stage:   stageNumber,
  });

  // If the RPC doesn't exist yet (first deploy), fall back to a conditional update
  if (callError && callError.code === 'PGRST202') {
    // Fallback: read current furthest_stage and update if needed
    const { data: current } = await supabase
      .from('calls')
      .select('furthest_stage')
      .eq('id', callId)
      .single();

    if (current && stageNumber > current.furthest_stage) {
      await supabase
        .from('calls')
        .update({ furthest_stage: stageNumber })
        .eq('id', callId);
    }
    return { error: null };
  }

  return { error: callError };
}

// ─── Close a call ─────────────────────────────────────────────
export async function closeCall({ callId, outcome, nextStep, summary, summarySource, furthestStage, durationSeconds }) {
  if (!VALID_OUTCOMES.includes(outcome)) {
    return { error: new Error(`Invalid outcome: "${outcome}"`) };
  }

  const now = new Date();
  const updatePayload = {
    status:         'closed',
    outcome,
    next_step:      nextStep      || '',
    summary:        summary       || '',
    summary_source: summarySource || 'manual',
    furthest_stage: furthestStage || undefined,  // keep existing if not provided
    closed_at:      now.toISOString(),
  };

  if (typeof durationSeconds === 'number' && durationSeconds >= 0) {
    updatePayload.started_at = new Date(now.getTime() - durationSeconds * 1000).toISOString();
  }

  const { data, error } = await supabase
    .from('calls')
    .update(updatePayload)
    .eq('id', callId)
    .eq('status', 'in_progress') // safety: only close open calls
    .select()
    .single();

  return { data, error };
}

// ─── Save AI suggestion on a call ─────────────────────────────
export async function saveAiSuggestion({ callId, suggestedOutcome, suggestedNextStep, reason }) {
  const { error } = await supabase
    .from('calls')
    .update({
      llm_suggested_outcome:   suggestedOutcome  || null,
      llm_suggested_next_step: suggestedNextStep || null,
      llm_suggestion_reason:   reason            || null,
    })
    .eq('id', callId);

  return { error };
}

// ─── Update an existing call (editing historical or saved call) ──
// Safely preserves completion status, timestamps, and furthest_stage invariants.
export async function updateCall(callId, fields) {
  // 1. Fetch current call
  const { data: current, error: fetchErr } = await getCallById(callId);
  if (fetchErr) return { data: null, error: fetchErr };
  if (!current) return { data: null, error: new Error('Call not found.') };

  const updatePayload = {};

  if (fields.prospectName !== undefined) {
    if (!fields.prospectName.trim()) {
      return { data: null, error: new Error('prospectName cannot be empty.') };
    }
    updatePayload.prospect_name = fields.prospectName.trim();
  }
  if (fields.company !== undefined) updatePayload.company = fields.company.trim();
  if (fields.prospectTitle !== undefined || fields.prospectRole !== undefined) {
    updatePayload.prospect_role = (fields.prospectRole ?? fields.prospectTitle ?? '').trim();
  }
  if (fields.phone !== undefined) updatePayload.prospect_phone = fields.phone.trim();
  if (fields.email !== undefined) updatePayload.prospect_email = fields.email.trim();
  if (fields.location !== undefined) updatePayload.prospect_location = fields.location.trim();
  if (fields.companyType !== undefined) updatePayload.company_type = fields.companyType.trim();

  if (fields.outcome !== undefined) {
    if (fields.outcome && !VALID_OUTCOMES.includes(fields.outcome)) {
      return { data: null, error: new Error(`Invalid outcome: "${fields.outcome}". Valid values: ${VALID_OUTCOMES.join(', ')}`) };
    }
    updatePayload.outcome = fields.outcome || null;
  }

  if (fields.nextStep !== undefined) updatePayload.next_step = fields.nextStep.trim();
  if (fields.summary !== undefined) updatePayload.summary = fields.summary.trim();
  if (fields.summarySource !== undefined) updatePayload.summary_source = fields.summarySource;

  // Furthest stage invariant: can advance, but must not decrease below existing furthest_stage
  let maxStage = current.furthest_stage || 1;
  if (fields.furthestStage !== undefined && fields.furthestStage > maxStage) {
    maxStage = fields.furthestStage;
  }

  // If stage results are supplied in the edit payload, save them
  if (Array.isArray(fields.stageResults)) {
    for (const sr of fields.stageResults) {
      const num = parseInt(sr.stageNumber, 10);
      if (num >= 1 && num <= 8) {
        if (num > maxStage) maxStage = num;
        await supabase
          .from('stage_results')
          .upsert(
            {
              call_id:       callId,
              stage_number:  num,
              what_happened: sr.whatHappened !== undefined
                ? (typeof sr.whatHappened === 'string' ? sr.whatHappened : JSON.stringify(sr.whatHappened))
                : null,
              prospect_words: sr.prospectWords !== undefined ? sr.prospectWords : null,
            },
            { onConflict: 'call_id,stage_number' }
          );
      }
    }
  }

  updatePayload.furthest_stage = maxStage;

  // Execute update if any fields changed
  if (Object.keys(updatePayload).length > 0) {
    const { error: updateErr } = await supabase
      .from('calls')
      .update(updatePayload)
      .eq('id', callId);

    if (updateErr) return { data: null, error: updateErr };
  }

  // Return the updated call with latest stage results
  return await getCallById(callId);
}

// ─── Delete a call (safe cleanup for demo or unwanted test calls) ──
export async function deleteCall(callId) {
  const { data, error } = await supabase
    .from('calls')
    .delete()
    .eq('id', callId)
    .select()
    .single();

  return { data, error };
}

