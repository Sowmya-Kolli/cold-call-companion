// EndCallModal.jsx — Modal for ending a call with outcome + next step
// Phase 2: includes real AI suggestion via Gemini (advisory only).
import { useState } from 'react';
import { OUTCOMES, STAGES } from '../data/mockData';
import { suggestClose } from '../api/callsApi';

export default function EndCallModal({ call, currentStage, furthestStage, callTimer, stageData = [], onConfirm, onClose }) {
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [nextStep, setNextStep]               = useState('');
  const [summary, setSummary]                 = useState('');

  // AI suggestion state
  const [aiState, setAiState]   = useState('idle'); // idle | loading | done | error | unavailable
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError]   = useState('');

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const handleConfirm = () => {
    if (!selectedOutcome) return;
    const isAiSummary = Boolean(aiResult?.summary && summary === aiResult.summary);
    onConfirm({
      outcome:       selectedOutcome,
      nextStep,
      summary,
      summarySource: isAiSummary ? 'ai' : summary ? 'manual' : 'none',
      furthestStage,
      duration:      formatTime(callTimer),
    });
  };

  // ── AI suggestion ────────────────────────────────────────────
  const handleRequestSuggestion = async () => {
    // Prevent duplicate concurrent requests
    if (aiState === 'loading') return;

    if (!call?.id || call._localOnly) {
      setAiState('unavailable');
      setAiError('AI suggestion requires the call to be saved to the backend.');
      return;
    }
    setAiState('loading');
    setAiResult(null);
    setAiError('');

    const result = await suggestClose(call.id, { stageData });

    if (!result.aiAvailable) {
      setAiState('error');
      setAiError(result.error?.message || 'AI suggestion unavailable right now.');
      return;
    }

    setAiResult(result.suggestion);
    setAiState('done');

    // Pre-fill summary if empty; pre-select next step if available
    if (!summary && result.suggestion?.summary) {
      setSummary(result.suggestion.summary);
    }
    if (!nextStep && result.suggestion?.suggestedNextStep) {
      setNextStep(result.suggestion.suggestedNextStep);
    }
  };

  const stageName = STAGES[furthestStage - 1]?.name || 'Unknown';

  // Map outcome IDs from OUTCOMES constant (frontend) to VALID_OUTCOMES (backend)
  // They already match — but we use the OUTCOMES list for display
  const displayOutcomes = OUTCOMES;

  return (
    <div
      className="modal-overlay"
      id="end-call-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" id="end-call-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>call_end</span>
            </div>
            <div>
              <div className="modal-title" id="modal-title">End Call</div>
              <div className="modal-subtitle">Record the outcome before closing</div>
            </div>
          </div>
          <button id="modal-close-btn" className="modal-close" onClick={onClose} aria-label="Close modal">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Call summary row */}
          <div className="modal-call-info">
            <div className="modal-info-col">
              <span className="modal-info-label">Prospect</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--on-surface)', marginTop: 2 }}>
                {call?.prospectName || 'Unknown'}
              </span>
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                {call?.prospectTitle} · {call?.company}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="modal-info-col" style={{ alignItems: 'flex-end' }}>
                <span className="modal-info-label">Duration</span>
                <span className="modal-info-value">{formatTime(callTimer)}</span>
              </div>
              <div className="modal-info-col" style={{ alignItems: 'flex-end' }}>
                <span className="modal-info-label">Furthest Stage</span>
                <span className="modal-info-stage">Stage {furthestStage} — {stageName}</span>
              </div>
            </div>
          </div>

          {/* AI Suggestion panel */}
          <div style={{
            background: aiState === 'done' ? 'rgba(111,251,190,0.08)' : 'var(--surface-low)',
            borderRadius: 'var(--radius-lg)',
            padding: 12,
            border: `1px ${aiState === 'done' ? 'solid' : 'dashed'} ${
              aiState === 'done' ? 'var(--tertiary)' : 'var(--outline-variant)'
            }`,
            transition: 'all 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className="material-symbols-outlined" style={{
                fontSize: 16,
                color: aiState === 'done' ? 'var(--tertiary)' : 'var(--primary-container)',
                animation: aiState === 'loading' ? 'spin 1s linear infinite' : 'none',
              }}>
                {aiState === 'loading' ? 'sync' : aiState === 'done' ? 'check_circle' : 'auto_awesome'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {aiState === 'done' ? 'Gemini AI Summary' : 'AI Summary · Gemini'}
              </span>
              {aiState === 'idle' && (
                <button
                  id="btn-ai-suggest"
                  onClick={handleRequestSuggestion}
                  style={{
                    marginLeft: 'auto',
                    height: 24,
                    padding: '0 8px',
                    background: 'var(--primary-container)',
                    color: 'var(--on-primary)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
                  Generate
                </button>
              )}
              {aiState === 'loading' && (
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--on-surface-variant)' }}>
                  Analyzing call…
                </span>
              )}
              {aiState === 'done' && (
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)', padding: '1px 6px', borderRadius: 4 }}>
                  Advisory only · {aiResult?.confidence || 'low'} confidence
                </span>
              )}
            </div>

            {/* Idle state */}
            {aiState === 'idle' && (
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                Click <strong>Generate</strong> to get an AI-powered call summary and outcome suggestion based on your stage notes.
                Your final choice always overrides the suggestion.
              </div>
            )}

            {/* Loading */}
            {aiState === 'loading' && (
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                Gemini is reading your stage notes…
              </div>
            )}

            {/* Error / unavailable with Retry */}
            {(aiState === 'error' || aiState === 'unavailable') && (
              <div style={{ fontSize: 12, color: 'var(--error)', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                  <span><strong>AI generation unavailable:</strong> {aiError || 'Please try again or proceed manually.'}</span>
                  <button
                    id="btn-ai-retry"
                    onClick={handleRequestSuggestion}
                    style={{
                      height: 24,
                      padding: '0 8px',
                      background: 'var(--surface-container)',
                      color: 'var(--on-surface)',
                      border: '1px solid var(--outline)',
                      borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>refresh</span>
                    Retry
                  </button>
                </div>
                <span style={{ color: 'var(--on-surface-variant)', fontSize: 11, marginTop: 4, display: 'block' }}>
                  You can retry or record your outcome manually below.
                </span>
              </div>
            )}

            {/* Done — show suggestion */}
            {aiState === 'done' && aiResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--on-surface)' }}>
                  {aiResult.summary}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--on-surface-variant)', textTransform: 'uppercase' }}>
                    Suggested outcome:
                  </span>
                  <button
                    onClick={() => setSelectedOutcome(aiResult.suggestedOutcome)}
                    style={{
                      padding: '2px 10px',
                      background: selectedOutcome === aiResult.suggestedOutcome
                        ? 'var(--tertiary)' : 'var(--tertiary-fixed)',
                      color: selectedOutcome === aiResult.suggestedOutcome
                        ? 'var(--on-tertiary)' : 'var(--on-tertiary-fixed)',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {aiResult.suggestedOutcome.replace(/_/g, ' ')}
                    {selectedOutcome === aiResult.suggestedOutcome && ' ✓'}
                  </button>
                </div>
                {aiResult.reason && (
                  <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', fontStyle: 'italic' }}>
                    {aiResult.reason}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Outcome selection */}
          <div>
            <div className="outcome-label">Select Call Outcome *</div>
            <div className="outcome-grid">
              {displayOutcomes.map(outcome => (
                <button
                  key={outcome.id}
                  id={`outcome-${outcome.id}`}
                  className={`outcome-pill${selectedOutcome === outcome.id ? ' selected' : ''}`}
                  onClick={() => setSelectedOutcome(outcome.id)}
                >
                  <span>{outcome.label}</span>
                  {selectedOutcome === outcome.id && (
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Next step */}
          <div>
            <div className="next-action-label">Next Step / Follow-up</div>
            <input
              id="modal-next-step-input"
              type="text"
              className="next-action-input"
              placeholder="e.g. Demo call Thursday 3 PM, Send whitepaper, Call again Monday…"
              value={nextStep}
              onChange={e => setNextStep(e.target.value)}
            />
          </div>

          {/* Manual summary */}
          <div>
            <div className="next-action-label">Call Summary (optional)</div>
            <textarea
              id="modal-summary-textarea"
              rows={3}
              placeholder="Brief notes on what happened, key insights, or context for future follow-up…"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button id="modal-cancel-btn" className="btn-secondary" onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Cancel
          </button>
          <button
            id="modal-confirm-btn"
            className="btn-primary"
            onClick={handleConfirm}
            disabled={!selectedOutcome || aiState === 'loading'}
            style={{ opacity: (selectedOutcome && aiState !== 'loading') ? 1 : 0.5, cursor: (selectedOutcome && aiState !== 'loading') ? 'pointer' : 'not-allowed' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            Save & Close Call
          </button>
        </div>
      </div>

      {/* Keyframe for spinner (in-file because it's minimal) */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
