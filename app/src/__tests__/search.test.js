import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { filterCalls } from '../utils/callSearch.js';

describe('Call History Search and Filtering', () => {
  const sampleCalls = [
    {
      id: 'call-1',
      prospectName: 'Kavita Menon',
      prospectTitle: 'VP Infrastructure',
      company: 'DataFlow Systems',
      companyType: 'Enterprise B2B',
      phone: '+91 98765 43210',
      email: 'kavita@dataflow.io',
      location: 'Bengaluru, KA',
      outcome: 'next_step_agreed',
      nextStep: 'Send technical architecture deck and follow up Friday',
      summary: 'Discussed migrating legacy monitoring stack to unified observability.',
    },
    {
      id: 'call-2',
      prospectName: 'Marcus Vance',
      prospectTitle: 'Head of Reliability',
      company: 'FinTech Cloud Inc',
      companyType: 'FinTech',
      phone: '+1 415 555 2671',
      email: 'm.vance@fintechcloud.com',
      location: 'San Francisco, CA',
      outcome: 'callback_scheduled',
      nextStep: 'Callback on Tuesday 2pm PST',
      summary: 'High interest in incident response automation. Busy during audit.',
    },
    {
      id: 'call-3',
      prospectName: 'Aarav Patel',
      prospectTitle: 'Lead DevOps Engineer',
      company: 'LogiX Solutions',
      companyType: 'Mid-Market SaaS',
      phone: '+91 80 4123 4567',
      email: 'aarav@logix.dev',
      location: 'Hyderabad, TS',
      outcome: 'not_interested',
      nextStep: 'Do not contact for 6 months',
      summary: 'Currently locked into a 3-year contract with Datadog.',
    },
  ];

  test('matches by prospect name (exact, case-insensitive)', () => {
    const results = filterCalls(sampleCalls, 'kavita');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-1');
  });

  test('matches with leading and trailing whitespace (trimmed matching)', () => {
    const results = filterCalls(sampleCalls, '   Marcus   ');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-2');
  });

  test('matches by company name (case-insensitive substring)', () => {
    const results = filterCalls(sampleCalls, 'FINTECH');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-2');
  });

  test('matches by phone number', () => {
    const results = filterCalls(sampleCalls, '98765');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-1');
  });

  test('matches by title/role', () => {
    const results = filterCalls(sampleCalls, 'devops');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-3');
  });

  test('matches by next step text', () => {
    const results = filterCalls(sampleCalls, 'architecture deck');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-1');
  });

  test('matches by summary verbatim text', () => {
    const results = filterCalls(sampleCalls, 'datadog');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-3');
  });

  test('matches by human-readable outcome label', () => {
    const results = filterCalls(sampleCalls, 'Next Step Agreed');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-1');
  });

  test('clearing search (empty string or whitespace only) returns all calls', () => {
    assert.equal(filterCalls(sampleCalls, '').length, 3);
    assert.equal(filterCalls(sampleCalls, '   ').length, 3);
  });

  test('returns empty array when query does not match any calls', () => {
    const results = filterCalls(sampleCalls, 'NonExistentProspectX99');
    assert.equal(results.length, 0);
  });

  test('handles empty input calls array safely', () => {
    const results = filterCalls([], 'kavita');
    assert.equal(results.length, 0);
  });

  test('combines search query with outcome filter correctly (AND logic)', () => {
    // Both query 'data' and outcome 'next_step_agreed' match call-1
    const matchBoth = filterCalls(sampleCalls, 'data', 'next_step_agreed');
    assert.equal(matchBoth.length, 1);
    assert.equal(matchBoth[0].id, 'call-1');

    // Query 'data' matches call-1 and call-3 (Datadog in summary), but outcome 'not_interested' only matches call-3
    const matchDatadogNotInterested = filterCalls(sampleCalls, 'data', 'not_interested');
    assert.equal(matchDatadogNotInterested.length, 1);
    assert.equal(matchDatadogNotInterested[0].id, 'call-3');

    // Query matches call-1, but filter requires 'callback_scheduled' -> 0 results
    const mismatch = filterCalls(sampleCalls, 'kavita', 'callback_scheduled');
    assert.equal(mismatch.length, 0);
  });

  test('outcome filter alone without search query filters properly', () => {
    const results = filterCalls(sampleCalls, '', 'callback_scheduled');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'call-2');
  });
});
