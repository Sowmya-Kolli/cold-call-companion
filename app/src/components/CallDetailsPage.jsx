import { useState } from 'react';
import { STAGES, OUTCOMES } from '../data/mockData';
import EditCallModal from './EditCallModal';
import { suggestClose } from '../api/callsApi';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getOutcomeStyle(outcomeId) {
  const styles = {
    next_step_agreed: 'pill-success',
    callback_scheduled: 'pill-warning',
    short_pitch_qualified: 'pill-info',
    follow_up_required: 'pill-warning',
    gatekeeper_stalled: 'pill-neutral',
    not_interested: 'pill-neutral',
    wrong_person: 'pill-error',
    agreed_to_receive_report: 'pill-info',
    call_again: 'pill-warning',
    interested: 'pill-success',
  };
  return styles[outcomeId] || 'pill-neutral';
}

function VerbatimBlock({ text, borderClass, labelClass, labelText }) {
  if (!text) return null;
  return (
    <div className={`audit-verbatim ${borderClass || ''}`} style={{ marginTop: 8 }}>
      <span className={`audit-verbatim-label ${labelClass || 'primary'}`}>{labelText || 'Verbatim'}</span>
      <div className="audit-verbatim-text">"{text}"</div>
    </div>
  );
}

function GaugeCircle({ score }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? 'var(--tertiary)' : score >= 50 ? 'var(--primary-container)' : 'var(--secondary)';
  return (
    <div className="gauge-wrap">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--surface-highest)" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="gauge-center">
        <span className="gauge-score">{score}</span>
        <span className="gauge-label">ICP</span>
      </div>
    </div>
  );
}

export default function CallDetailsPage({ call, onBack, onResumeCall, onUpdateCall }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [isSummaryOutdated, setIsSummaryOutdated] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!call) {
    return (
      <div className="page-wrapper">
        <div className="topbar">
          <button className="back-btn" onClick={onBack}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Back to History
          </button>
        </div>
        <div className="empty-state" style={{ marginTop: 80 }}>
          <span className="material-symbols-outlined empty-state-icon">error</span>
          <span>Call not found</span>
        </div>
      </div>
    );
  }

  const outcome = OUTCOMES.find(o => o.id === call.outcome);
  const stageName = STAGES[call.furthestStage - 1]?.name || '—';

  return (
    <div className="page-wrapper">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <button
            id="btn-back-to-history"
            className="back-btn"
            onClick={onBack}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            History
          </button>
          <span className="crumb-sep">›</span>
          <div className="breadcrumb-row">
            <span className="bc-text">Call</span>
            <span className="bc-id">#{call.id}</span>
            <span className="bc-sep">·</span>
            <span className="bc-name">{call.prospectName}</span>
          </div>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {call.status === 'in_progress' && onResumeCall && (
            <button
              id="btn-resume-call-details"
              className="btn-primary"
              onClick={() => onResumeCall(call)}
              style={{ height: 32, padding: '0 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>phone_in_talk</span>
              Resume Call
            </button>
          )}

          {onUpdateCall && (
            <button
              id="btn-edit-call-details"
              className="btn-secondary"
              onClick={() => setIsEditing(true)}
              style={{ height: 32, padding: '0 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>edit</span>
              Edit Call
            </button>
          )}

          {outcome && (
            <span className={`pill ${getOutcomeStyle(call.outcome)}`}>
              {outcome.label}
            </span>
          )}
        </div>
      </div>

      <div style={{ paddingTop: 'var(--topbar-h)' }}>
        {/* Ribbon */}
        <div className="details-ribbon">
          <div className="details-ribbon-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="identity-avatar" style={{ width: 48, height: 48, fontSize: 17 }}>
                {getInitials(call.prospectName)}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--on-surface)', letterSpacing: '-0.015em' }}>
                  {call.prospectName}
                  <span className="identity-role-badge" style={{ marginLeft: 8 }}>
                    {call.prospectTitle}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                  {call.company}
                  {call.companyType && <span style={{ marginLeft: 6, color: 'var(--outline)' }}>· {call.companyType}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="identity-date">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_today</span>
                {call.date} · {call.time}
              </span>
              <span className="identity-date">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>timer</span>
                {call.duration}
              </span>
              <span className="identity-date">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>route</span>
                Stage {call.furthestStage} — {stageName}
              </span>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {editSuccessMsg && (
          <div style={{
            margin: '12px var(--margin) 0',
            padding: '10px 16px',
            background: 'var(--tertiary-fixed)',
            color: 'var(--on-tertiary-fixed)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 500,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
            <span>{editSuccessMsg}</span>
          </div>
        )}

        {/* Canvas */}
        <div className="details-canvas">
          {/* PRIMARY column */}
          <div className="details-primary">

            {/* Identity card */}
            <div className="identity-card">
              <div className="identity-card-glow" />
              <div className="identity-top">
                <div className="identity-left">
                  <div className="identity-avatar" style={{ position: 'relative' }}>
                    {getInitials(call.prospectName)}
                    <span className="identity-avatar-badge">
                      <span className="material-symbols-outlined" style={{ fontSize: 10 }}>check</span>
                    </span>
                  </div>
                  <div className="identity-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="identity-name">{call.prospectName}</div>
                      <span className="identity-role-badge">{call.prospectTitle}</span>
                    </div>
                    <div className="identity-company-row">
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>business</span>
                      <span className="identity-company">{call.company}</span>
                      {call.companyType && <span>· {call.companyType}</span>}
                    </div>
                    {call.location && (
                      <div className="identity-company-row" style={{ marginTop: 2 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>location_on</span>
                        <span>{call.location}</span>
                      </div>
                    )}
                  </div>
                </div>
                {outcome && (
                  <div className={`confirmed-pill ${getOutcomeStyle(call.outcome)}`}
                    style={{ background: 'var(--tertiary-fixed)', color: 'var(--on-tertiary-fixed)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
                    {outcome.label}
                  </div>
                )}
              </div>

              {/* Metrics row */}
              <div className="metrics-grid">
                <div className="metric-field">
                  <span className="metric-label">Date</span>
                  <span className="metric-value">{call.date}</span>
                </div>
                <div className="metric-field">
                  <span className="metric-label">Duration</span>
                  <span className="metric-value">
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>timer</span>
                    {call.duration}
                  </span>
                </div>
                <div className="metric-field">
                  <span className="metric-label">Furthest Stage</span>
                  <span className="metric-value">
                    <span className="accent">S{call.furthestStage}</span>
                    {stageName}
                  </span>
                </div>
                <div className="metric-field">
                  <span className="metric-label">Next Step</span>
                  <span className="metric-value" style={{ fontSize: 12 }}>{call.nextStep || '—'}</span>
                </div>
              </div>

              {/* Next step spotlight */}
              {call.nextStep && call.nextStep !== 'N/A (Closed cold)' && (
                <div className="action-spotlight">
                  <div className="action-spotlight-icon">
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_right_alt</span>
                  </div>
                  <div className="action-spotlight-body">
                    <div className="action-spotlight-eyebrow">Agreed Next Step</div>
                    <div className="action-spotlight-text">
                      <span className="highlight">{call.nextStep}</span>
                    </div>
                    {call.outcome && (
                      <div className="action-spotlight-meta">
                        <span>Outcome: {outcome?.label}</span>
                        <span>·</span>
                        <span>Call recorded {call.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Call synthesis */}
            {call.callSynthesis && (
              <div className="synthesis-card">
                <div className="synthesis-header">
                  <div className="synthesis-title-row">
                    <div className="synthesis-icon">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>summarize</span>
                    </div>
                    <div className="synthesis-title">Call Synthesis</div>
                  </div>
                  <span className="synthesis-ai-badge">Analyst Note</span>
                </div>
                <div className="synthesis-body">
                  {call.callSynthesis}
                </div>

                {/* Warning if summary might be outdated following edits */}
                {isSummaryOutdated && (
                  <div style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    background: 'rgba(234, 88, 12, 0.1)',
                    border: '1px solid rgba(234, 88, 12, 0.3)',
                    color: '#c2410c',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}>
                    <span>⚠️ Summary may be outdated — stage notes were modified after this was generated.</span>
                    <button
                      id="btn-regenerate-summary"
                      className="btn-secondary"
                      style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                      disabled={regenerating}
                      onClick={async () => {
                        setRegenerating(true);
                        try {
                          const res = await suggestClose(call.id);
                          if (res.aiAvailable && res.suggestion?.summary) {
                            if (onUpdateCall) {
                              await onUpdateCall(call.id, {
                                summary: res.suggestion.summary,
                                summarySource: 'ai',
                              });
                            }
                            setIsSummaryOutdated(false);
                          }
                        } catch (err) {
                          console.error('Failed to regenerate summary:', err);
                        } finally {
                          setRegenerating(false);
                        }
                      }}
                    >
                      {regenerating ? 'Regenerating…' : 'Regenerate with Gemini'}
                    </button>
                  </div>
                )}
                {/* Key metrics */}
                {(call.primaryPain || call.infraFootprint || call.complianceGating) && (
                  <div className="key-metrics-row">
                    {call.primaryPain && (
                      <div className="key-metric-card">
                        <div className="key-metric-label">Primary Pain</div>
                        <div className="key-metric-value">{call.primaryPain}</div>
                      </div>
                    )}
                    {call.infraFootprint && (
                      <div className="key-metric-card">
                        <div className="key-metric-label">Infra Footprint</div>
                        <div className="key-metric-value">{call.infraFootprint}</div>
                      </div>
                    )}
                    {call.complianceGating && (
                      <div className="key-metric-card">
                        <div className="key-metric-label">Compliance Gate</div>
                        <div className="key-metric-value">{call.complianceGating}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Audit trail */}
            <div className="audit-trail-card">
              <div className="audit-trail-header">
                <div className="audit-trail-title">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary-container)' }}>
                    receipt_long
                  </span>
                  <span className="synthesis-title" style={{ fontSize: 18 }}>Stage Audit Trail</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  {call.stageData?.length || 0} stages recorded
                </span>
              </div>

              <div className="audit-stage-entries">
                {STAGES.map((stageDef, idx) => {
                  const stageN = idx + 1;
                  const recorded = call.stageData?.find(s => s.stageId === stageN);
                  const isSkipped = stageN > call.furthestStage;
                  const isLast = stageN === call.furthestStage;

                  // Determine verbatim border color
                  const hasError = recorded?.selectedChips?.some(c =>
                    ['wrong_number', 'not_interested', 'no_pain', 'refused_info', 'budget_raised'].includes(c)
                  );
                  const hasSuccess = recorded?.selectedChips?.some(c =>
                    ['right_person', 'engaged', 'available', 'pain_voiced', 'objection_cleared', 'meeting_booked', 'strong_close'].includes(c)
                  );

                  return (
                    <div key={stageN} className="audit-stage">
                      <div className="audit-stage-col">
                        <div className={`audit-stage-num ${isSkipped ? 'skipped' : isLast ? 'last-done' : 'done'}`}>
                          {stageN}
                        </div>
                        {stageN < 8 && <div className="audit-stage-connector" />}
                      </div>
                      <div className={`audit-stage-body${isSkipped ? ' skipped' : ''}`}>
                        <div className="audit-stage-title-row">
                          <span className="audit-stage-name">
                            {stageDef.name}
                            <span className="audit-stage-ts" style={{ marginLeft: 6 }}>
                              {recorded?.timestamp || (isSkipped ? '— Not reached' : '—')}
                            </span>
                          </span>
                          {recorded?.badge && (
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'var(--surface-high)',
                              color: 'var(--on-surface-variant)',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}>
                              {recorded.badge}
                            </span>
                          )}
                        </div>
                        <div className="audit-stage-desc">{stageDef.purpose}</div>

                        {/* Action chips recorded */}
                        {recorded?.selectedChips?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                            {recorded.selectedChips.map(chipId => {
                              const chip = stageDef.actionChips.find(c => c.id === chipId);
                              return chip ? (
                                <span key={chipId} style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 10,
                                  background: 'var(--surface-container)',
                                  padding: '2px 8px',
                                  borderRadius: 'var(--radius-full)',
                                  color: 'var(--on-surface)',
                                  display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{chip.icon}</span>
                                  {chip.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}

                        {/* Prospect verbatim */}
                        {recorded?.prospectWords && (
                          <VerbatimBlock
                            text={recorded.prospectWords.replace(/^"|"$/g, '')}
                            borderClass={hasError ? 'error-border' : hasSuccess ? 'success-border' : ''}
                            labelClass={hasError ? 'error' : hasSuccess ? 'success' : 'primary'}
                            labelText="Prospect's Words"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SIDEBAR column */}
          <div className="details-sidebar">

            {/* Contact dossier */}
            <div className="dossier-card">
              <div className="dossier-header">
                <span className="dossier-label">Contact Details</span>
              </div>
              {[
                { icon: 'phone', label: 'Phone', value: call.phone },
                { icon: 'email', label: 'Email', value: call.email },
                { icon: 'location_on', label: 'Location', value: call.location },
                { icon: 'schedule', label: 'Timezone', value: call.timezone },
              ].filter(r => r.value).map(row => (
                <div key={row.label} className="dossier-row">
                  <div className="dossier-row-left">
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>
                      {row.icon}
                    </span>
                    <span className="dossier-value">{row.value}</span>
                  </div>
                  <span className="material-symbols-outlined dossier-copy">content_copy</span>
                </div>
              ))}
            </div>

            {/* ICP Score */}
            {call.icpScore && (
              <div className="dossier-card">
                <div className="dossier-header">
                  <span className="dossier-label">Account Intelligence</span>
                </div>
                <div className="velocity-gauge-row">
                  <GaugeCircle score={call.icpScore} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>
                      ICP Match Score
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 2 }}>
                      {call.icpScore >= 80 ? 'Strong fit — prioritize follow-up' :
                        call.icpScore >= 60 ? 'Moderate fit — worth pursuing' :
                          'Weak fit — low priority'}
                    </div>
                    {call.accountIntelligence?.funding && (
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 10,
                        background: 'var(--surface-container)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        color: 'var(--on-surface-variant)',
                        marginTop: 6,
                        display: 'inline-block',
                      }}>
                        {call.accountIntelligence.funding}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tech stack */}
            {call.accountIntelligence?.stack?.length > 0 && (
              <div className="dossier-card">
                <div className="dossier-header">
                  <span className="dossier-label">Tech Stack</span>
                </div>
                <div className="tech-tags">
                  {call.accountIntelligence.stack.map(t => (
                    <span key={t} className="tech-tag">{t}</span>
                  ))}
                </div>
                {call.accountIntelligence.headcount && (
                  <div style={{ marginTop: 12 }} className="audit-log-row">
                    <span className="audit-log-key">
                      <span className="dot-sm" style={{ background: 'var(--primary-container)' }} />
                      Headcount
                    </span>
                    <span className="audit-log-val">{call.accountIntelligence.headcount}</span>
                  </div>
                )}
                {call.accountIntelligence.industry && (
                  <div className="audit-log-row">
                    <span className="audit-log-key">
                      <span className="dot-sm" style={{ background: 'var(--tertiary)' }} />
                      Industry
                    </span>
                    <span className="audit-log-val">{call.accountIntelligence.industry}</span>
                  </div>
                )}
              </div>
            )}

            {/* Summary */}
            {call.summary && (
              <div className="dossier-card">
                <div className="dossier-header">
                  <span className="dossier-label">Call Summary</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--on-surface)', lineHeight: '20px' }}>
                  {call.summary}
                </div>
              </div>
            )}

            {/* Back button */}
            <button
              id="btn-back-history-bottom"
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onBack}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
              Back to Call History
            </button>
          </div>
        </div>
      </div>

      {/* Edit Call Modal */}
      {isEditing && (
        <EditCallModal
          call={call}
          onClose={() => setIsEditing(false)}
          onSave={async (updatedFields) => {
            if (onUpdateCall) {
              await onUpdateCall(call.id, updatedFields);
              // Check if stage notes changed and an AI summary exists
              if (updatedFields.stageResults && (call.callSynthesis || call.summary)) {
                setIsSummaryOutdated(true);
              }
              setEditSuccessMsg('Call information updated successfully.');
              setTimeout(() => setEditSuccessMsg(''), 4000);
            }
          }}
        />
      )}
    </div>
  );
}
