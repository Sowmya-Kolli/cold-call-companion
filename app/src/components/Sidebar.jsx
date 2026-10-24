// Sidebar.jsx — Left navigation panel
import { useState } from 'react';

const NAV_ITEMS = [
  { id: 'active-call', label: 'Active Call', icon: 'phone_in_talk', badge: null, live: true },
  { id: 'history', label: 'Call History', icon: 'history', badge: null },
  { id: 'playbook', label: 'Playbook', icon: 'menu_book', badge: null },
  { id: 'settings', label: 'Settings', icon: 'settings', badge: null },
];

export default function Sidebar({ currentPage, onNavigate, activeCallExists, callCount, settings }) {
  const [hovered, setHovered] = useState(null);

  const name = settings?.callerName || 'Sarah Johnson';
  const role = settings?.callerRole || 'FDE';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'FDE';

  return (
    <aside className="sidebar">
      {/* Brand header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>signal_cellular_alt</span>
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">Cold Call</span>
          <span className="sidebar-brand-sub">Companion · FDE</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
        {/* New Call button */}
        <div className="sidebar-new-call">
          <button
            id="btn-new-call"
            className="btn-new-call"
            onClick={() => onNavigate('new-call')}
          >
            <span className="btn-new-call-left">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_call</span>
              New Call
            </span>
            <span className="kbd-badge">⌘K</span>
          </button>
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const isActive = currentPage === item.id ||
              (item.id === 'active-call' && currentPage === 'active-call');
            const showLive = item.live && activeCallExists;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-item${isActive ? ' active' : ''}`}
                onClick={() => onNavigate(item.id)}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="nav-item-left">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    {item.icon}
                  </span>
                  {item.label}
                </span>
                {showLive && (
                  <span className="live-dot">
                    <span className="live-dot-ping" />
                    <span className="live-dot-core" />
                  </span>
                )}
                {item.id === 'history' && callCount > 0 && !showLive && (
                  <span className="nav-badge">{callCount}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user" onClick={() => onNavigate('settings')} style={{ cursor: 'pointer' }} title="Configure Settings">
          <div className="sidebar-user-left">
            <div className="avatar">
              {initials}
              <span className="avatar-online" />
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{name}</span>
              <span className="sidebar-user-status">{role} · Online</span>
            </div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--on-surface-variant)' }}>
            settings
          </span>
        </div>
      </div>
    </aside>
  );
}
