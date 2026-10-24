// ActiveCallPage.jsx — Main workspace during a live cold call
import { useState, useEffect, useRef, useCallback } from 'react';
import { STAGES } from '../data/mockData';
import StageTracker from './StageTracker';
import ActionChips from './ActionChips';
import EndCallModal from './EndCallModal';

// Colour dot for anticipated paths
function colorDotClass(color) {
  if (color === 'tertiary') return 'quote-dot-green';
  if (color === 'primary') return 'quote-dot-blue';
  if (color === 'error') return 'quote-dot-red';
  return 'quote-dot-grey';
}

function parseDuration(dur) {
  if (!dur || typeof dur !== 'string') return 0;
  const parts = dur.split(':').map(Number);
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

export default function ActiveCallPage({ call, onEndCall, onSaveStage }) {
  // ── State (initialized with call data for seamless Resume flow) ───
  const [currentStage, setCurrentStage] = useState(() => call?.furthestStage || 1);
  const [furthestStage, setFurthestStage] = useState(() => call?.furthestStage || 1);
  const [stageData, setStageData] = useState(() => {
    if (Array.isArray(call?.stageData) && call.stageData.length > 0) {
      return STAGES.map(s => {
        const found = call.stageData.find(sd => sd.stageId === s.id);
        return found
          ? { stageId: s.id, selectedChips: found.selectedChips || [], prospectWords: found.prospectWords || '' }
          : { stageId: s.id, selectedChips: [], prospectWords: '' };
      });
    }
    return STAGES.map(s => ({ stageId: s.id, selectedChips: [], prospectWords: '' }));
  });
  const [callTimer, setCallTimer] = useState(() => parseDuration(call?.duration));
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved
  const [showEndModal, setShowEndModal] = useState(false);

  const timerRef = useRef(null);

  // Start timer and guarantee cleanup on unmount
  useEffect(() => {
    timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // Format timer mm:ss
  const formatTimer = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // Current stage definition
  const stageDef = STAGES[currentStage - 1];
  // Current stage data
  const curData = stageData[currentStage - 1];

  // ── Actions ──────────────────────────────────────────────────
  const handleChipToggle = (chipId) => {
    setStageData(prev => prev.map((sd, idx) => {
      if (idx !== currentStage - 1) return sd;
      const has = sd.selectedChips.includes(chipId);
      return {
        ...sd,
        selectedChips: has
          ? sd.selectedChips.filter(c => c !== chipId)
          : [...sd.selectedChips, chipId],
      };
    }));
  };

  const handleWordsChange = (val) => {
    setStageData(prev => prev.map((sd, idx) =>
      idx === currentStage - 1 ? { ...sd, prospectWords: val } : sd
    ));
  };

  const handleSaveAndContinue = useCallback(async () => {
    setSaveStatus('saving');
    try {
      // Persist to backend (non-fatal if it fails — data lives in component state)
      await onSaveStage?.({ stageId: currentStage, ...curData });
    } catch {
      // save failure is non-fatal: user still navigates forward
    }
    setSaveStatus('saved');
    const nextStage = Math.min(currentStage + 1, 8);
    setCurrentStage(nextStage);
    setFurthestStage(prev => Math.max(prev, nextStage));
    setTimeout(() => setSaveStatus('idle'), 1500);
  }, [currentStage, curData, onSaveStage]);

  const handleStageSelect = (n) => {
    // Allow navigation to any stage up to furthestStage + 1
    if (n <= furthestStage + 1) {
      setCurrentStage(n);
      setFurthestStage(prev => Math.max(prev, n));
    }
  };

  // Freeze the timer immediately when opening End Call modal
  const handleOpenEndModal = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowEndModal(true);
  };

  // Resume the timer if the user closes the modal without ending the call
  const handleCloseEndModal = () => {
    setShowEndModal(false);
    if (!timerRef.current) {
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    }
  };

  // Permanently stop the timer and finalize duration
  const handleEndCallConfirm = (data) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setShowEndModal(false);
    onEndCall({ ...data, stageData, callTimer });
  };

  // Timeline entries (stages visited)
  const visitedStages = stageData.filter((sd, idx) =>
    idx + 1 <= furthestStage && (sd.selectedChips.length > 0 || sd.prospectWords)
  );

  return (
    <div className="page-wrapper" style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>phone_in_talk</span>
          <span className="crumb-bold">Active Call</span>
          <span className="crumb-sep">›</span>
          <span className="crumb-bold">{call.prospectName}</span>
          <span className="crumb-sep">·</span>
          <span>{call.company}</span>
        </div>
        <div className="topbar-right">
          <div className="timer-pill">
            <span className="timer-live-dot">
              <span className="live-dot-ping" style={{ background: 'var(--error)' }} />
              <span className="live-dot-core" style={{ background: 'var(--error)' }} />
            </span>
            <span className="timer-live-label">LIVE</span>
            <span className="timer-value" id="call-timer-display">{formatTimer(callTimer)}</span>
          </div>
          <div className="topbar-divider" />
          <button
            id="btn-end-call-top"
            className="btn-danger"
            onClick={handleOpenEndModal}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>call_end</span>
            End Call
          </button>
        </div>
      </div>

      {/* ── Flight Deck (Prospect header) ────────────────────── */}
      <div className="flight-deck">
        <div className="flight-deck-prospect">
          <div className="flight-deck-meta">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>business</span>
            <span className="accent">{call.company}</span>
            {call.companyType && <><span>·</span><span>{call.companyType}</span></>}
          </div>
          <div className="flight-deck-name-row">
            <span className="flight-deck-name">{call.prospectName}</span>
            {call.prospectTitle && (
              <span className="flight-deck-role">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>badge</span>
                <span className="flight-deck-company">{call.prospectTitle}</span>
              </span>
            )}
          </div>
          {(call.phone || call.location) && (
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              {call.phone && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>phone</span>
                  {call.phone}
                </span>
              )}
              {call.location && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                  {call.location}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flight-deck-controls">
          <span className="sync-label">
            {saveStatus === 'saved' && <><span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--tertiary)' }}>check_circle</span> Saved</>}
            {saveStatus === 'saving' && <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>sync</span> Saving…</>}
            {saveStatus === 'idle' && <><span className="material-symbols-outlined" style={{ fontSize: 14 }}>cloud_done</span> Auto-sync on</>}
          </span>
        </div>
      </div>

      {/* ── Stage Tracker ─────────────────────────────────────── */}
      <StageTracker
        currentStage={currentStage}
        furthestStage={furthestStage}
        onStageSelect={handleStageSelect}
        callTimer={callTimer}
        saveStatus={saveStatus}
      />

      {/* ── Cockpit Grid ──────────────────────────────────────── */}
      <div className="cockpit-grid" style={{ flex: 1 }}>
        {/* ── LEFT COLUMN ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>

          {/* Stage Guidance card */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary-container)' }}>
                  psychology
                </span>
                <span className="card-title">Stage {currentStage} — {stageDef.fullName}</span>
              </div>
              <span className="stage-badge">
                {stageDef.shortName}
              </span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
              {/* Purpose */}
              <div>
                <div className="section-label" style={{ marginBottom: 6 }}>Stage Purpose</div>
                <div className="directive-box">
                  <div className="directive-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>flag</span>
                  </div>
                  <div className="directive-text">{stageDef.purpose}</div>
                </div>
              </div>

              {/* Directive */}
              <div>
                <div className="section-label" style={{ marginBottom: 6 }}>Guidance</div>
                <div style={{
                  padding: 'var(--space-md)',
                  background: 'var(--surface-low)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 13,
                  lineHeight: '20px',
                  color: 'var(--on-surface-variant)',
                  borderLeft: '3px solid var(--primary-fixed-dim)',
                }}>
                  {stageDef.directive}
                </div>
              </div>

              {/* Anticipated paths */}
              <div>
                <div className="section-label" style={{ marginBottom: 8 }}>Likely Prospect Responses</div>
                <div className="quote-cards-grid">
                  {stageDef.anticipatedPaths.map((path, i) => (
                    <div key={i} className="quote-card">
                      <div className="quote-card-top">
                        <span className={`quote-dot ${colorDotClass(path.color)}`} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {path.type}
                        </span>
                      </div>
                      <div className="quote-text">{path.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action chips */}
              <div>
                <div className="section-label" style={{ marginBottom: 8 }}>What Happened?</div>
                <ActionChips
                  chips={stageDef.actionChips}
                  selectedChips={curData.selectedChips}
                  onToggle={handleChipToggle}
                />
              </div>

              {/* Prospect's exact words */}
              <div>
                <div className="section-label" style={{ marginBottom: 6 }}>
                  Prospect's Exact Words
                </div>
                <textarea
                  id={`prospect-words-stage-${currentStage}`}
                  rows={3}
                  placeholder={`Record what ${call.prospectName?.split(' ')[0] || 'the prospect'} said at this stage…`}
                  value={curData.prospectWords}
                  onChange={e => handleWordsChange(e.target.value)}
                  style={{ fontStyle: curData.prospectWords ? 'italic' : 'normal' }}
                />
                <div className="scratchpad-footer" style={{ marginTop: 4 }}>
                  <span className="scratchpad-hint">
                    <span className="kbd-inline">Shift</span> + <span className="kbd-inline">Enter</span> for new line
                  </span>
                  {curData.prospectWords && (
                    <span className="scratchpad-saved">
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>lock</span>
                      Captured
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stage footer navigation */}
            <div className="stage-footer">
              <button
                id="btn-prev-stage"
                className="btn-secondary"
                onClick={() => currentStage > 1 && setCurrentStage(s => s - 1)}
                disabled={currentStage === 1}
                style={{ opacity: currentStage === 1 ? 0.4 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                Previous
              </button>
              <span className="stage-footer-hint">
                Stage {currentStage} of 8
              </span>
              <button
                id="btn-save-continue"
                className="btn-primary"
                onClick={handleSaveAndContinue}
              >
                {currentStage === 8 ? (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                    Save Stage
                  </>
                ) : (
                  <>
                    Save & Continue
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Battlecard */}
          <div className="battlecard">
            <div className="battlecard-header">
              <div className="battlecard-title-row">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary-container)' }}>
                  auto_fix_high
                </span>
                <span className="battlecard-title">{stageDef.battlecard.title}</span>
              </div>
              <span className="battlecard-rec">Recommended Script</span>
            </div>
            <div className="battlecard-body">
              {stageDef.battlecard.content}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

          {/* Prospect Profile */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary-container)' }}>
                  person
                </span>
                <span className="card-title">Prospect Profile</span>
              </div>
            </div>
            <div className="card-body">
              <div className="prospect-profile-grid">
                <div className="profile-field">
                  <span className="profile-label">Name</span>
                  <span className="profile-value">{call.prospectName}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-label">Title</span>
                  <span className="profile-value">{call.prospectTitle || '—'}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-label">Company</span>
                  <span className="profile-value">{call.company}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-label">Segment</span>
                  <span className="profile-value">{call.companyType || '—'}</span>
                </div>
                {call.email && (
                  <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="profile-label">Email</span>
                    <span className="profile-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{call.email}</span>
                  </div>
                )}
                {call.location && (
                  <div className="profile-field" style={{ gridColumn: '1 / -1' }}>
                    <span className="profile-label">Location</span>
                    <span className="profile-value">{call.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call Timeline */}
          <div className="card">
            <div className="card-header">
              <div className="card-header-left">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary-container)' }}>
                  timeline
                </span>
                <span className="card-title">Call Timeline</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                {visitedStages.length} stage{visitedStages.length !== 1 ? 's' : ''} logged
              </span>
            </div>
            <div className="card-body">
              {visitedStages.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                  <span className="material-symbols-outlined empty-state-icon">timeline</span>
                  <span style={{ fontSize: 12 }}>
                    Stage notes will appear here as you progress
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {stageData.map((sd, idx) => {
                    const stageN = idx + 1;
                    const def = STAGES[idx];
                    if (stageN > furthestStage) return null;
                    const hasData = sd.selectedChips.length > 0 || sd.prospectWords;
                    if (!hasData && stageN < furthestStage) return null;
                    const isCurrent = stageN === currentStage;
                    return (
                      <div key={sd.stageId} className="timeline-entry">
                        <div className="timeline-col">
                          <div className={`timeline-dot ${isCurrent ? 'current' : 'done'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>
                              {isCurrent ? 'radio_button_checked' : 'check'}
                            </span>
                          </div>
                          {stageN < furthestStage && <div className="timeline-line" />}
                        </div>
                        <div className="timeline-content">
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            <span className="timeline-stage-name">{def.name}</span>
                            {isCurrent && (
                              <span className="timeline-time" style={{ color: 'var(--error)', fontSize: 10 }}>• LIVE</span>
                            )}
                          </div>
                          {sd.selectedChips.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                              {sd.selectedChips.map(chipId => {
                                const chip = def.actionChips.find(c => c.id === chipId);
                                return chip ? (
                                  <span key={chipId} style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 10,
                                    background: 'var(--surface-container)',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--radius-full)',
                                    color: 'var(--on-surface-variant)',
                                  }}>
                                    {chip.label}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          {sd.prospectWords && (
                            <div className="timeline-note" style={{ fontStyle: 'italic' }}>
                              {sd.prospectWords.length > 80
                                ? sd.prospectWords.slice(0, 80) + '…'
                                : sd.prospectWords}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Quick End Call */}
          <button
            id="btn-end-call-sidebar"
            className="btn-danger"
            style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14, borderRadius: 'var(--radius-2xl)' }}
            onClick={handleOpenEndModal}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>call_end</span>
            End & Save Call
          </button>
        </div>
      </div>

      {/* ── End Call Modal ────────────────────────────────────── */}
      {showEndModal && (
        <EndCallModal
          call={call}
          currentStage={currentStage}
          furthestStage={furthestStage}
          callTimer={callTimer}
          stageData={stageData}
          onConfirm={handleEndCallConfirm}
          onClose={handleCloseEndModal}
        />
      )}
    </div>
  );
}
