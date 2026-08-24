import { useState, useEffect, useCallback } from 'react';
import { api } from '../hooks/useApi';
import { fmtDate, money, statusMeta, priorityMeta } from '../utils/formatters';
import Badge from './Badge';

export default function InquiriesTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set('status', statusFilter);
      if (filter) q.set('search', filter);
      q.set('page', String(page));
      q.set('limit', String(limit));
      const d = await api(`/api/inquiries/admin?${q.toString()}`);
      setItems(d.data || []);
      setTotal(d.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const updateInquiry = async (id, updates) => {
    try {
      await api(`/api/inquiries/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
      setItems(prev => prev.map(i => i._id === id ? { ...i, ...updates } : i));
      setEditing(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteInquiry = async (id) => {
    if (!confirm('Delete this inquiry permanently?')) return;
    try {
      await api(`/api/inquiries/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i._id !== id));
      setTotal(prev => prev - 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const pages = Math.ceil(total / limit);

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h2 className="tab-title">Inquiries</h2>
        <span className="tab-count">{total} total</span>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name, email, phone…"
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(1); }}
          className="filter-input"
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="filter-select">
          <option value="">All statuses</option>
          {Object.keys(statusMeta).map(s => (
            <option key={s} value={s}>{statusMeta[s][0]}</option>
          ))}
        </select>
      </div>

      {loading && <div className="tab-loading">Loading…</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loading && items.length === 0 && (
        <div className="empty-state">No inquiries found.</div>
      )}

      {!loading && items.length > 0 && (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Quote</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(inq => (
                  <tr key={inq._id} className={inq.status === 'new' ? 'highlight' : ''}>
                    <td>
                      <strong>{inq.name}</strong>
                      {inq.message && <div className="cell-sub">{inq.message.slice(0, 80)}…</div>}
                    </td>
                    <td>
                      <div>{inq.email}</div>
                      <div className="cell-sub">{inq.phone}</div>
                    </td>
                    <td>
                      {editing === inq._id ? (
                        <select
                          value={inq.status}
                          onChange={e => updateInquiry(inq._id, { status: e.target.value })}
                          className="inline-select"
                        >
                          {Object.keys(statusMeta).map(s => (
                            <option key={s} value={s}>{statusMeta[s][0]}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge type="status" value={inq.status} />
                      )}
                    </td>
                    <td>
                      {editing === inq._id ? (
                        <select
                          value={inq.priority || 'normal'}
                          onChange={e => updateInquiry(inq._id, { priority: e.target.value })}
                          className="inline-select"
                        >
                          {Object.keys(priorityMeta).map(p => (
                            <option key={p} value={p}>{priorityMeta[p]}</option>
                          ))}
                        </select>
                      ) : (
                        <Badge type="priority" value={inq.priority || 'normal'} />
                      )}
                    </td>
                    <td>{inq.quotedPrice ? money(inq.quotedPrice) : '—'}</td>
                    <td>{fmtDate(inq.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button onClick={() => setEditing(editing === inq._id ? null : inq._id)}>
                          {editing === inq._id ? 'Done' : 'Edit'}
                        </button>
                        <button className="danger" onClick={() => deleteInquiry(inq._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span>Page {page} of {pages}</span>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
