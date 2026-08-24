import { useEffect } from 'react';
import { pageMarkup } from './pageMarkup';
import AdminApp from './admin/AdminApp';
import ClientPortal from './ClientPortal';
import LegalPages from './LegalPages';
import { initWebsiteInteractions } from './websiteInteractions';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function NotFound() {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page not found</h2>
      <p>The page you are looking for doesn't exist or has been moved. Let's get you back on track.</p>
      <a href="/" className="btn btn-gold">Go home</a>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;
  const isAdmin = path.startsWith('/admin');
  const isPortal = path.startsWith('/portal');
  const legalType = path.startsWith('/privacy') ? 'privacy' 
    : path.startsWith('/terms') ? 'terms' 
    : path.startsWith('/refund') ? 'refund' 
    : path.startsWith('/cookies') ? 'cookies' 
    : null;
  const isHome = path === '/' || path === '/index.html';

  useEffect(() => {
    if (isAdmin || isPortal || !isHome) return;

    const cleanup = initWebsiteInteractions(API_BASE_URL);

    // Handle lazy image loading fade-in
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.classList.add('loaded');
          imgObserver.unobserve(img);
        }
      });
    });
    lazyImages.forEach(img => imgObserver.observe(img));

    return () => {
      cleanup();
      imgObserver.disconnect();
    };
  }, [isAdmin, isPortal, isHome]);

  if (isAdmin) return <AdminApp />;
  if (isPortal) return <ClientPortal />;
  if (legalType) return <LegalPages type={legalType} />;
  if (isHome) {
    return (
      <>
        <div dangerouslySetInnerHTML={{ __html: pageMarkup }} />
        <script dangerouslySetInnerHTML={{ __html: `
          // Expose escapeHtml for any inline scripts that need it
          window.wm = { escapeHtml: ${escapeHtml.toString()} };
        ` }} />
      </>
    );
  }

  return <NotFound />;
}
