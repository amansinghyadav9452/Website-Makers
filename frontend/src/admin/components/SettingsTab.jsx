import { useState } from 'react';
import { clearToken } from '../hooks/useApi';

export default function SettingsTab({ onLogout }) {
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="tab-panel">
      <h2 className="tab-title">Settings</h2>

      <div className="settings-section">
        <h3>Account</h3>
        <p className="settings-desc">Manage your admin session and security preferences.</p>

        <div className="settings-row">
          <div>
            <strong>Admin Session</strong>
            <p className="settings-sub">Your session expires after 8 hours of inactivity.</p>
          </div>
          {!confirmLogout ? (
            <button className="btn btn-ghost" onClick={() => setConfirmLogout(true)}>
              Sign out
            </button>
          ) : (
            <div className="confirm-row">
              <span>Are you sure?</span>
              <button className="btn btn-gold" onClick={() => { clearToken(); onLogout(); }}>
                Yes, sign out
              </button>
              <button className="btn btn-ghost" onClick={() => setConfirmLogout(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <p className="settings-desc">Website Makers Admin Console v1.1.0</p>
        <div className="settings-row">
          <div>
            <strong>Environment</strong>
            <p className="settings-sub">{import.meta.env.MODE || 'production'}</p>
          </div>
        </div>
        <div className="settings-row">
          <div>
            <strong>API Base</strong>
            <p className="settings-sub">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
