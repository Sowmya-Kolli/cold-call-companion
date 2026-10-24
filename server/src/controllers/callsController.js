// src/controllers/callsController.js
// Request handlers — thin layer between routes and services.

import {
  createCall,
  listCalls,
  getCallById,
  saveStageResult,
  closeCall,
  saveAiSuggestion,
  updateCall,
  deleteCall,
  VALID_OUTCOMES,
} from '../services/callsService.js';
import { generateSuggestion } from '../services/geminiService.js';
import { httpError } from '../middleware/errorHandler.js';

// ─── GET /health ──────────────────────────────────────────────
export async function health(req, res) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}

// ─── POST /api/calls ──────────────────────────────────────────
export async function createCallHandler(req, res, next) {
  const { prospectName, company, prospectTitle, prospectRole,
          phone, email, location, companyType, callerName } = req.body;

  if (!prospectName || !prospectName.trim()) {
    return next(httpError('prospectName is required.', 400));
  }

  const { data, error } = await createCall({
    prospectName: prospectName.trim(),
    company:      (company || '').trim(),
    prospectRole: (prospectRole || prospectTitle || '').trim(),
    callerName:   (callerName || 'FDE').trim(),
    phone:        (phone || '').trim(),
    email:        (email || '').trim(),
    location:     (location || '').trim(),
    companyType:  (companyType || '').trim(),
  });

  if (error) return next(httpError(`Failed to create call: ${error.message}`, 500));
  res.status(201).json({ call: data });
}

// ─── GET /api/calls ───────────────────────────────────────────
export async function listCallsHandler(req, res, next) {
  const { data, error } = await listCalls();
  if (error) return next(httpError(`Failed to fetch calls: ${error.message}`, 500));
  res.json({ calls: data });
}

// ─── GET /api/calls/:id ───────────────────────────────────────
export async function getCallHandler(req, res, next) {
  const { id } = req.params;
  const { data, error } = await getCallById(id);
  if (error) {
    if (error.code === 'PGRST116') return next(httpError('Call not found.', 404));
    return next(httpError(`Failed to fetch call: ${error.message}`, 500));
  }
  if (!data) return next(httpError('Call not found.', 404));
  res.json({ call: data });
}

// ─── PUT /api/calls/:id/stages/:n ────────────────────────────
export async function saveStageHandler(req, res, next) {
  const { id } = req.params;
  const stageNumber = req.stageNumber; // set by validateStageParam middleware

  const { whatHappened, prospectWords } = req.body;

  // Verify call exists and is still open
  const { data: call, error: fetchErr } = await getCallById(id);
  if (fetchErr || !call) return next(httpError('Call not found.', 404));
  if (call.status === 'closed') {
    return next(httpError('Cannot update stages on a closed call.', 409));
  }

  const { error } = await saveStageResult({
    callId:       id,
    stageNumber,
    whatHappened: whatHappened ?? undefined,
    prospectWords: prospectWords ?? undefined,
  });

  if (error) return next(httpError(`Failed to save stage: ${error.message}`, 500));

  res.json({ success: true, callId: id, stageNumber });
}

// ─── POST /api/calls/:id/close ────────────────────────────────
export async function closeCallHandler(req, res, next) {
  const { id } = req.params;
  const { outcome, nextStep, summary, summarySource, furthestStage, durationSeconds } = req.body;

  if (!outcome) return next(httpError('outcome is required.', 400));
  if (!VALID_OUTCOMES.includes(outcome)) {
    return next(httpError(
      `Invalid outcome "${outcome}". Valid values: ${VALID_OUTCOMES.join(', ')}`, 400
    ));
  }

  const { data, error } = await closeCall({
    callId:       id,
    outcome,
    nextStep:     nextStep     || '',
    summary:      summary      || '',
    summarySource:summarySource|| 'manual',
    furthestStage:furthestStage|| undefined,
    durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : undefined,
  });

  if (error) {
    if (error.code === 'PGRST116') return next(httpError('Call not found or already closed.', 404));
    return next(httpError(`Failed to close call: ${error.message}`, 500));
  }

  res.json({ call: data });
}

// ─── POST /api/calls/:id/suggest-close ───────────────────────
// Advisory only. AI failure never blocks closing a call.
export async function suggestCloseHandler(req, res, next) {
  const { id } = req.params;

  // Fetch call + stage results
  const { data: call, error: fetchErr } = await getCallById(id);
  if (fetchErr || !call) return next(httpError('Call not found.', 404));

  // Prefer live stage results sent from active stages in req.body, falling back to DB records
  let stageResults = call.stageResults || [];
  if (Array.isArray(req.body?.stageResults) && req.body.stageResults.length > 0) {
    stageResults = req.body.stageResults.map(s => ({
      stage_number: s.stageId || s.stage_number,
      what_happened: typeof s.selectedChips === 'string'
        ? s.selectedChips
        : JSON.stringify(s.selectedChips || []),
      prospect_words: s.prospectWords || s.prospect_words || '',
    }));
  }

  const { data: suggestion, error: aiErr } = await generateSuggestion({
    call,
    stageResults,
  });

  if (aiErr) {
    // Return a structured error response — client must handle gracefully
    return res.status(503).json({
      aiAvailable: false,
      error: {
        message: aiErr.message,
        type:    aiErr.type || 'unknown',
      },
    });
  }

  // Persist the advisory suggestion fields on the call (non-blocking)
  await saveAiSuggestion({
    callId:           id,
    suggestedOutcome: suggestion.suggestedOutcome,
    suggestedNextStep:suggestion.suggestedNextStep,
    reason:           suggestion.reason,
  });

  res.json({
    aiAvailable: true,
    suggestion,
  });
}

// ─── PATCH/PUT /api/calls/:id ────────────────────────────────
// Safely update saved call details without changing status or completion
export async function updateCallHandler(req, res, next) {
  const { id } = req.params;
  const fields = req.body;

  if (!fields || typeof fields !== 'object') {
    return next(httpError('Request body must be an object with fields to update.', 400));
  }

  const { data, error } = await updateCall(id, fields);

  if (error) {
    if (error.message?.includes('not found') || error.code === 'PGRST116') {
      return next(httpError('Call not found.', 404));
    }
    if (error.message?.includes('cannot be empty') || error.message?.includes('Invalid outcome')) {
      return next(httpError(error.message, 400));
    }
    return next(httpError(`Failed to update call: ${error.message}`, 500));
  }

  res.json({ call: data });
}

// ─── DELETE /api/calls/:id ───────────────────────────────────
export async function deleteCallHandler(req, res, next) {
  const { id } = req.params;
  const { data, error } = await deleteCall(id);

  if (error) {
    if (error.code === 'PGRST116') return next(httpError('Call not found.', 404));
    return next(httpError(`Failed to delete call: ${error.message}`, 500));
  }

  res.json({ success: true, deletedId: id });
}
