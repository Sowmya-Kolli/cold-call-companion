// SettingsPage.jsx — Application preferences, FDE caller profile, and data management
import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../api/callsApi';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../data/settingsStorage';

export default function SettingsPage({ onSettingsChange, onClearCache }) {
  const [form, setForm] = useState(() => loadSettings());
  const [errors, setErrors] = useState({});
  const [savedBanner, setSavedBanner] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null); // { status, latency, error }
  const [checkingHealth, setCheckingHealth] = useState(false);

  const runHealthCheck = useCallback(async () => {
    setCheckingHealth(true);
    const start = Date.now();
    try {
      const res = await checkHealth();
      const latency = Date.now() - start;
      setHealthStatus({ status: res.status || 'ok', latency, timestamp: res.timestamp });
    } catch (err) {
      setHealthStatus({ error: err.message, latency: Date.now() - start });
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  // Test backend connection on mount
  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  const validate = () => {
    const errs = {};
    if (!form.callerName.trim()) {
      errs.callerName = 'Caller name cannot be empty.';
    } else if (form.callerName.trim().length < 2) {
      errs.callerName = 'Name must be at least 2 characters.';
    }
    if (!form.callerRole.trim()) {
      errs.callerRole = 'Caller role is required.';
    }
    if (!form.callerCompany.trim()) {
      errs.callerCompany = 'Company name is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
    setSavedBanner(false);
  };

  const handleSave = (e) => {
    e?.preventDefault();
    if (!validate()) return;

    saveSettings(form);
    if (onSettingsChange) onSettingsChange(form);

    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all settings to default values?')) {
      setForm(DEFAULT_SETTINGS);
      saveSettings(DEFAULT_SETTINGS);
      if (onSettingsChange) onSettingsChange(DEFAULT_SETTINGS);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    }
  };

  return (
    <div className="page-wrapper" id="settings-page">
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-breadcrumb">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
          <span className="crumb-bold">Application Settings</span>
        </div>
        <div className="topbar-right">
          <button
            id="btn-save-settings-top"
            className="btn-primary"
            onClick={handleSave}
            style={{ height: 32, padding: '0 16px', fontSize: 12 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>save</span>
            Save Settings
          </button>
        </div>
      </div>

      <div style={{ padding: 'var(--space-xl)', paddingTop: 'calc(var(--topbar-h) + var(--space-xl))', maxWidth: 840 }}>
        {/* Page header */}
        <div className="page-header" style={{ padding: 0, marginBottom: 'var(--space-xl)' }}>
          <div className="page-eyebrow">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>tune</span>
            <span className="accent">Preferences & Configuration</span>
          </div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">
            Configure your caller profile, automated workflow preferences, and view database connection health.
          </div>
        </div>

        {/* Success Banner */}
        {savedBanner && (
          <div style={{
            background: 'var(--tertiary-fixed)',
            color: 'var(--on-tertiary-fixed)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 20,
            fontSize: 13,
            fontWeight: 500,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
            Settings saved successfully. New calls will reflect your updated caller profile.
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1: FDE Caller Profile */}
          <div className="card" style={{
            background: 'var(--surface-lowest)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--outline-variant)', paddingBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>badge</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-surface)' }}>FDE Caller Profile</h3>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Used as the default caller signature in database records and outbound scripts.
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <div>
                <label htmlFor="setting-caller-name" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>
                  Full Name *
                </label>
                <input
                  id="setting-caller-name"
                  type="text"
                  value={form.callerName}
                  onChange={(e) => handleChange('callerName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${errors.callerName ? 'var(--error)' : 'var(--outline-variant)'}`,
                    background: 'var(--surface-lowest)',
                    color: 'var(--on-surface)',
                    fontSize: 13,
                  }}
                />
                {errors.callerName && (
                  <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{errors.callerName}</span>
                )}
              </div>

              <div>
                <label htmlFor="setting-caller-role" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>
                  Role / Title *
                </label>
                <input
                  id="setting-caller-role"
                  type="text"
                  value={form.callerRole}
                  onChange={(e) => handleChange('callerRole', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${errors.callerRole ? 'var(--error)' : 'var(--outline-variant)'}`,
                    background: 'var(--surface-lowest)',
                    color: 'var(--on-surface)',
                    fontSize: 13,
                  }}
                />
                {errors.callerRole && (
                  <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{errors.callerRole}</span>
                )}
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="setting-caller-company" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>
                  Your Company / Organization *
                </label>
                <input
                  id="setting-caller-company"
                  type="text"
                  value={form.callerCompany}
                  onChange={(e) => handleChange('callerCompany', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${errors.callerCompany ? 'var(--error)' : 'var(--outline-variant)'}`,
                    background: 'var(--surface-lowest)',
                    color: 'var(--on-surface)',
                    fontSize: 13,
                  }}
                />
                {errors.callerCompany && (
                  <span style={{ fontSize: 11, color: 'var(--error)', marginTop: 4, display: 'block' }}>{errors.callerCompany}</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Workflow Preferences */}
          <div className="card" style={{
            background: 'var(--surface-lowest)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--outline-variant)', paddingBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>call</span>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-surface)' }}>Call Workflow & Defaults</h3>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Customize call management and AI assistant behaviors.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="setting-timezone" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 6 }}>
                  Default Prospect Timezone
                </label>
                <select
                  id="setting-timezone"
                  value={form.defaultTimezone}
                  onChange={(e) => handleChange('defaultTimezone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--outline-variant)',
                    background: 'var(--surface-lowest)',
                    color: 'var(--on-surface)',
                    fontSize: 13,
                  }}
                >
                  <option value="IST (UTC+5:30)">India Standard Time — IST (UTC+5:30)</option>
                  <option value="EST (UTC-5)">Eastern Standard Time — EST (UTC-5)</option>
                  <option value="PST (UTC-8)">Pacific Standard Time — PST (UTC-8)</option>
                  <option value="GMT (UTC+0)">Greenwich Mean Time — GMT (UTC+0)</option>
                  <option value="CET (UTC+1)">Central European Time — CET (UTC+1)</option>
                  <option value="SGT (UTC+8)">Singapore Time — SGT (UTC+8)</option>
                </select>
              </div>

              {/* Toggle 1: Auto suggest close */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid var(--surface-container)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                    Auto-trigger Gemini AI in End Call Modal
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                    Automatically generates an AI summary upon opening the close dialog without needing to click &ldquo;Generate&rdquo;.
                  </div>
                </div>
                <input
                  id="setting-auto-suggest"
                  type="checkbox"
                  checked={form.autoSuggestClose}
                  onChange={(e) => handleChange('autoSuggestClose', e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>

              {/* Toggle 2: Confirm before ending */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid var(--surface-container)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                    Confirm Outcome Before Finalizing
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                    Requires picking an explicit outcome pill before allowing the call to close.
                  </div>
                </div>
                <input
                  id="setting-confirm-ending"
                  type="checkbox"
                  checked={form.confirmBeforeEndingCall}
                  onChange={(e) => handleChange('confirmBeforeEndingCall', e.target.checked)}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Backend & Database Connection */}
          <div className="card" style={{
            background: 'var(--surface-lowest)',
            border: '1px solid var(--outline-variant)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-xl)',
            boxShadow: 'var(--shadow-1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid var(--outline-variant)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: 20 }}>database</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--on-surface)' }}>Connection Health</h3>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                    Express backend and Supabase integration status.
                  </div>
                </div>
              </div>
              <button
                id="btn-recheck-health"
                type="button"
                className="btn-secondary"
                onClick={runHealthCheck}
                disabled={checkingHealth}
                style={{ height: 28, padding: '0 10px', fontSize: 11 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>sync</span>
                {checkingHealth ? 'Checking…' : 'Ping /health'}
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--surface-low)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: healthStatus?.error ? 'var(--error)' : 'var(--tertiary)',
                  display: 'inline-block',
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                    {healthStatus?.error ? 'Backend Unreachable' : 'Express API Connected'}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--on-surface-variant)' }}>
                    {healthStatus?.error
                      ? `Error: ${healthStatus.error}`
                      : `Status: 200 OK · Latency: ${healthStatus?.latency || 0}ms`}
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                background: healthStatus?.error ? 'var(--error-container)' : 'var(--tertiary-fixed)',
                color: healthStatus?.error ? 'var(--error)' : 'var(--on-tertiary-fixed)',
                fontWeight: 600,
              }}>
                {healthStatus?.error ? 'OFFLINE' : 'ONLINE'}
              </span>
            </div>

            {/* Clear cache action */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--on-surface)' }}>
                  Local Storage Cache
                </div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  Clears local offline cache. Database records in Supabase are safely preserved.
                </div>
              </div>
              <button
                id="btn-clear-cache"
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (window.confirm('Clear local browser call cache? This will re-fetch all calls from Supabase.')) {
                    if (onClearCache) onClearCache();
                  }
                }}
                style={{ height: 32, padding: '0 12px', fontSize: 12, color: 'var(--error)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete_sweep</span>
                Clear Cache
              </button>
            </div>
          </div>

          {/* Action buttons footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <button
              id="btn-reset-defaults"
              type="button"
              className="btn-secondary"
              onClick={handleResetDefaults}
              style={{ height: 36, padding: '0 16px', fontSize: 13 }}
            >
              Reset to Defaults
            </button>
            <button
              id="btn-save-settings-bottom"
              type="submit"
              className="btn-primary"
              style={{ height: 36, padding: '0 20px', fontSize: 13 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
