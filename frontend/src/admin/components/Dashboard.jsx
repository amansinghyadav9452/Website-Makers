import { useState, useEffect } from 'react';
import { api } from '../hooks/useApi';
import { fmtDate, money } from '../utils/formatters';
import Badge from './Badge';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [inq, rev, cli, stats] = await Promise.all([
          api('/api/inquiries/admin?limit=5'),
          api('/api/reviews/admin'),
          api('/api/clients'),
          api('/api/analytics/admin/summary')
        ]);
        if (mounted) {
          setData({
            inquiries: inq.data || [],
            inquiriesTotal: inq.total || 0,
            reviews: rev.data || [],
            clients: cli.data || [],
            stats: stats.data || {}
          });
        }
      } catch (err) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="tab-loading">Loading dashboard…</div>;
  if (error) return <div className="tab-error">{error}</div>;
  if (!data) return null;

  const newInq = data.inquiries.filter(i => i.status === 'new').length;
  const totalRev = data.reviews.length;
  const approvedRev = data.reviews.filter(r => r.approved).length;

  return (
    <div className="tab-panel">
      <h2 className="tab-title">Dashboard</h2>
      <div className="dash-cards">
        <div className="dash-card">
          <span className="dash-label">Total Inquiries</span>
          <span className="dash-value">{data.inquiriesTotal}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">New Leads</span>
          <span className="dash-value accent">{newInq}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Clients</span>
          <span className="dash-value">{data.clients.length}</span>
        </div>
        <div className="dash-card">
          <span className="dash-label">Reviews</span>
          <span className="dash-value">{approvedRev}/{totalRev} approved</span>
        </div>
        {data.stats?.events !== undefined && (
          <div className="dash-card">
            <span className="dash-label">Events (30d)</span>
            <span className="dash-value">{data.stats.events.toLocaleString('en-IN')}</span>
          </div>
        )}
        {data.stats?.uniqueSessions !== undefined && (
          <div className="dash-card">
            <span className="dash-label">Unique Sessions (30d)</span>
            <span className="dash-value">{data.stats.uniqueSessions.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      <h3 className="section-subtitle">Recent Inquiries</h3>
      {data.inquiries.length === 0 ? (
        <div className="empty-state">No inquiries yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {data.inquiries.map(inq => (
                <tr key={inq._id}>
                  <td>{inq.name}</td>
                  <td>{inq.email}</td>
                  <td><Badge type="status" value={inq.status} /></td>
                  <td>{fmtDate(inq.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
