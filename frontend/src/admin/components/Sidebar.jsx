import { useState, useEffect } from 'react';
import { api, clearToken } from '../hooks/useApi';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'inquiries', label: 'Inquiries', icon: '✉' },
  { id: 'clients', label: 'Clients', icon: '◉' },
  { id: 'reviews', label: 'Reviews', icon: '★' },
  { id: 'analytics', label: 'Analytics', icon: '◆' },
  { id: 'settings', label: 'Settings', icon: '◎' }
];

export default function Sidebar({ activeTab, onTabChange, onLogout }) {
  const [health, setHealth] = useState({ ok: true, db: 'unknown' });
  const [counts, setCounts] = useState({ inquiries: 0, clients: 0 });

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const h = await api('/health', {}, null);
        if (mounted) setHealth(h);
      } catch {
        if (mounted) setHealth({ ok: false, db: 'error' });
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [inq, cli] = await Promise.all([
          api('/api/inquiries/admin?status=new&limit=1'),
          api('/api/clients')
        ]);
        if (mounted) setCounts({ inquiries: inq.total || 0, clients: cli.data?.length || 0 });
      } catch {
        // silent
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <aside className="sidebar">
      <div className="brand-mark">
        <span>W</span>
        <div>
          <b>Website</b> <em>Makers</em>
          <small>ADMIN CONSOLE</small>
        </div>
      </div>
      <nav>
        {TABS.map(t => (
          <a
            key={t.id}
            href={`#${t.id}`}
            className={activeTab === t.id ? 'active' : ''}
            onClick={e => { e.preventDefault(); onTabChange(t.id); }}
          >
            <span>{t.icon}</span>
            {t.label}
            {t.id === 'inquiries' && counts.inquiries > 0 && (
              <b>{counts.inquiries > 99 ? '99+' : counts.inquiries}</b>
            )}
            {t.id === 'clients' && counts.clients > 0 && (
              <b>{counts.clients}</b>
            )}
          </a>
        ))}
      </nav>
      <div className="side-bottom">
        <div className={`health ${health.ok ? 'ok' : 'err'}`}>
          <i />
          <span>{health.ok ? 'API online' : 'API offline'}</span>
        </div>
        <button className="logout-btn" onClick={() => { clearToken(); onLogout(); }}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
