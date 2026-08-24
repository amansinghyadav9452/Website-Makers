import { useState } from 'react';
import { api, setToken } from '../hooks/useApi';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const d = await api('/api/inquiries/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }, null); // no token for login
      setToken(d.token);
      onLogin(d.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-auth">
      <div className="auth-orb orb-one" />
      <div className="auth-orb orb-two" />
      <div className="login-card">
        <div className="brand-mark">
          <span>W</span>
          <div>
            <b>Website</b> <em>Makers</em>
            <small>ADMIN CONSOLE</small>
          </div>
        </div>
        <div className="login-copy">
          <span className="eyebrow">Private workspace</span>
          <h1>Welcome back.</h1>
          <p>Leads, customers, quotes, reviews and analytics in one command center.</p>
        </div>
        <form onSubmit={submit}>
          <label>
            Admin email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={busy}
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button className="primary-btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>
      </div>
    </div>
  );
}
