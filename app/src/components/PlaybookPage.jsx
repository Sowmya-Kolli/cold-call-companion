// PlaybookPage.jsx — In-app calling playbook, scripts, objection handles, and stage reference
import { useState, useMemo } from 'react';
import { STAGES } from '../data/mockData';

export default function PlaybookPage({ onStartCallWithStage }) {
  const [selectedStageId, setSelectedStageId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);

  const selectedStage = useMemo(() => {
    return STAGES.find(s => s.id === selectedStageId) || STAGES[0];
  }, [selectedStageId]);

  // Search filter across all stages (purposes, battlecards, anticipated paths)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    return STAGES.map(stage => {
      const matchName = stage.name.toLowerCase().includes(q);
      const matchPurpose = stage.purpose.toLowerCase().includes(q);
      const matchDirective = stage.directive.toLowerCase().includes(q);
      const matchScript = stage.battlecard?.content?.toLowerCase().includes(q);
      const matchedPaths = stage.anticipatedPaths?.filter(p =>
        p.label.toLowerCase().includes(q) || p.type.toLowerCase().includes(q)
      ) || [];
      const isMatch = matchName || matchPurpose || matchDirective || matchScript || matchedPaths.length > 0;
      return isMatch ? { stage, matchedPaths, matchScript } : null;
    }).filter(Boolean);
  }, [searchQuery]);

  const handleCopyScript = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="page-wrapper" id="playbook-page">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
          <span className="crumb-bold">FDE Calling Playbook</span>
        </div>
        <div className="topbar-right">
          <div className="search-box" style={{ width: 280 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--outline)' }}>search</span>
            <input
              id="playbook-search-input"
              type="text"
              placeholder="Search scripts, objections, paths…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                color: 'var(--on-surface)',
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                width: '100%',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              </button>
            )}
          </div>
          {onStartCallWithStage && (
            <button
              id="btn-playbook-new-call"
              className="btn-primary"
              onClick={onStartCallWithStage}
              style={{ height: 32, padding: '0 12px', fontSize: 12 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add_call</span>
              New Call
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl)', paddingTop: 'calc(var(--topbar-h) + var(--space-xl))' }}>
        {/* Header */}
        <div className="page-header" style={{ padding: 0, marginBottom: 'var(--space-xl)' }}>
          <div className="page-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>menu_book</span>
            <span className="accent">Standard Operating Procedure</span>
            <span>·</span>
            <span>8 Sequential Stages</span>
          </div>
          <div className="page-title">Cold Calling Playbook</div>
          <div className="page-subtitle">
            Battle-tested talk tracks, micro-scripts, anticipated prospect objections, and decisive actions for Forward Deployed Engineers.
          </div>
        </div>

        {/* If search query active, show search results view */}
        {searchResults !== null ? (
          <div>
            <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
              Found <strong>{searchResults.length}</strong> matching stages for &ldquo;{searchQuery}&rdquo;:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {searchResults.map(({ stage, matchedPaths, matchScript }) => (
                <div
                  key={stage.id}
                  className="card"
                  style={{
                    background: 'var(--surface-lowest)',
                    border: '1px solid var(--outline-variant)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 16,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedStageId(stage.id);
                    setSearchQuery('');
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--primary)',
                      background: 'var(--primary-fixed)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      Stage {stage.id}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>{stage.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 12, lineHeight: 1.5 }}>
                    {stage.purpose}
                  </div>
                  {matchScript && (
                    <div style={{
                      background: 'var(--surface-low)',
                      borderLeft: '3px solid var(--primary)',
                      padding: '6px 10px',
                      fontSize: 11,
                      fontStyle: 'italic',
                      marginBottom: 8,
                      borderRadius: '0 4px 4px 0',
                    }}>
                      {stage.battlecard?.content}
                    </div>
                  )}
                  {matchedPaths.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {matchedPaths.map((p, idx) => (
                        <span key={idx} style={{
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          background: 'var(--surface-container)',
                          padding: '2px 6px',
                          borderRadius: 4,
                          color: 'var(--on-surface-variant)',
                        }}>
                          {p.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal Playbook View: Stage Navigation Strip + Stage Detail */
          <div>
            {/* Stage Selector Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 8,
                marginBottom: 24,
              }}
              role="tablist"
            >
              {STAGES.map(stage => {
                const isSelected = stage.id === selectedStageId;
                return (
                  <button
                    key={stage.id}
                    id={`playbook-stage-tab-${stage.id}`}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedStageId(stage.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
                      background: isSelected ? 'var(--primary-fixed)' : 'var(--surface-lowest)',
                      color: isSelected ? 'var(--on-primary-fixed)' : 'var(--on-surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      fontWeight: 600,
                      color: isSelected ? 'var(--primary)' : 'var(--outline)',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                    }}>
                      Stage 0{stage.id}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>
                      {stage.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stage Detail Card */}
            <div
              className="card"
              style={{
                background: 'var(--surface-lowest)',
                border: '1px solid var(--outline-variant)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-xl)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              {/* Stage Title and Banner */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--outline-variant)', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--primary)',
                      background: 'var(--primary-fixed)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}>
                      STAGE {selectedStage.id} OF 8
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>
                      {selectedStage.fullName}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--on-surface)' }}>
                    {selectedStage.name}
                  </h2>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn-secondary"
                    disabled={selectedStageId === 1}
                    onClick={() => setSelectedStageId(id => Math.max(1, id - 1))}
                    style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_left</span>
                    Previous
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={selectedStageId === 8}
                    onClick={() => setSelectedStageId(id => Math.min(8, id + 1))}
                    style={{ height: 32, padding: '0 12px', fontSize: 12 }}
                  >
                    Next
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Two-column layout for details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {/* Column 1: Purpose, Directive, Micro-script */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Purpose Box */}
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Primary Purpose
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--on-surface)', lineHeight: 1.5 }}>
                      {selectedStage.purpose}
                    </div>
                  </div>

                  {/* Directive */}
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      FDE Execution Directive
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6, background: 'var(--surface-low)', padding: 12, borderRadius: 'var(--radius-md)' }}>
                      {selectedStage.directive}
                    </div>
                  </div>

                  {/* Micro-script Battlecard */}
                  {selectedStage.battlecard && (
                    <div style={{
                      background: 'var(--surface-container)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 16,
                      position: 'relative',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>
                            record_voice_over
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>
                            {selectedStage.battlecard.title}
                          </span>
                        </div>
                        <button
                          id="btn-copy-script"
                          onClick={() => handleCopyScript(selectedStage.battlecard.content)}
                          style={{
                            background: 'var(--surface-lowest)',
                            border: '1px solid var(--outline-variant)',
                            borderRadius: 'var(--radius-md)',
                            padding: '3px 8px',
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: copiedScript ? 'var(--tertiary)' : 'var(--on-surface-variant)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                            {copiedScript ? 'check' : 'content_copy'}
                          </span>
                          {copiedScript ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div style={{
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: 'var(--on-surface)',
                        fontStyle: 'italic',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {selectedStage.battlecard.content}
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2: Anticipated Prospect Paths & Available Action Chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Anticipated Prospect Responses */}
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Anticipated Prospect Responses & Handling
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedStage.anticipatedPaths?.map((path, idx) => {
                        const isFriction = path.color === 'error';
                        const isGreen = path.color === 'tertiary';
                        return (
                          <div
                            key={idx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              background: 'var(--surface-lowest)',
                              border: '1px solid var(--outline-variant)',
                              borderRadius: 'var(--radius-md)',
                            }}
                          >
                            <span style={{ fontSize: 13, color: 'var(--on-surface)', fontWeight: 500 }}>
                              {path.label}
                            </span>
                            <span style={{
                              fontSize: 10,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              background: isFriction ? 'var(--error-container)' : isGreen ? 'var(--tertiary-fixed)' : 'var(--secondary-container)',
                              color: isFriction ? 'var(--error)' : isGreen ? 'var(--tertiary)' : 'var(--on-secondary-container)',
                            }}>
                              {path.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stage Action Chips */}
                  <div>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Stage Action Chips (One-Click Recording)
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedStage.actionChips?.map(chip => (
                        <div
                          key={chip.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            background: 'var(--surface-low)',
                            border: '1px solid var(--outline-variant)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 12,
                            color: 'var(--on-surface-variant)',
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary)' }}>
                            {chip.icon || 'check'}
                          </span>
                          <span>{chip.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
