import { useState, useMemo, useRef, useEffect } from 'react';
import { OUTCOMES, STAGES } from '../data/mockData';
import { filterCalls } from '../utils/callSearch';

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

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function computeMetrics(calls) {
  const total = calls.length;
  const converted = calls.filter(c =>
    ['next_step_agreed', 'interested', 'short_pitch_qualified', 'agreed_to_receive_report'].includes(c.outcome)
  ).length;
  const avgStage = total > 0
    ? Math.round(calls.reduce((acc, c) => acc + (c.furthestStage || 1), 0) / total * 10) / 10
    : 0;
  return { total, converted, avgStage };
}

// Mini sparkline bars (decorative, based on furthestStage spread)
function Sparkline({ calls }) {
  const counts = Array(8).fill(0);
  calls.forEach(c => { if (c.furthestStage) counts[c.furthestStage - 1]++; });
  const max = Math.max(...counts, 1);
  return (
    <div className="bento-sparkline">
      {counts.map((c, i) => (
        <div
          key={i}
          className={`spark-bar${i === counts.indexOf(Math.max(...counts)) ? ' current' : ''}`}
          style={{ height: `${Math.max(6, Math.round((c / max) * 28))}px` }}
        />
      ))}
    </div>
  );
}

export default function CallHistoryPage({
  calls,
  onViewCall,
  onResumeCall,
  onNewCall,
  onLoadDemoData,
  onClearDemoData,
  hasDemoData = false,
  loading = false,
  backendOnline = true,
  error = null,
  onRetry = null,
}) {
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const searchInputRef = useRef(null);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const metrics = useMemo(() => computeMetrics(calls), [calls]);

  // Comprehensive, trimmed, case-insensitive multi-field search + outcome filter
  const filtered = useMemo(() => filterCalls(calls, search, filterOutcome), [calls, search, filterOutcome]);

  // Consistently sort newest first
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.date && a.time ? `${a.date} ${a.time}` : a.created_at || a.started_at || 0).getTime() || 0;
      const timeB = new Date(b.date && b.time ? `${b.date} ${b.time}` : b.created_at || b.started_at || 0).getTime() || 0;
      return timeB - timeA;
    });
  }, [filtered]);

  return (
    <div className="page-wrapper">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>history</span>
          <span className="crumb-bold">Call History</span>
        </div>
        <div className="topbar-right">
          <div className="search-box" onClick={() => searchInputRef.current?.focus()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--outline)' }}>search</span>
            <input
              id="topbar-search-input"
              type="text"
              placeholder="Search calls…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                width: 140,
              }}
            />
            {search ? (
              <button
                onClick={(e) => { e.stopPropagation(); setSearch(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)', padding: 0 }}
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : (
              <span className="search-kbd">/</span>
            )}
          </div>
          <div className="topbar-divider" />
          <button
            id="btn-new-call-history"
            className="btn-primary"
            onClick={onNewCall}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_call</span>
            New Call
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl)', paddingTop: 'calc(var(--topbar-h) + var(--space-xl))' }}>
        {/* Page header */}
        <div className="page-header" style={{ padding: 0, marginBottom: 'var(--space-xl)' }}>
          <div className="page-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>history</span>
            <span className="accent">Call History</span>
            <span>·</span>
            <span>{metrics.total} total calls</span>
          </div>
          <div className="page-title">Your Calls</div>
          <div className="page-subtitle">Complete record of every call, stage-by-stage. Click any row to see the full details.</div>
        </div>

        {/* Backend offline warning */}
        {!backendOnline && (
          <div style={{
            marginBottom: 'var(--space-lg)',
            padding: '10px 14px',
            background: 'rgba(var(--error-rgb,220,53,69),0.08)',
            border: '1px solid rgba(var(--error-rgb,220,53,69),0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, color: 'var(--on-surface)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--error)' }}>cloud_off</span>
            <span>
              <strong>Backend unreachable</strong> — showing locally cached data.
              Start the server with <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>npm run dev</code> in the <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>server/</code> folder.
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && calls.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 'var(--space-xl)' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height: 56, borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-low)',
                animation: 'pulse 1.4s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }} />
            ))}
          </div>
        )}

        {/* Metric bento */}
        <div className="bento-grid">
          <div className="bento-card" id="bento-total">
            <div className="bento-card-top">
              <div>
                <div className="bento-label">Total Calls</div>
                <div className="bento-value-row">
                  <span className="bento-value">{metrics.total}</span>
                </div>
              </div>
              <div className="bento-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>phone_in_talk</span>
              </div>
            </div>
            <Sparkline calls={calls} />
          </div>

          <div className="bento-card" id="bento-converted">
            <div className="bento-card-top">
              <div>
                <div className="bento-label">Positive Outcomes</div>
                <div className="bento-value-row">
                  <span className="bento-value">{metrics.converted}</span>
                  <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                    / {metrics.total}
                  </span>
                </div>
              </div>
              <div className="bento-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>trending_up</span>
              </div>
            </div>
            <div className="bento-sparkline">
              {Array(8).fill(0).map((_, i) => (
                <div
                  key={i}
                  className={`spark-bar${i < metrics.converted ? ' current' : ''}`}
                  style={{ height: `${i < metrics.converted ? 20 : 8}px` }}
                />
              ))}
            </div>
          </div>

          <div className="bento-card" id="bento-avg-stage">
            <div className="bento-card-top">
              <div>
                <div className="bento-label">Avg. Furthest Stage</div>
                <div className="bento-value-row">
                  <span className="bento-value">{metrics.avgStage}</span>
                  <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>/ 8</span>
                </div>
              </div>
              <div className="bento-icon">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>stacked_bar_chart</span>
              </div>
            </div>
            <div className="bento-sparkline" style={{ alignItems: 'flex-end' }}>
              {Array(8).fill(0).map((_, i) => (
                <div
                  key={i}
                  className={`spark-bar${i + 1 <= metrics.avgStage ? ' current' : ''}`}
                  style={{ height: `${Math.max(4, Math.round(((i + 1) / 8) * 24))}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Evaluator demo banner */}
        {hasDemoData && (
          <div style={{
            marginBottom: 'var(--space-lg)',
            padding: '12px 16px',
            background: 'rgba(255, 171, 0, 0.08)',
            border: '1px solid rgba(255, 171, 0, 0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#ffab00' }}>science</span>
              <span style={{ fontSize: 13, color: 'var(--on-surface)' }}>
                <strong>Demo Mode Active:</strong> Sample calls are displayed for evaluation and tagged with <span style={{ background: 'rgba(255, 171, 0, 0.2)', color: '#ffab00', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>DEMO</span>. They are kept isolated and not mixed with your real Supabase calls.
              </span>
            </div>
            <button
              id="btn-clear-demo-data"
              className="btn-ghost"
              style={{ padding: '4px 12px', fontSize: 12, color: 'var(--on-surface)' }}
              onClick={onClearDemoData}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_sweep</span>
              Clear demo data
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="filter-bar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-input-wrap" style={{ flex: '1 1 240px' }}>
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              ref={searchInputRef}
              id="history-search-input"
              type="text"
              placeholder="Search by name, company, phone, outcome, or notes…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <span
                id="btn-clear-search"
                className="search-slash"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSearch('')}
                title="Clear search"
              >
                ✕
              </span>
            )}
          </div>
          <select
            id="history-outcome-filter"
            className="filter-btn"
            value={filterOutcome}
            onChange={e => setFilterOutcome(e.target.value)}
            style={{ fontFamily: 'var(--font-sans)', cursor: 'pointer', background: 'var(--surface-low)', border: 'none', padding: '0 12px' }}
          >
            <option value="">All Outcomes</option>
            {OUTCOMES.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
          <button
            id="btn-reset-filters"
            className="filter-btn"
            onClick={() => { setSearch(''); setFilterOutcome(''); }}
            title="Reset all filters"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>restart_alt</span>
            Reset
          </button>

          {!hasDemoData && onLoadDemoData && (
            <button
              id="btn-load-demo-data-bar"
              className="filter-btn"
              onClick={onLoadDemoData}
              title="Load sample calls for evaluation"
              style={{ marginLeft: 'auto' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#ffab00' }}>science</span>
              Load demo data
            </button>
          )}
        </div>

        {/* History table */}
        <div className="history-table-wrap">
          {loading ? (
            /* Loading state */
            <div id="history-loading-state" className="empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{
                width: 32,
                height: 32,
                border: '3px solid var(--surface-low)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px', color: 'var(--on-surface)' }}>
                Loading calls…
              </h3>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 360, margin: '0 auto' }}>
                Fetching your call records from the database.
              </p>
            </div>
          ) : (!backendOnline || error) && calls.length === 0 ? (
            /* Error / Retry state when backend fails and no calls exist */
            <div id="history-error-state" className="empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
              <span className="material-symbols-outlined empty-state-icon" style={{ fontSize: 48, color: 'var(--error)' }}>
                cloud_off
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '12px 0 6px', color: 'var(--on-surface)' }}>
                Unable to load calls
              </h3>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 420, margin: '0 auto 20px' }}>
                {error || 'Could not connect to the backend server. The database is unreachable and no mock calls are shown.'}
              </p>
              {onRetry && (
                <button id="btn-retry-history" className="btn-secondary" onClick={onRetry}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                  Retry Connection
                </button>
              )}
            </div>
          ) : calls.length === 0 ? (
            /* Genuine empty state: empty database/history */
            <div id="history-empty-state" className="empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
              <span className="material-symbols-outlined empty-state-icon" style={{ fontSize: 48, color: 'var(--outline)' }}>
                phone_disabled
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: '12px 0 6px', color: 'var(--on-surface)' }}>
                No calls yet
              </h3>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 420, margin: '0 auto 20px' }}>
                Your call history is completely clean. Start your first live call to track stage progression, handle objections, and record notes.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button id="btn-start-first-call" className="btn-primary" onClick={onNewCall}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_call</span>
                  Start your first call
                </button>
                {onLoadDemoData && (
                  <button id="btn-load-demo-data" className="btn-ghost" onClick={onLoadDemoData}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ffab00' }}>science</span>
                    Load demo data
                  </button>
                )}
              </div>
            </div>
          ) : sorted.length === 0 ? (
            /* Filter/Search yields zero matches */
            <div id="history-no-matches-state" className="empty-state" style={{ padding: '56px 24px', textAlign: 'center' }}>
              <span className="material-symbols-outlined empty-state-icon" style={{ fontSize: 44, color: 'var(--outline)' }}>
                search_off
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '10px 0 6px', color: 'var(--on-surface)' }}>
                No matching calls found
              </h3>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 400, margin: '0 auto 16px' }}>
                No records matched your search query {search ? `"${search}"` : ''} {filterOutcome ? `with outcome filter "${filterOutcome}"` : ''}.
              </p>
              <button
                id="btn-clear-search-empty"
                className="btn-ghost"
                onClick={() => { setSearch(''); setFilterOutcome(''); }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                Clear search & filters
              </button>
            </div>
          ) : (
            <div className="history-table-scroll">
              <table className="history-table">
              <thead>
                <tr>
                  <th>Prospect</th>
                  <th>Company</th>
                  <th>Date & Time</th>
                  <th>Stage Reached</th>
                  <th>Outcome</th>
                  <th>Next Step</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(call => {
                  const outcome = OUTCOMES.find(o => o.id === call.outcome);
                  const stageName = STAGES[call.furthestStage - 1]?.name;
                  const isUnfinished = call.status === 'in_progress';

                  return (
                    <tr
                      key={call.id}
                      id={`call-row-${call.id}`}
                      onClick={() => onViewCall(call.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="prospect-cell">
                          <div className="prospect-avatar" style={{ background: 'var(--primary-fixed)' }}>
                            {getInitials(call.prospectName)}
                          </div>
                          <div className="prospect-info">
                            <span className="prospect-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {call.prospectName}
                              {call._isDemo ? (
                                <span style={{
                                  fontSize: 9,
                                  fontFamily: 'var(--font-mono)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  background: 'rgba(255, 171, 0, 0.16)',
                                  color: '#ffab00',
                                  fontWeight: 700,
                                }}>
                                  DEMO
                                </span>
                              ) : call._localOnly ? (
                                <span style={{
                                  fontSize: 9,
                                  fontFamily: 'var(--font-mono)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  background: 'var(--error-container)',
                                  color: 'var(--error)',
                                  fontWeight: 600,
                                }}>
                                  OFFLINE
                                </span>
                              ) : (
                                <span
                                  className="material-symbols-outlined"
                                  title="Persisted in Supabase"
                                  style={{ fontSize: 13, color: 'var(--tertiary)' }}
                                >
                                  cloud_done
                                </span>
                              )}
                              {isUnfinished && (
                                <span style={{
                                  fontSize: 9,
                                  fontFamily: 'var(--font-mono)',
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  background: 'rgba(59, 130, 246, 0.16)',
                                  color: '#3b82f6',
                                  fontWeight: 700,
                                }}>
                                  IN PROGRESS
                                </span>
                              )}
                            </span>
                            <span className="prospect-email">{call.email || call.prospectTitle || call.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="company-cell">
                          <span className="company-name">{call.company}</span>
                          <span className="company-type">{call.companyType}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <span className="date-main">{call.date}</span>
                          <span className="date-dur">
                            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>schedule</span>
                            {call.time} · {call.duration}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div className="stage-dots">
                            {Array(8).fill(0).map((_, i) => (
                              <span
                                key={i}
                                className={`stage-dot ${i < call.furthestStage ? 'filled' : 'empty'}`}
                              />
                            ))}
                          </div>
                          <span className="stage-text">
                            {call.furthestStage} — {stageName}
                          </span>
                        </div>
                      </td>
                      <td>
                        {outcome ? (
                          <span className={`pill ${getOutcomeStyle(call.outcome)}`}>
                            {outcome.label}
                          </span>
                        ) : isUnfinished ? (
                          <span className="pill pill-progress">In progress</span>
                        ) : (
                          <span className="pill pill-neutral">—</span>
                        )}
                      </td>
                      <td>
                        <div className="next-step-cell">
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary-container)' }}>
                            arrow_right_alt
                          </span>
                          <span className="summary-cell">{call.nextStep || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          {isUnfinished && onResumeCall && (
                            <button
                              id={`resume-call-${call.id}`}
                              className="view-btn"
                              style={{
                                color: 'var(--primary)',
                                background: 'rgba(var(--primary-rgb, 13, 148, 136), 0.1)',
                              }}
                              onClick={e => {
                                e.stopPropagation();
                                onResumeCall(call);
                              }}
                              title="Resume live call"
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>play_arrow</span>
                              Resume
                            </button>
                          )}
                          <button
                            id={`view-call-${call.id}`}
                            className="view-btn"
                            onClick={e => { e.stopPropagation(); onViewCall(call.id); }}
                          >
                            View
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}

          {sorted.length > 0 && (
            <div className="table-footer">
              <span>Showing {sorted.length} of {calls.length} calls</span>
              <div className="pagination">
                <button className="page-btn" disabled>‹</button>
                <button className="page-btn current">1</button>
                <button className="page-btn" disabled>›</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
