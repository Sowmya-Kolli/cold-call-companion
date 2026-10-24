// PlaceholderPage.jsx — Simple placeholder for Playbook and Settings
export default function PlaceholderPage({ title, icon, description }) {
  return (
    <div className="page-wrapper">
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
          <span className="crumb-bold">{title}</span>
        </div>
      </div>
      <div className="empty-state" style={{ marginTop: 'calc(var(--topbar-h) + 80px)', flex: 1 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--outline-variant)' }}>
          {icon}
        </span>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--on-surface)', marginTop: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--on-surface-variant)', maxWidth: 340, textAlign: 'center', lineHeight: 1.6 }}>
          {description}
        </div>
        <div style={{
          marginTop: 16,
          padding: '8px 16px',
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-full)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--on-surface-variant)',
        }}>
          Coming in Phase 2
        </div>
      </div>
    </div>
  );
}
