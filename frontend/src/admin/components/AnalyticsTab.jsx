import { useState, useEffect } from 'react';
import { api } from '../hooks/useApi';

export default function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const d = await api('/api/analytics/admin/summary');
        if (mounted) setData(d.data);
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="tab-loading">Loading analytics…</div>;
  if (error) return <div className="tab-error">{error}</div>;
  if (!data) return null;

  return (
    <div className="tab-panel">
      <h2 className="tab-title">Analytics (Last 30 days)</h2>

      <div className="dash-cards">
        <div className="dash-card">
          <span className="dash-label">Total Events</span>
          <span className="dash-value">{(data.events || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Unique Sessions</span>
          <span className="dash-value">{(data.uniqueSessions || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-section">
          <h3>Devices</h3>
          {(!data.devices || data.devices.length === 0) ? (
            <div className="empty-state">No device data.</div>
          ) : (
            <div className="bar-list">
              {data.devices.map(d => (
                <div key={d._id} className="bar-item">
                  <span className="bar-label">{d._id}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.min(100, (d.count / (data.events || 1)) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{d.count.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analytics-section">
          <h3>Top Pages</h3>
          {(!data.paths || data.paths.length === 0) ? (
            <div className="empty-state">No page data.</div>
          ) : (
            <div className="bar-list">
              {data.paths.map(p => (
                <div key={p._id} className="bar-item">
                  <span className="bar-label">{p._id}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.min(100, (p.count / (data.paths[0].count || 1)) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{p.count.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analytics-section">
          <h3>Top Events</h3>
          {(!data.topEvents || data.topEvents.length === 0) ? (
            <div className="empty-state">No event data.</div>
          ) : (
            <div className="bar-list">
              {data.topEvents.map(e => (
                <div key={e._id} className="bar-item">
                  <span className="bar-label">{e._id}</span>
                  <div className="bar-track">
                    <div className="bar-fill teal" style={{ width: `${Math.min(100, (e.count / (data.topEvents[0].count || 1)) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{e.count.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="analytics-section">
          <h3>Top CTAs</h3>
          {(!data.ctas || data.ctas.length === 0) ? (
            <div className="empty-state">No CTA data.</div>
          ) : (
            <div className="bar-list">
              {data.ctas.map(c => (
                <div key={c._id} className="bar-item">
                  <span className="bar-label">{c._id || 'Unknown'}</span>
                  <div className="bar-track">
                    <div className="bar-fill gold" style={{ width: `${Math.min(100, (c.count / (data.ctas[0].count || 1)) * 100)}%` }} />
                  </div>
                  <span className="bar-value">{c.count.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
