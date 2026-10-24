// src/api/callsApi.js
// Thin HTTP client for the Express backend.
// All fetch calls go through here — components never call fetch directly.
// Uses VITE_API_BASE_URL from the .env file (falls back to localhost:3001).
//
// SECURITY: This file must never import SUPABASE_SECRET_KEY or GEMINI_API_KEY.

const rawBase = import.meta.env.VITE_API_BASE_URL;
const BASE = (rawBase ? rawBase.trim().replace(/\/+$/, '') : '') || 'http://localhost:3001';

// ── Internal helpers ──────────────────────────────────────────

async function apiFetch(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = json?.error?.message || `API error ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

// ── Public API ────────────────────────────────────────────────

/** POST /api/calls — create a new in-progress call */
export async function createCall(formData) {
  return apiFetch('POST', '/api/calls', {
    prospectName:  formData.prospectName,
    company:       formData.company       || '',
    prospectTitle: formData.prospectTitle || '',
    phone:         formData.phone         || '',
    email:         formData.email         || '',
    location:      formData.location      || '',
    companyType:   formData.companyType   || '',
    callerName:    formData.callerName    || 'FDE',
  });
}

/** GET /api/calls — fetch all calls for history screen */
export async function fetchCalls() {
  return apiFetch('GET', '/api/calls');
}

/** GET /api/calls/:id — fetch one call with stage results */
export async function fetchCall(id) {
  return apiFetch('GET', `/api/calls/${id}`);
}

/**
 * PUT /api/calls/:id/stages/:n — save/update stage result.
 * @param {string} callId
 * @param {number} stageNumber  1–8
 * @param {string[]} whatHappened  array of chip IDs
 * @param {string} prospectWords
 */
export async function saveStage(callId, stageNumber, whatHappened, prospectWords) {
  return apiFetch('PUT', `/api/calls/${callId}/stages/${stageNumber}`, {
    whatHappened,
    prospectWords,
  });
}

/**
 * POST /api/calls/:id/close — close a call with a final outcome.
 */
export async function closeCall(callId, { outcome, nextStep, summary, summarySource, furthestStage, durationSeconds }) {
  return apiFetch('POST', `/api/calls/${callId}/close`, {
    outcome,
    nextStep:      nextStep      || '',
    summary:       summary       || '',
    summarySource: summarySource || 'manual',
    furthestStage: furthestStage || undefined,
    durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : undefined,
  });
}

/**
 * POST /api/calls/:id/suggest-close — ask Gemini for advisory suggestion.
 * Returns { aiAvailable, suggestion } or { aiAvailable: false, error }.
 * Never throws — callers should handle gracefully.
 */
export async function suggestClose(callId, { stageData } = {}) {
  try {
    return await apiFetch('POST', `/api/calls/${callId}/suggest-close`, {
      stageResults: stageData,
    });
  } catch (err) {
    // AI failure must not block the user from closing the call
    const errorMsg = err.body?.error?.message || err.message || 'AI generation failed.';
    return {
      aiAvailable: false,
      error: { message: errorMsg, type: 'generation_error' },
    };
  }
}

/**
 * PATCH /api/calls/:id — update historical call information and stage results.
 */
export async function updateCall(callId, fields) {
  return apiFetch('PATCH', `/api/calls/${callId}`, fields);
}

/**
 * DELETE /api/calls/:id — delete a call.
 */
export async function deleteCall(callId) {
  return apiFetch('DELETE', `/api/calls/${callId}`);
}

/** GET /health — basic connectivity check */
export async function checkHealth() {
  return apiFetch('GET', '/health');
}
