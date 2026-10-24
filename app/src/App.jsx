// App.jsx — Root component: state management, routing, page composition
// Phase 2: all call persistence now goes through the Express backend.
// localStorage is kept as a read-through fallback when the backend
// is unreachable (offline dev / no-backend mode).

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { STAGES, loadCalls, saveCalls, SAMPLE_DEMO_CALLS, isDemoDataActive, setDemoDataActive } from './data/mockData';
import {
  createCall as apiCreateCall,
  fetchCalls,
  fetchCall,
  saveStage as apiSaveStage,
  closeCall as apiCloseCall,
  updateCall as apiUpdateCall,
} from './api/callsApi';
import Sidebar from './components/Sidebar';
import ActiveCallPage from './components/ActiveCallPage';
import CallHistoryPage from './components/CallHistoryPage';
import CallDetailsPage from './components/CallDetailsPage';
import PlaybookPage from './components/PlaybookPage';
import SettingsPage from './components/SettingsPage';
import { loadSettings } from './data/settingsStorage';
import NewCallModal from './components/NewCallModal';

// ── Helpers ───────────────────────────────────────────────────
function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function getTimeLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Map a Supabase row → the shape the existing UI components expect
function mapDbCallToUi(dbCall, stageResults = []) {
  return {
    id:            dbCall.id,
    _isFromDb:     true,
    _localOnly:    false,
    _isDemo:       false,
    prospectName:  dbCall.prospect_name,
    prospectTitle: dbCall.prospect_role   || '',
    company:       dbCall.company         || '',
    companyType:   dbCall.company_type    || '',
    phone:         dbCall.prospect_phone  || '',
    email:         dbCall.prospect_email  || '',
    location:      dbCall.prospect_location || '',
    timezone:      'IST (UTC+5:30)',
    date:          dbCall.started_at
      ? new Date(dbCall.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : getTodayLabel(),
    time:          dbCall.started_at
      ? new Date(dbCall.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : getTimeLabel(),
    duration:      dbCall.closed_at && dbCall.started_at
      ? formatDuration(new Date(dbCall.closed_at) - new Date(dbCall.started_at))
      : '00:00',
    furthestStage: dbCall.furthest_stage  || 1,
    outcome:       dbCall.outcome         || null,
    nextStep:      dbCall.next_step       || '',
    summary:       dbCall.summary         || '',
    callSynthesis: dbCall.summary         || '',
    status:        dbCall.status,
    llmSuggestedOutcome: dbCall.llm_suggested_outcome || null,
    stageData:     stageResults.map(sr => ({
      stageId:       sr.stage_number,
      selectedChips: (() => { try { return JSON.parse(sr.what_happened || '[]'); } catch { return []; } })(),
      prospectWords: sr.prospect_words || '',
      timestamp:     sr.updated_at
        ? new Date(sr.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : null,
    })),
    techStack:          [],
    icpScore:           null,
    accountIntelligence:null,
    primaryPain:        null,
    infraFootprint:     null,
    complianceGating:   null,
  };
}

function formatDuration(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const s = (totalSecs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  // History list — loaded from backend; fallback to localStorage
  const [calls, setCalls]           = useState(() => loadCalls());
  const [callsLoading, setCallsLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Evaluator demo mode state
  const [demoActive, setDemoActive] = useState(() => isDemoDataActive());

  // App settings & profile
  const [settings, setSettings]     = useState(() => loadSettings());

  // Navigation
  const [page, setPage]             = useState('history');
  const [selectedCallId, setSelectedCallId] = useState(null);

  // Active call — in-progress call state
  const [activeCall, setActiveCall] = useState(null);
  const activeCallRef = useRef(null);

  // New call modal
  const [showNewCallModal, setShowNewCallModal] = useState(false);

  // Keep ref in sync
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  // Combined calls view: real user calls + optional sample demo calls (clearly tagged)
  const displayCalls = useMemo(() => {
    if (!demoActive) return calls;
    const realIds = new Set(calls.map(c => c.id));
    const demoItems = SAMPLE_DEMO_CALLS.filter(d => !realIds.has(d.id));
    return [...demoItems, ...calls];
  }, [calls, demoActive]);

  // ── Load call history from backend ────────────────────────────
  const loadHistory = useCallback(async () => {
    setCallsLoading(true);
    setFetchError(null);
    try {
      const { calls: dbCalls } = await fetchCalls();
      const uiCalls = (dbCalls || []).map(c => mapDbCallToUi(c));
      setCalls(uiCalls);
      saveCalls(uiCalls); // keep localStorage in sync as fallback
      setBackendOnline(true);
      setFetchError(null);
    } catch (err) {
      console.warn('[App] Backend unavailable, using localStorage:', err.message);
      setBackendOnline(false);
      setFetchError(err.message || 'Backend server is unreachable');
    } finally {
      setCallsLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Demo data toggles ─────────────────────────────────────────
  const handleLoadDemoData = useCallback(() => {
    setDemoDataActive(true);
    setDemoActive(true);
  }, []);

  const handleClearDemoData = useCallback(() => {
    setDemoDataActive(false);
    setDemoActive(false);
  }, []);

  // ── Navigation ────────────────────────────────────────────────
  const navigate = useCallback((target) => {
    if (target === 'new-call') { setShowNewCallModal(true); return; }
    if (target === 'active-call' && !activeCall) { setShowNewCallModal(true); return; }
    setPage(target);
  }, [activeCall]);

  // ── Resume in-progress call ───────────────────────────────────
  const handleResumeCall = useCallback((call) => {
    setActiveCall(call);
    setPage('active-call');
  }, []);

  // ── Edit historical call ──────────────────────────────────────
  const handleUpdateCall = useCallback(async (callId, fields) => {
    // If it's a demo item, update local presentation without API call
    const isDemo = displayCalls.find(c => c.id === callId)?._isDemo;
    if (isDemo) {
      return { success: true };
    }

    try {
      const res = await apiUpdateCall(callId, fields);
      if (res && res.call) {
        // Map backend update to UI shape
        const updatedUi = mapDbCallToUi(res.call, res.call.stageResults || []);
        setCalls(prev => {
          const next = prev.map(c => c.id === callId ? { ...c, ...updatedUi } : c);
          saveCalls(next);
          return next;
        });
        return { success: true, call: updatedUi };
      }
      return res;
    } catch (err) {
      console.error('[App] Failed to update call:', err);
      throw err;
    }
  }, [displayCalls]);

  // ── New call ──────────────────────────────────────────────────
  const handleStartCall = useCallback(async (formData) => {
    setShowNewCallModal(false);

    const callPayload = {
      ...formData,
      callerName: formData.callerName || settings.callerName || 'FDE',
    };

    try {
      const { call: dbCall } = await apiCreateCall(callPayload);
      const uiCall = mapDbCallToUi(dbCall);
      setActiveCall({ ...uiCall, _dbId: dbCall.id });
      setPage('active-call');
    } catch (err) {
      console.error('[App] Failed to create call via API:', err.message);
      const localCall = {
        id:            `local-${Date.now()}`,
        _localOnly:    true,
        prospectName:  formData.prospectName,
        prospectTitle: formData.prospectTitle || '',
        company:       formData.company || '',
        companyType:   formData.companyType || '',
        phone:         formData.phone || '',
        email:         formData.email || '',
        location:      formData.location || '',
        timezone:      'IST (UTC+5:30)',
        date:          getTodayLabel(),
        time:          getTimeLabel(),
        duration:      '00:00',
        furthestStage: 1,
        outcome:       null,
        nextStep:      '',
        summary:       '',
        callSynthesis: '',
        stageData:     [],
        techStack:     [],
        icpScore:      null,
        accountIntelligence: null,
      };
      setActiveCall(localCall);
      setPage('active-call');
      alert(`⚠️ Backend unreachable. Call will be saved locally only.\n\nError: ${err.message}`);
    }
  }, [settings.callerName]);

  // ── Save stage ────────────────────────────────────────────────
  const handleSaveStage = useCallback(async ({ stageId, selectedChips, prospectWords }) => {
    const call = activeCallRef.current;
    if (!call || call._localOnly) return;

    try {
      await apiSaveStage(call.id, stageId, selectedChips, prospectWords);
    } catch (err) {
      console.warn('[App] saveStage failed (non-fatal):', err.message);
    }
  }, []);

  // ── End call ──────────────────────────────────────────────────
  const handleEndCall = useCallback(async ({ outcome, nextStep, summary, summarySource, furthestStage, stageData, callTimer }) => {
    if (!activeCall) return;

    const mins = Math.floor(callTimer / 60).toString().padStart(2, '0');
    const secs = (callTimer % 60).toString().padStart(2, '0');
    const duration = `${mins}:${secs}`;

    const completedCall = {
      ...activeCall,
      duration,
      furthestStage,
      outcome,
      nextStep,
      summary,
      status: 'closed',
      callSynthesis: summary ||
        `Call with ${activeCall.prospectName} at ${activeCall.company}. ` +
        `Reached stage ${furthestStage} — ${STAGES[furthestStage - 1]?.name}. ` +
        `Outcome: ${outcome}. Next step: ${nextStep || 'None recorded'}.`,
      stageData: stageData
        .filter(sd => sd.selectedChips.length > 0 || sd.prospectWords)
        .map(sd => ({
          ...sd,
          timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        })),
    };

    setActiveCall(null);
    setSelectedCallId(completedCall.id);
    setPage('call-details');

    if (!activeCall._localOnly) {
      try {
        if (stageData.length > 0) {
          const finalStage = stageData[furthestStage - 1];
          if (finalStage) {
            await apiSaveStage(
              activeCall.id, furthestStage,
              finalStage.selectedChips, finalStage.prospectWords
            ).catch(() => {});
          }
        }
        const { call: closed } = await apiCloseCall(activeCall.id, {
          outcome, nextStep, summary,
          summarySource: summarySource || 'manual',
          furthestStage,
          durationSeconds: callTimer,
        });
        const confirmedCall = {
          ...mapDbCallToUi(closed, completedCall.stageData.map((sd, i) => ({
            stage_number: sd.stageId || i + 1,
            what_happened: JSON.stringify(sd.selectedChips),
            prospect_words: sd.prospectWords,
            updated_at: new Date().toISOString(),
          }))),
          duration, // Ensure the exact frozen duration is preserved
        };
        setCalls(prev => {
          const updated = [confirmedCall, ...prev.filter(c => c.id !== confirmedCall.id)];
          saveCalls(updated);
          return updated;
        });
        setSelectedCallId(confirmedCall.id);
      } catch (err) {
        console.error('[App] Failed to close call via API:', err.message);
        setCalls(prev => {
          const updated = [completedCall, ...prev.filter(c => c.id !== completedCall.id)];
          saveCalls(updated);
          return updated;
        });
      }
    } else {
      setCalls(prev => {
        const updated = [completedCall, ...prev.filter(c => c.id !== completedCall.id)];
        saveCalls(updated);
        return updated;
      });
    }
  }, [activeCall]);

  // ── View call details ─────────────────────────────────────────
  const handleViewCall = useCallback(async (callId) => {
    setSelectedCallId(callId);
    setPage('call-details');
    // If it's a demo item, don't try to fetch from Supabase
    if (callId.startsWith('demo-')) return;
    try {
      const { call: dbCall } = await fetchCall(callId);
      const uiCall = mapDbCallToUi(dbCall, dbCall.stageResults || []);
      setCalls(prev => prev.map(c => c.id === callId ? uiCall : c));
    } catch {
      // Use state fallback
    }
  }, []);

  // ── Guard: redirect away from active-call if no call in progress
  useEffect(() => {
    if (page === 'active-call' && !activeCall) setPage('history');
  }, [page, activeCall]);

  // ── Render ────────────────────────────────────────────────────
  const selectedCall = displayCalls.find(c => c.id === selectedCallId) || null;

  const renderPage = () => {
    switch (page) {
      case 'active-call':
        if (!activeCall) return null;
        return (
          <ActiveCallPage
            call={activeCall}
            onEndCall={handleEndCall}
            onSaveStage={handleSaveStage}
          />
        );
      case 'call-details':
        return (
          <CallDetailsPage
            call={selectedCall}
            onBack={() => { setPage('history'); loadHistory(); }}
            onResumeCall={handleResumeCall}
            onUpdateCall={handleUpdateCall}
          />
        );
      case 'playbook':
        return <PlaybookPage onStartCallWithStage={() => setShowNewCallModal(true)} />;
      case 'settings':
        return (
          <SettingsPage
            onSettingsChange={(newSettings) => setSettings(newSettings)}
            onClearCache={() => {
              localStorage.removeItem('ccc_calls_v2');
              localStorage.removeItem('ccc_calls_cache');
              localStorage.removeItem('ccc_demo_active');
              setDemoActive(false);
              loadHistory();
            }}
          />
        );
      case 'history':
      default:
        return (
          <CallHistoryPage
            calls={displayCalls}
            loading={callsLoading}
            backendOnline={backendOnline}
            error={fetchError}
            onRetry={loadHistory}
            onViewCall={handleViewCall}
            onResumeCall={handleResumeCall}
            onNewCall={() => setShowNewCallModal(true)}
            onLoadDemoData={handleLoadDemoData}
            onClearDemoData={handleClearDemoData}
            hasDemoData={demoActive}
          />
        );
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        currentPage={page}
        onNavigate={navigate}
        activeCallExists={!!activeCall}
        callCount={displayCalls.length}
        settings={settings}
      />
      <main className="main-area">
        {renderPage()}
      </main>
      {showNewCallModal && (
        <NewCallModal
          onStart={handleStartCall}
          onClose={() => setShowNewCallModal(false)}
        />
      )}
    </div>
  );
}
