import { useEffect } from 'react';
import { pageMarkup } from './pageMarkup';
import AdminApp from './AdminApp';
import ClientPortal from './ClientPortal';
import { initWebsiteInteractions } from './websiteInteractions';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

export default function App() {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const isPortal = window.location.pathname.startsWith('/portal');
  useEffect(() => {
    if (isAdmin || isPortal) return;
    const cleanup = initWebsiteInteractions(API_BASE_URL);
    const loadReviews = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/reviews`);
        if (!r.ok) return;
        const d = await r.json();
        const wrap = document.getElementById('testiWrap');
        if (wrap && Array.isArray(d.data) && d.data.length) {
          wrap.innerHTML = d.data.map(r => `<div class="testimonial-card"><div class="stars">${'★'.repeat(r.rating || 5)}</div><p>${escapeHtml(r.text)}</p><div class="reviewer"><div class="reviewer-avatar">${escapeHtml((r.name || 'C').slice(0,1).toUpperCase())}</div><div><div class="reviewer-name">${escapeHtml(r.name)}</div><div class="reviewer-role">${escapeHtml(r.role || 'Client')}</div></div></div></div>`).join('');
        }
      } catch {}
    };
    loadReviews();
    return cleanup;
  }, [isAdmin, isPortal]);

  if (isAdmin) return <AdminApp />;
  if (isPortal) return <ClientPortal />;
  return <div dangerouslySetInnerHTML={{ __html: pageMarkup }} />;
}
