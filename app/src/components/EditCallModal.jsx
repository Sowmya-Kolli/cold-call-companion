// EditCallModal.jsx — Modal for editing saved historical call data and stage notes
import { useState } from 'react';
import { STAGES, OUTCOMES } from '../data/mockData';

export default function EditCallModal({ call, onSave, onClose }) {
  const [formData, setFormData] = useState({
    prospectName:  call.prospectName || '',
    company:       call.company || '',
    prospectTitle: call.prospectTitle || '',
    companyType:   call.companyType || '',
    phone:         call.phone || '',
    email:         call.email || '',
    location:      call.location || '',
    outcome:       call.outcome || '',
    nextStep:      call.nextStep || '',
  });

  // Map of stageNumber -> prospectWords
  const [stageNotes, setStageNotes] = useState(() => {
    const map = {};
    STAGES.forEach(s => {
      const match = call.stageData?.find(sd => sd.stageId === s.id);
      map[s.id] = match?.prospectWords ? match.prospectWords.replace(/^"|"$/g, '') : '';
    });
    return map;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'stages'

  const handleFieldChange = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
    if (error) setError('');
  };

  const handleStageNoteChange = (stageId, val) => {
    setStageNotes(prev => ({ ...prev, [stageId]: val }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (saving) return;

    if (!formData.prospectName.trim()) {
      setError('Prospect Name cannot be empty.');
      return;
    }
    if (!formData.company.trim()) {
      setError('Company cannot be empty.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Build updated stageResults array
      const stageResults = STAGES.map(s => {
        const existingStage = call.stageData?.find(sd => sd.stageId === s.id);
        const words = stageNotes[s.id]?.trim() || '';
        return {
          stageNumber: s.id,
          whatHappened: existingStage?.selectedChips || [],
          prospectWords: words ? `"${words}"` : '',
        };
      }).filter(s => s.prospectWords || (s.whatHappened && s.whatHappened.length > 0));

      const payload = {
        prospectName:  formData.prospectName.trim(),
        company:       formData.company.trim(),
        prospectTitle: formData.prospectTitle.trim(),
        companyType:   formData.companyType.trim(),
        phone:         formData.phone.trim(),
        email:         formData.email.trim(),
        location:      formData.location.trim(),
        outcome:       call.status === 'closed' ? (formData.outcome || null) : undefined,
        nextStep:      formData.nextStep.trim(),
        stageResults,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update call. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      id="edit-call-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-call-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      <div className="modal-box" style={{ maxWidth: 640 }} id="edit-call-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon" style={{ background: 'var(--primary-fixed)', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
            </div>
            <div>
              <div className="modal-title" id="edit-call-modal-title">Edit Call Details</div>
              <div className="modal-subtitle">Update prospect information and historical stage notes</div>
            </div>
          </div>
          <button
            id="edit-call-close-btn"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Read-only metadata badge row */}
        <div style={{
          padding: '8px 20px',
          background: 'var(--surface-low)',
          borderBottom: '1px solid var(--outline-variant)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--on-surface-variant)',
        }}>
          <div>
            <strong>Status:</strong> {call.status === 'closed' ? 'Closed' : 'In Progress'} · <strong>Stage Reached:</strong> {call.furthestStage}/8
          </div>
          <div>
            <strong>Date:</strong> {call.date} · <strong>Duration:</strong> {call.duration} (read-only)
          </div>
        </div>

        {/* Tabs for switching between details and stage notes */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--outline-variant)',
          background: 'var(--surface-lowest)',
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'details' ? 'var(--surface-lowest)' : 'var(--surface-low)',
              borderBottom: activeTab === 'details' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'details' ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>badge</span>
            Prospect &amp; Business Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('stages')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              background: activeTab === 'stages' ? 'var(--surface-lowest)' : 'var(--surface-low)',
              borderBottom: activeTab === 'stages' ? '2px solid var(--primary)' : 'none',
              color: activeTab === 'stages' ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>receipt_long</span>
            Stage Verbatim Notes
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div style={{
            margin: '12px 20px 0',
            padding: '8px 12px',
            background: 'var(--error-container)',
            color: 'var(--error)',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {activeTab === 'details' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Prospect Name + Title */}
                <div className="form-row-2col">
                  <div>
                    <label htmlFor="edit-prospect-name" className="next-action-label">Prospect Name *</label>
                    <input
                      id="edit-prospect-name"
                      type="text"
                      value={formData.prospectName}
                      onChange={(e) => handleFieldChange('prospectName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-prospect-title" className="next-action-label">Title / Role</label>
                    <input
                      id="edit-prospect-title"
                      type="text"
                      value={formData.prospectTitle}
                      onChange={(e) => handleFieldChange('prospectTitle', e.target.value)}
                    />
                  </div>
                </div>

                {/* Company + Segment */}
                <div className="form-row-2col">
                  <div>
                    <label htmlFor="edit-company" className="next-action-label">Company *</label>
                    <input
                      id="edit-company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleFieldChange('company', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-company-type" className="next-action-label">Company Type / Segment</label>
                    <input
                      id="edit-company-type"
                      type="text"
                      value={formData.companyType}
                      onChange={(e) => handleFieldChange('companyType', e.target.value)}
                    />
                  </div>
                </div>

                {/* Phone + Email */}
                <div className="form-row-2col">
                  <div>
                    <label htmlFor="edit-phone" className="next-action-label">Phone</label>
                    <input
                      id="edit-phone"
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-email" className="next-action-label">Email</label>
                    <input
                      id="edit-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label htmlFor="edit-location" className="next-action-label">Location</label>
                  <input
                    id="edit-location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleFieldChange('location', e.target.value)}
                  />
                </div>

                {/* Outcome & Next Step */}
                <div className="form-row-2col">
                  <div>
                    <label htmlFor="edit-outcome" className="next-action-label">Call Outcome</label>
                    <select
                      id="edit-outcome"
                      value={formData.outcome}
                      onChange={(e) => handleFieldChange('outcome', e.target.value)}
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
                      <option value="">No Outcome Logged</option>
                      {OUTCOMES.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="edit-next-step" className="next-action-label">Agreed Next Step</label>
                    <input
                      id="edit-next-step"
                      type="text"
                      placeholder="e.g. Follow-up demo on Tuesday"
                      value={formData.nextStep}
                      onChange={(e) => handleFieldChange('nextStep', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Stage Notes Editor */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 4 }}>
                  Edit the prospect&apos;s verbatim statements for any stage. Changes will be saved and timestamped.
                </div>
                {STAGES.map((stage) => (
                  <div
                    key={stage.id}
                    style={{
                      background: 'var(--surface-low)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>
                        Stage {stage.id} — {stage.name}
                      </span>
                      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--outline)' }}>
                        {stage.shortName}
                      </span>
                    </div>
                    <textarea
                      id={`edit-stage-notes-${stage.id}`}
                      rows={2}
                      placeholder={`Verbatim words spoken by prospect in Stage ${stage.id}…`}
                      value={stageNotes[stage.id] || ''}
                      onChange={(e) => handleStageNoteChange(stage.id, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: 12,
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--outline-variant)',
                        background: 'var(--surface-lowest)',
                        color: 'var(--on-surface)',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              id="edit-call-cancel-btn"
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              id="edit-call-save-btn"
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ minWidth: 120 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {saving ? 'sync' : 'save'}
              </span>
              {saving ? 'Saving edits…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
