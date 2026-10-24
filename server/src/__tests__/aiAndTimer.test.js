import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3001';

describe('Bug Fixes Verification: AI Suggestion and Timer Persistence', () => {
  let createdCallId;

  test('Creates a call for testing AI and timer duration', async () => {
    const res = await fetch(`${BASE_URL}/api/calls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prospectName: 'Dr. Vikram Malhotra',
        company: 'CloudPulse Networks',
        prospectTitle: 'VP Infrastructure',
      }),
    });
    assert.equal(res.status, 201);
    const json = await res.json();
    assert.ok(json.call?.id);
    createdCallId = json.call.id;
  });

  test('Saves stage notes and prospect words', async () => {
    const res = await fetch(`${BASE_URL}/api/calls/${createdCallId}/stages/2`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        whatHappened: ['engaged', 'skeptical'],
        prospectWords: 'We run 40 Kafka microservices and our latency spikes during evening reconciliation.',
      }),
    });
    assert.equal(res.status, 200);
  });

  test('AI summary generation succeeds with prospect words and stage notes', async () => {
    const res = await fetch(`${BASE_URL}/api/calls/${createdCallId}/suggest-close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stageResults: [
          {
            stageId: 2,
            selectedChips: ['engaged'],
            prospectWords: 'We run 40 Kafka microservices and our latency spikes during evening reconciliation.',
          },
        ],
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.aiAvailable, true);
    assert.ok(json.suggestion?.summary);
    assert.ok(typeof json.suggestion.summary === 'string');
    assert.ok(json.suggestion.suggestedOutcome);
  });

  test('Closes call with exact durationSeconds and freezes final duration', async () => {
    const DURATION_SECONDS = 185; // 3m 05s
    const res = await fetch(`${BASE_URL}/api/calls/${createdCallId}/close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome: 'next_step_agreed',
        nextStep: 'Architecture review call Thursday 2pm',
        summary: 'Agreed on Kafka latency evaluation.',
        summarySource: 'ai',
        furthestStage: 2,
        durationSeconds: DURATION_SECONDS,
      }),
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.call?.status, 'closed');

    // Verify mathematical duration calculation from persisted timestamps
    const started = new Date(json.call.started_at).getTime();
    const closed = new Date(json.call.closed_at).getTime();
    const diffSecs = Math.round((closed - started) / 1000);
    assert.equal(diffSecs, DURATION_SECONDS, 'Persisted duration must match frozen durationSeconds exactly');
  });

  test('Call remains completed and AI summary can be generated/regenerated on closed call without 409', async () => {
    const res = await fetch(`${BASE_URL}/api/calls/${createdCallId}/suggest-close`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    // Critical: Must NOT return 409 Conflict (which was the bug)
    assert.notEqual(res.status, 409, 'Must not reject closed calls with 409 Conflict');
    assert.ok([200, 503].includes(res.status), 'Expected 200 or 503 from Gemini service');

    const json = await res.json();
    if (res.status === 200) {
      assert.equal(json.aiAvailable, true);
      assert.ok(json.suggestion?.summary);
    } else {
      assert.equal(json.aiAvailable, false);
      assert.ok(json.error?.message);
    }

    // Verify call in database remains completed
    const getRes = await fetch(`${BASE_URL}/api/calls/${createdCallId}`);
    const getJson = await getRes.json();
    assert.equal(getJson.call?.status, 'closed');
  });
});
