// StageTracker.jsx — Eight-stage progress tracker strip
import { STAGES } from '../data/mockData';

export default function StageTracker({ currentStage, furthestStage, onStageSelect, callTimer, saveStatus }) {
  return (
    <div className="stage-strip">
      <div className="stage-strip-meta">
        <span>
          Stage{' '}
          <span className="stage-strip-meta-bold">{currentStage} / 8</span>
          {' — '}
          <span className="stage-strip-meta-bold">{STAGES[currentStage - 1]?.name}</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {saveStatus === 'saved' && (
            <span style={{ color: 'var(--tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span>
              Saved
            </span>
          )}
          {saveStatus === 'saving' && (
            <span style={{ color: 'var(--on-surface-variant)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>sync</span>
              Saving…
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--on-surface-variant)' }}>
            Furthest: Stage {furthestStage}
          </span>
        </span>
      </div>

      <div className="stage-tracker-row">
        {STAGES.map((stage, idx) => {
          const stageNum = idx + 1;
          const isActive = stageNum === currentStage;
          const isCompleted = stageNum < furthestStage || (stageNum < currentStage);
          const isFurthest = stageNum === furthestStage && stageNum !== currentStage;
          const isAccessible = stageNum <= furthestStage + 1;

          let pillClass = 'stage-pill';
          let numClass = 'stage-num inactive-num';
          if (isActive) { pillClass += ' active'; numClass = 'stage-num active-num'; }
          else if (isCompleted) { pillClass += ' completed'; numClass = 'stage-num completed-num'; }

          return (
            <span key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <button
                id={`stage-pill-${stageNum}`}
                className={pillClass}
                onClick={() => onStageSelect(stageNum)}
                title={stage.fullName}
                style={{ opacity: isAccessible ? 1 : 0.5 }}
              >
                <span className={numClass}>
                  {isCompleted ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 10 }}>check</span>
                  ) : (
                    stageNum
                  )}
                </span>
                {stage.name}
                {isActive && <span className="stage-pulse" />}
              </button>
              {idx < STAGES.length - 1 && (
                <span className="stage-divider">›</span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}
