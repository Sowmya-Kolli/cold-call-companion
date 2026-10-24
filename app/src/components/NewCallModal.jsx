// NewCallModal.jsx — Modal to start a new call with prospect details
import { useState } from 'react';

export default function NewCallModal({ onStart, onClose }) {
  const [form, setForm] = useState({
    prospectName: '',
    prospectTitle: '',
    company: '',
    companyType: '',
    phone: '',
    email: '',
    location: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleStart = () => {
    if (!form.prospectName.trim() || !form.company.trim()) return;
    onStart(form);
  };

  const isValid = form.prospectName.trim() && form.company.trim();

  return (
    <div
      className="modal-overlay"
      id="new-call-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-call-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-box" style={{ maxWidth: 560 }} id="new-call-modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-row">
            <div className="modal-icon" style={{ background: 'var(--primary-fixed)', color: 'var(--primary-container)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_call</span>
            </div>
            <div>
              <div className="modal-title" id="new-call-modal-title">Start New Call</div>
              <div className="modal-subtitle">Enter prospect details to begin</div>
            </div>
          </div>
          <button id="new-call-close-btn" className="modal-close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <div className="modal-body">
          {/* Prospect name + title */}
          <div className="form-row-2col">
            <div>
              <div className="next-action-label">Prospect Name *</div>
              <input
                id="new-call-name"
                type="text"
                placeholder="e.g. Ananya Sharma"
                value={form.prospectName}
                onChange={set('prospectName')}
                autoFocus
              />
            </div>
            <div>
              <div className="next-action-label">Title / Role</div>
              <input
                id="new-call-title"
                type="text"
                placeholder="e.g. CTO, Business Head"
                value={form.prospectTitle}
                onChange={set('prospectTitle')}
              />
            </div>
          </div>

          {/* Company + type */}
          <div className="form-row-2col">
            <div>
              <div className="next-action-label">Company *</div>
              <input
                id="new-call-company"
                type="text"
                placeholder="e.g. Meridian Growth"
                value={form.company}
                onChange={set('company')}
              />
            </div>
            <div>
              <div className="next-action-label">Segment / Type</div>
              <input
                id="new-call-type"
                type="text"
                placeholder="e.g. B2B SaaS · 450 FTE"
                value={form.companyType}
                onChange={set('companyType')}
              />
            </div>
          </div>

          {/* Phone + email */}
          <div className="form-row-2col">
            <div>
              <div className="next-action-label">Phone</div>
              <input
                id="new-call-phone"
                type="text"
                placeholder="+91 98XXX XXXXX"
                value={form.phone}
                onChange={set('phone')}
              />
            </div>
            <div>
              <div className="next-action-label">Email</div>
              <input
                id="new-call-email"
                type="text"
                placeholder="name@company.com"
                value={form.email}
                onChange={set('email')}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <div className="next-action-label">Location / City</div>
            <input
              id="new-call-location"
              type="text"
              placeholder="e.g. Bangalore, KA, India"
              value={form.location}
              onChange={set('location')}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button id="new-call-cancel-btn" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            id="new-call-start-btn"
            className="btn-primary"
            onClick={handleStart}
            disabled={!isValid}
            style={{ opacity: isValid ? 1 : 0.5, cursor: isValid ? 'pointer' : 'not-allowed' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>phone_in_talk</span>
            Start Call
          </button>
        </div>
      </div>
    </div>
  );
}
