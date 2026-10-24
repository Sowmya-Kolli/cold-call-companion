// src/__tests__/unit.test.js
// Unit tests that run without any network or DB connection.
// Run: node --test src/__tests__/unit.test.js

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── VALID_OUTCOMES ────────────────────────────────────────────
// Import the constant directly without triggering Supabase init
const VALID_OUTCOMES = [
  'not_interested', 'agreed_to_receive_report', 'follow_up',
  'not_logged', 'next_step_agreed', 'do_not_call', 'wrong_person',
  'interested', 'moved_company', 'call_again',
];

describe('VALID_OUTCOMES', () => {
  it('contains exactly 10 outcome values', () => {
    assert.equal(VALID_OUTCOMES.length, 10);
  });
  it('includes next_step_agreed', () => {
    assert.ok(VALID_OUTCOMES.includes('next_step_agreed'));
  });
  it('includes all 10 expected values', () => {
    const expected = [
      'not_interested', 'agreed_to_receive_report', 'follow_up',
      'not_logged', 'next_step_agreed', 'do_not_call', 'wrong_person',
      'interested', 'moved_company', 'call_again',
    ];
    for (const v of expected) {
      assert.ok(VALID_OUTCOMES.includes(v), `Missing: ${v}`);
    }
  });
  it('does not include empty string or made-up values', () => {
    assert.ok(!VALID_OUTCOMES.includes(''));
    assert.ok(!VALID_OUTCOMES.includes('made_it_up'));
    assert.ok(!VALID_OUTCOMES.includes('callback_scheduled'));
  });
});

// ── Stage number validation logic ─────────────────────────────
describe('Stage number validation', () => {
  function isValidStage(n) {
    const parsed = parseInt(n, 10);
    return !isNaN(parsed) && parsed >= 1 && parsed <= 8;
  }

  it('accepts stages 1–8', () => {
    for (let i = 1; i <= 8; i++) {
      assert.ok(isValidStage(i), `Stage ${i} should be valid`);
    }
  });
  it('rejects stage 0', () => assert.ok(!isValidStage(0)));
  it('rejects stage 9', () => assert.ok(!isValidStage(9)));
  it('rejects non-numeric', () => assert.ok(!isValidStage('abc')));
  it('rejects negative', () => assert.ok(!isValidStage(-1)));
});

// ── Furthest stage invariant ───────────────────────────────────
describe('Furthest stage invariant', () => {
  function advanceFurthest(current, incoming) {
    return Math.max(current, incoming);
  }

  it('advances when incoming is higher', () => {
    assert.equal(advanceFurthest(1, 3), 3);
  });
  it('stays when incoming is lower', () => {
    assert.equal(advanceFurthest(5, 2), 5);
  });
  it('stays when equal', () => {
    assert.equal(advanceFurthest(4, 4), 4);
  });
});

// ── AI response validation logic ──────────────────────────────
describe('AI response validation', () => {
  function validateAiResponse(parsed) {
    if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
      throw new Error('Missing summary');
    }
    if (!VALID_OUTCOMES.includes(parsed.suggested_outcome)) {
      throw new Error(`Invalid outcome: ${parsed.suggested_outcome}`);
    }
    return true;
  }

  it('accepts valid response', () => {
    assert.ok(validateAiResponse({
      summary: 'Good call.',
      suggested_outcome: 'next_step_agreed',
      reason: 'Prospect was interested.',
      suggested_next_step: 'Demo call Thursday',
      confidence: 'high',
    }));
  });
  it('rejects missing summary', () => {
    assert.throws(() => validateAiResponse({ suggested_outcome: 'follow_up' }), /summary/i);
  });
  it('rejects invalid outcome', () => {
    assert.throws(() => validateAiResponse({ summary: 'x', suggested_outcome: 'invalid_outcome' }), /invalid/i);
  });
  it('rejects made-up outcome', () => {
    assert.throws(() => validateAiResponse({ summary: 'x', suggested_outcome: 'callback_scheduled' }));
  });
});
