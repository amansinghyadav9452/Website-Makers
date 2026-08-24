import { useState, useEffect, useCallback } from 'react';
import { api } from '../hooks/useApi';

export default function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', role: 'Client', rating: 5, text: '', approved: false, featured: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api('/api/reviews/admin');
      setReviews(d.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addReview = async (e) => {
    e.preventDefault();
    try {
      await api('/api/reviews', {
        method: 'POST',
        body: JSON.stringify(newReview)
      });
      setNewReview({ name: '', role: 'Client', rating: 5, text: '', approved: false, featured: true });
      setShowAdd(false);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleApproved = async (id, current) => {
    try {
      await api(`/api/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ approved: !current })
      });
      setReviews(prev => prev.map(r => r._id === id ? { ...r, approved: !current } : r));
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleFeatured = async (id, current) => {
    try {
      await api(`/api/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ featured: !current })
      });
      setReviews(prev => prev.map(r => r._id === id ? { ...r, featured: !current } : r));
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    try {
      await api(`/api/reviews/${id}`, { method: 'DELETE' });
      setReviews(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <h2 className="tab-title">Reviews</h2>
        <button className="btn btn-gold" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : '+ Add review'}
        </button>
      </div>

      {showAdd && (
        <form className="inline-form stacked" onSubmit={addReview}>
          <div className="form-row">
            <input
              placeholder="Name"
              value={newReview.name}
              onChange={e => setNewReview({ ...newReview, name: e.target.value })}
              required
            />
            <input
              placeholder="Role"
              value={newReview.role}
              onChange={e => setNewReview({ ...newReview, role: e.target.value })}
            />
            <select
              value={newReview.rating}
              onChange={e => setNewReview({ ...newReview, rating: Number(e.target.value) })}
            >
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} stars</option>)}
            </select>
          </div>
          <textarea
            placeholder="Review text"
            rows={3}
            value={newReview.text}
            onChange={e => setNewReview({ ...newReview, text: e.target.value })}
            required
          />
          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newReview.approved}
                onChange={e => setNewReview({ ...newReview, approved: e.target.checked })}
              />
              Approved
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={newReview.featured}
                onChange={e => setNewReview({ ...newReview, featured: e.target.checked })}
              />
              Featured
            </label>
            <button type="submit" className="btn btn-gold">Add Review</button>
          </div>
        </form>
      )}

      {loading && <div className="tab-loading">Loading…</div>}
      {error && <div className="tab-error">{error}</div>}

      {!loading && reviews.length === 0 && (
        <div className="empty-state">No reviews yet.</div>
      )}

      {!loading && reviews.length > 0 && (
        <div className="reviews-grid">
          {reviews.map(r => (
            <div key={r._id} className={`review-card ${r.approved ? 'approved' : 'pending'}`}>
              <div className="review-header">
                <strong>{r.name}</strong>
                <span className="review-role">{r.role}</span>
                <span className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              </div>
              <p className="review-text">{r.text}</p>
              <div className="review-actions">
                <button onClick={() => toggleApproved(r._id, r.approved)}>
                  {r.approved ? 'Unapprove' : 'Approve'}
                </button>
                <button onClick={() => toggleFeatured(r._id, r.featured)}>
                  {r.featured ? 'Unfeature' : 'Feature'}
                </button>
                <button className="danger" onClick={() => deleteReview(r._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
