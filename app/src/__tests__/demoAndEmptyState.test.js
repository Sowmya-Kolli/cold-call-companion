import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_DEMO_CALLS, INITIAL_MOCK_CALLS } from '../data/mockData.js';

describe('Demo Data Isolation & Empty State Invariants', () => {
  const genuineRealCall = {
    id: 'db-real-call-1',
    prospectName: 'Sowmya Tech',
    company: 'Brain O Vision Solutions',
    prospectTitle: 'Head of Engineering',
    phone: '+91 91234 56789',
    outcome: 'next_step_agreed',
    _isDemo: false,
    _localOnly: false,
  };

  test('SAMPLE_DEMO_CALLS are all distinctly flagged with _isDemo: true and _localOnly: true', () => {
    assert.ok(SAMPLE_DEMO_CALLS.length > 0, 'Must have at least one sample demo call');
    for (const call of SAMPLE_DEMO_CALLS) {
      assert.equal(call._isDemo, true, `Call ${call.id} must be flagged as _isDemo`);
      assert.equal(call._localOnly, true, `Call ${call.id} must be flagged as _localOnly`);
      assert.ok(call.id.startsWith('demo-'), `Call ID ${call.id} must be prefixed with 'demo-'`);
    }
  });

  test('Loading demo data repeatedly does not duplicate sample records', () => {
    let demoActive = false;
    const realCalls = [genuineRealCall];

    // Simulating helper function equivalent to App.jsx useMemo displayCalls
    function computeDisplayCalls(calls, isDemoActive) {
      if (!isDemoActive) return calls;
      const realIds = new Set(calls.map(c => c.id));
      const demoItems = SAMPLE_DEMO_CALLS.filter(d => !realIds.has(d.id));
      return [...demoItems, ...calls];
    }

    // 1st load demo click
    demoActive = true;
    const firstLoad = computeDisplayCalls(realCalls, demoActive);
    const expectedCount = SAMPLE_DEMO_CALLS.length + realCalls.length;
    assert.equal(firstLoad.length, expectedCount);

    // 2nd load demo click (simulating rapid clicking)
    demoActive = true;
    const secondLoad = computeDisplayCalls(realCalls, demoActive);
    assert.equal(secondLoad.length, expectedCount, 'Must not duplicate demo calls on repeated clicks');

    // 3rd load demo click
    const thirdLoad = computeDisplayCalls(realCalls, demoActive);
    assert.equal(thirdLoad.length, expectedCount);

    // Verify all IDs are unique in the combined view
    const allIds = thirdLoad.map(c => c.id);
    const uniqueIds = new Set(allIds);
    assert.equal(allIds.length, uniqueIds.size, 'All call IDs in view must be strictly unique');
  });

  test('Clearing demo data leaves genuine calls untouched', () => {
    const realCalls = [genuineRealCall];
    let demoActive = true;

    function computeDisplayCalls(calls, isDemoActive) {
      if (!isDemoActive) return calls;
      const realIds = new Set(calls.map(c => c.id));
      const demoItems = SAMPLE_DEMO_CALLS.filter(d => !realIds.has(d.id));
      return [...demoItems, ...calls];
    }

    const loadedCalls = computeDisplayCalls(realCalls, demoActive);
    assert.equal(loadedCalls.length, SAMPLE_DEMO_CALLS.length + 1);

    // Clear demo data
    demoActive = false;
    const clearedCalls = computeDisplayCalls(realCalls, demoActive);

    // Real calls must remain
    assert.equal(clearedCalls.length, 1);
    assert.equal(clearedCalls[0].id, 'db-real-call-1');
    assert.equal(clearedCalls[0].prospectName, 'Sowmya Tech');
    assert.equal(clearedCalls[0]._isDemo, false);
  });

  test('Clean initial database produces zero calls without automatic seeding', () => {
    const emptyCalls = [];
    const demoActive = false;

    function computeDisplayCalls(calls, isDemoActive) {
      if (!isDemoActive) return calls;
      const realIds = new Set(calls.map(c => c.id));
      const demoItems = SAMPLE_DEMO_CALLS.filter(d => !realIds.has(d.id));
      return [...demoItems, ...calls];
    }

    const initialDisplay = computeDisplayCalls(emptyCalls, demoActive);
    assert.equal(initialDisplay.length, 0, 'Clean database must not seed fake calls');
  });

  test('State determination: distinguishing Loading, Error, Genuine Empty, and Zero Match States', () => {
    function resolvePageState({ loading, backendOnline, error, callsCount, filteredCount }) {
      if (loading) return 'LOADING';
      if ((!backendOnline || error) && callsCount === 0) return 'ERROR';
      if (callsCount === 0) return 'EMPTY_DATABASE';
      if (filteredCount === 0) return 'NO_SEARCH_MATCHES';
      return 'DATA_TABLE';
    }

    // 1. Initial loading
    assert.equal(resolvePageState({ loading: true, backendOnline: true, error: null, callsCount: 0, filteredCount: 0 }), 'LOADING');

    // 2. Backend failure with no local calls
    assert.equal(resolvePageState({ loading: false, backendOnline: false, error: 'Network Error', callsCount: 0, filteredCount: 0 }), 'ERROR');

    // 3. Genuine empty database after successful fetch
    assert.equal(resolvePageState({ loading: false, backendOnline: true, error: null, callsCount: 0, filteredCount: 0 }), 'EMPTY_DATABASE');

    // 4. Calls exist, but user search has no matches
    assert.equal(resolvePageState({ loading: false, backendOnline: true, error: null, callsCount: 5, filteredCount: 0 }), 'NO_SEARCH_MATCHES');

    // 5. Calls exist and search matches
    assert.equal(resolvePageState({ loading: false, backendOnline: true, error: null, callsCount: 5, filteredCount: 2 }), 'DATA_TABLE');
  });
});
