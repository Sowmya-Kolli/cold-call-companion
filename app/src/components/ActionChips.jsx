// ActionChips.jsx — Clickable action chips for current stage
export default function ActionChips({ chips, selectedChips, onToggle }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {chips.map(chip => {
        const isSelected = selectedChips.includes(chip.id);
        return (
          <button
            key={chip.id}
            id={`chip-${chip.id}`}
            className={`action-chip${isSelected ? ' selected' : ''}`}
            onClick={() => onToggle(chip.id)}
            aria-pressed={isSelected}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              {chip.icon}
            </span>
            {chip.label}
            {isSelected && (
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                check
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
