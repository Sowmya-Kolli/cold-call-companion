// src/__tests__/calls.test.js
// Automated tests using Node's built-in test runner (node --test).
// Run: npm test (from the server/ directory)
//
// These tests exercise the service and API logic.
// They require a real Supabase connection — set env vars before running.
// Tests that can run without a DB connection are marked clearly.

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

// ── Helper: make requests to the running server ───────────────
// These are integration tests that call the actual HTTP server.
const BASE = `http://localhost:${process.env.PORT || 3001}`;

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

// ── Unit tests: validation helpers (no DB needed) ─────────────
describe('VALID_OUTCOMES', async () => {
  const { VALID_OUTCOMES } = await import('../services/callsService.js');

  it('contains exactly 10 valid outcome values', () => {
    assert.equal(VALID_OUTCOMES.length, 10);
  });

  it('includes next_step_agreed', () => {
    assert.ok(VALID_OUTCOMES.includes('next_step_agreed'));
  });

  it('does not include empty string', () => {
    assert.ok(!VALID_OUTCOMES.includes(''));
  });
});

// ── Integration tests: require running server + Supabase ──────
describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const { status, body } = await req('GET', '/health');
    assert.equal(status, 200);
    assert.equal(body.status, 'ok');
    assert.ok(body.timestamp);
  });
});

describe('POST /api/calls — validation', () => {
  it('returns 400 when prospectName is missing', async () => {
    const { status, body } = await req('POST', '/api/calls', { company: 'Test Corp' });
    assert.equal(status, 400);
    assert.ok(body.error?.message?.toLowerCase().includes('prospectname'));
  });

  it('returns 400 when prospectName is empty string', async () => {
    const { status } = await req('POST', '/api/calls', { prospectName: '  ', company: 'Test' });
    assert.equal(status, 400);
  });
});

describe('Full call lifecycle', () => {
  let callId;

  it('creates a new call', async () => {
    const { status, body } = await req('POST', '/api/calls', {
      prospectName: 'Test Prospect',
      company:      'Test Corp',
      prospectTitle:'CTO',
      phone:        '+91 98000 00000',
      email:        'test@testcorp.com',
      location:     'Bangalore',
    });
    assert.equal(status, 201, `Expected 201, got ${status}: ${JSON.stringify(body)}`);
    assert.ok(body.call?.id);
    assert.equal(body.call.prospect_name, 'Test Prospect');
    assert.equal(body.call.status, 'in_progress');
    assert.equal(body.call.furthest_stage, 1);
    callId = body.call.id;
  });

  it('appears in GET /api/calls list', async () => {
    const { status, body } = await req('GET', '/api/calls');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.calls));
    const found = body.calls.find(c => c.id === callId);
    assert.ok(found, 'Newly created call not found in list');
  });

  it('saves stage 1 result', async () => {
    const { status, body } = await req('PUT', `/api/calls/${callId}/stages/1`, {
      whatHappened:  ['right_person'],
      prospectWords: 'Yes this is Test Prospect speaking.',
    });
    assert.equal(status, 200, JSON.stringify(body));
    assert.ok(body.success);
  });

  it('saves stage 1 again without duplicating (idempotent upsert)', async () => {
    const { status } = await req('PUT', `/api/calls/${callId}/stages/1`, {
      whatHappened:  ['right_person', 'gatekeeper'],
      prospectWords: 'Updated words with unicode: नमस्ते 🎉',
    });
    assert.equal(status, 200);
  });

  it('saves stage 3 — furthest_stage advances to 3', async () => {
    const { status } = await req('PUT', `/api/calls/${callId}/stages/3`, {
      whatHappened:  ['available'],
      prospectWords: 'I have about 5 minutes.',
    });
    assert.equal(status, 200);
  });

  it('goes back to stage 1 — furthest_stage stays at 3', async () => {
    const { status } = await req('PUT', `/api/calls/${callId}/stages/1`, {
      whatHappened:  ['right_person'],
      prospectWords: 'Yes, still me.',
    });
    assert.equal(status, 200);
    // Verify furthest_stage hasn't decreased
    const { body } = await req('GET', `/api/calls/${callId}`);
    assert.ok(body.call.furthest_stage >= 3,
      `Expected furthest_stage >= 3, got ${body.call.furthest_stage}`);
  });

  it('rejects invalid stage number (0)', async () => {
    const { status } = await req('PUT', `/api/calls/${callId}/stages/0`, {});
    assert.equal(status, 400);
  });

  it('rejects invalid stage number (9)', async () => {
    const { status } = await req('PUT', `/api/calls/${callId}/stages/9`, {});
    assert.equal(status, 400);
  });

  it('rejects close with invalid outcome', async () => {
    const { status, body } = await req('POST', `/api/calls/${callId}/close`, {
      outcome: 'made_it_up',
    });
    assert.equal(status, 400, JSON.stringify(body));
  });

  it('rejects close with missing outcome', async () => {
    const { status } = await req('POST', `/api/calls/${callId}/close`, {
      nextStep: 'Follow up Monday',
    });
    assert.equal(status, 400);
  });

  it('closes call at stage 3 (early close)', async () => {
    const { status, body } = await req('POST', `/api/calls/${callId}/close`, {
      outcome:       'call_again',
      nextStep:      'Call back Monday 10 AM',
      summary:       'Prospect was boarding a flight. Callback agreed.',
      summarySource: 'manual',
      furthestStage: 3,
    });
    assert.equal(status, 200, JSON.stringify(body));
    assert.equal(body.call.status, 'closed');
    assert.equal(body.call.outcome, 'call_again');
    assert.ok(body.call.closed_at);
  });

  it('rejects stage update on a closed call', async () => {
    const { status } = await req('PUT', `/api/calls/${callId}/stages/2`, {
      whatHappened: ['engaged'],
    });
    assert.equal(status, 409);
  });

  it('rejects closing an already-closed call', async () => {
    const { status } = await req('POST', `/api/calls/${callId}/close`, {
      outcome: 'not_interested',
    });
    assert.equal(status, 404); // .eq('status', 'in_progress') returns nothing
  });

  it('returns 404 for unknown call id', async () => {
    const { status } = await req('GET', '/api/calls/00000000-0000-0000-0000-000000000000');
    assert.equal(status, 404);
  });

  it('GET /api/calls/:id returns stage results', async () => {
    const { status, body } = await req('GET', `/api/calls/${callId}`);
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.call.stageResults));
    // Stage 1 and stage 3 should be present
    const stageNums = body.call.stageResults.map(s => s.stage_number);
    assert.ok(stageNums.includes(1), 'Stage 1 not found');
    assert.ok(stageNums.includes(3), 'Stage 3 not found');
  });
});

describe('suggest-close on unknown call', () => {
  it('returns 404', async () => {
    const { status } = await req(
      'POST',
      '/api/calls/00000000-0000-0000-0000-000000000001/suggest-close',
      {}
    );
    assert.equal(status, 404);
  });
});

describe('PATCH /api/calls/:id — historical call editing', () => {
  let editCallId;

  before(async () => {
    // Create and close a call
    const createRes = await req('POST', '/api/calls', {
      prospectName: 'Initial Prospect',
      company: 'Initial Corp',
      prospectTitle: 'VP',
    });
    editCallId = createRes.body.call.id;
    await req('PUT', `/api/calls/${editCallId}/stages/2`, {
      whatHappened: ['engaged'],
      prospectWords: 'Initial words',
    });
    await req('POST', `/api/calls/${editCallId}/close`, {
      outcome: 'next_step_agreed',
      nextStep: 'Initial next step',
      furthestStage: 2,
    });
  });

  after(async () => {
    if (editCallId) {
      await req('DELETE', `/api/calls/${editCallId}`);
    }
  });

  it('updates prospect name and company on completed call', async () => {
    const { status, body } = await req('PATCH', `/api/calls/${editCallId}`, {
      prospectName: 'Updated Prospect Name',
      company: 'Updated Corp Inc',
      nextStep: 'Updated next step',
    });
    assert.equal(status, 200);
    assert.equal(body.call.prospect_name, 'Updated Prospect Name');
    assert.equal(body.call.company, 'Updated Corp Inc');
    assert.equal(body.call.next_step, 'Updated next step');
    // Crucial: status must remain closed!
    assert.equal(body.call.status, 'closed');
  });

  it('updates stage notes without reopening the call', async () => {
    const { status, body } = await req('PATCH', `/api/calls/${editCallId}`, {
      stageResults: [
        { stageNumber: 2, whatHappened: ['engaged', 'skeptical'], prospectWords: 'Updated verbatim notes' }
      ]
    });
    assert.equal(status, 200);
    assert.equal(body.call.status, 'closed');
    const stage2 = body.call.stageResults.find(s => s.stage_number === 2);
    assert.ok(stage2);
    assert.equal(stage2.prospect_words, 'Updated verbatim notes');
  });

  it('preserves furthest_stage invariant (does not decrease)', async () => {
    const { status, body } = await req('PATCH', `/api/calls/${editCallId}`, {
      furthestStage: 1, // Attempt to decrease from 2
    });
    assert.equal(status, 200);
    assert.ok(body.call.furthest_stage >= 2, 'furthest_stage must not decrease');
  });

  it('rejects empty prospectName with 400', async () => {
    const { status, body } = await req('PATCH', `/api/calls/${editCallId}`, {
      prospectName: '   ',
    });
    assert.equal(status, 400);
    assert.ok(body.error?.message?.toLowerCase().includes('prospectname'));
  });

  it('rejects invalid outcome with 400', async () => {
    const { status, body } = await req('PATCH', `/api/calls/${editCallId}`, {
      outcome: 'fake_outcome',
    });
    assert.equal(status, 400);
  });
});

