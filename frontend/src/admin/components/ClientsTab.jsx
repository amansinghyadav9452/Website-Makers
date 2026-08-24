import { useState, useEffect, useCallback } from 'react';
import { api } from '../hooks/useApi';
import { fmtDate } from '../utils/formatters';

export default function ClientsTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', password: '', projectName: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api('/api/clients');
      setClients(d.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addClient = async (e) => {
    e.preventDefault();
    try {
      await api('/api/clients', {
        method: 'POST',
        body: JSON.stringify(newClient)
      });
      setNewClient({ name: '', email: '', password: '', projectName: '' });
      setShowAdd(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteClient = async (id) => {
    if (!confirm('Delete this client permanently?')) return;
    try {
      await api(`/api/clients/${id}`, { method: 'DELETE' });
      setClients(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h2 className="tab-title">Clients</h2>
        <button className="btn btn-gold" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add client'}
        </button>
      </div>

      {showAdd && (
        <form className="inline-form" onSubmit={addClient}>
          <input
            placeholder="Name"
            value={newClient.name}
            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={newClient.email}
            onChange={e => setNewClient({ ...newClient, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={newClient.password}
            onChange={e => setNewClient({ ...newClient, password: e.target.value })}
            required
            minLength={6}
          />
          <input
            placeholder="Project name"
            value={newClient.projectName}
            onChange={e => setNewClient({ ...newClient, projectName: e.target.value })}
          />
          <button type="submit" className="btn btn-gold">Create</button>
        </form>
      )}

      {loading && <div className="tab-loading">Loading…</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loading && clients.length === 0 && (
        <div className="empty-state">No clients yet.</div>
      )}

      {!loading && clients.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Project</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.projectName || '—'}</td>
                  <td><span className="badge blue">{c.status || 'onboarding'}</span></td>
                  <td>{fmtDate(c.createdAt)}</td>
                  <td>
                    <button className="danger" onClick={() => deleteClient(c._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
