export function initWebsiteInteractions(apiBaseUrl) {
  if (typeof window === 'undefined') return () => {};

  let cleaned = false;
  const sessionKey = 'wm_analytics_session';
  const sessionId = sessionStorage.getItem(sessionKey) || (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  sessionStorage.setItem(sessionKey, sessionId);

  const track = (event, meta = {}) => {
    if (!apiBaseUrl || apiBaseUrl.includes('YOUR-BACKEND')) return;
    const w = window.innerWidth;
    const device = w < 700 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
    fetch(`${apiBaseUrl}/api/analytics/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        event,
        path: location.pathname,
        referrer: document.referrer,
        device,
        browser: navigator.userAgent.slice(0, 80),
        sessionId,
        meta
      })
    }).catch(() => {});
  };

  track('page_view');

  // ---- XSS-safe HTML escape helper ----
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ---- Nav shrink on scroll ----
  const nav = document.getElementById('nav');
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // ---- Track CTA clicks ----
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) track('cta_click', { target: href });
    if (href.includes('/projects/')) track('demo_open', { target: href });
  });

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // ---- Count-up stats ----
  const counters = document.querySelectorAll('.count');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const target = parseInt(e.target.dataset.target, 10);
      const dur = 1200;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        e.target.textContent = Math.floor(p * target);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  counters.forEach(el => cio.observe(el));

  // ---- Magnetic buttons ----
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.setProperty('--tx', `${x * 0.25}px`);
      btn.style.setProperty('--ty', `${y * 0.25}px`);
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.setProperty('--tx', '0px');
      btn.style.setProperty('--ty', '0px');
    });
  });

  // ---- Ambient canvas with IntersectionObserver pause ----
  const canvas = document.getElementById('ambientCanvas');
  let animId = null;
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2 + 0.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.1
      });
    }

    function draw() {
      if (cleaned) return;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > w) p.dx *= -1;
        if (p.y < 0 || p.y > h) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(198, 161, 91, ${p.alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    }

    // Pause canvas when hero is not visible
    const hero = document.querySelector('.hero');
    if (hero) {
      const canvasObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          if (!animId) draw();
        } else {
          if (animId) {
            cancelAnimationFrame(animId);
            animId = null;
          }
        }
      }, { threshold: 0.1 });
      canvasObserver.observe(hero);
      draw(); // Start initially
    } else {
      draw();
    }
  }

  // ---- Typewriter terminal ----
  const typeTarget = document.getElementById('typeTarget');
  if (typeTarget) {
    const lines = [
      '<span class="term-cmd">$</span> npm create vite@latest amara-studio -- --template react',
      '<span class="term-success">✓</span> Project created successfully',
      '<span class="term-cmd">$</span> cd amara-studio && npm install',
      '<span class="term-success">✓</span> Dependencies installed',
      '<span class="term-cmd">$</span> npm run dev',
      '<span class="term-info">➜</span>  Local:   http://localhost:5173/',
      '<span class="term-info">➜</span>  Network: http://192.168.1.42:5173/',
      '<span class="term-cmd">$</span> git add . && git commit -m "Initial commit"',
      '<span class="term-success">✓</span> 5 files changed, 234 insertions(+)',
      '<span class="term-cmd">$</span> <span class="term-blink">_</span>'
    ];
    let lineIdx = 0;
    function typeLine() {
      if (cleaned || lineIdx >= lines.length) return;
      const div = document.createElement('div');
      div.className = 'term-line';
      div.innerHTML = lines[lineIdx];
      typeTarget.appendChild(div);
      lineIdx++;
      setTimeout(typeLine, 800 + Math.random() * 600);
    }
    setTimeout(typeLine, 600);
  }

  // ---- Contact form with loading state ----
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn ? btn.innerHTML : 'Send message';
      const statusEl = document.getElementById('formStatus');

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Sending…';
      }
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = '';
      }

      const data = Object.fromEntries(new FormData(form));
      try {
        const r = await fetch(`${apiBaseUrl}/api/inquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const d = await r.json();
        if (r.ok && d.ok) {
          if (statusEl) {
            statusEl.textContent = '✓ Message sent! We will get back to you within 24 hours.';
            statusEl.className = 'form-status success';
          }
          form.reset();
          track('form_submit', { status: 'success' });
        } else {
          throw new Error(d.error || 'Something went wrong.');
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = '✗ ' + err.message;
          statusEl.className = 'form-status error';
        }
        track('form_submit', { status: 'error', message: err.message });
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      }
    });
  }

  // ---- Load reviews securely ----
  const loadReviews = async () => {
    try {
      const r = await fetch(`${apiBaseUrl}/api/reviews`);
      if (!r.ok) return;
      const d = await r.json();
      const wrap = document.getElementById('testiWrap');
      if (wrap && Array.isArray(d.data) && d.data.length) {
        wrap.innerHTML = d.data.map(review => {
          const stars = '★'.repeat(Math.min(5, Math.max(1, review.rating || 5))) + '☆'.repeat(5 - Math.min(5, Math.max(1, review.rating || 5)));
          return `<div class="testimonial-card">
            <div class="stars">${escapeHtml(stars)}</div>
            <p class="quote">${escapeHtml(review.text)}</p>
            <div class="author">
              <strong>${escapeHtml(review.name)}</strong>
              <span>${escapeHtml(review.role || 'Client')}</span>
            </div>
          </div>`;
        }).join('');
      }
    } catch {
      // Silently fail — fallback HTML remains visible
    }
  };
  loadReviews();

  // ---- Mobile nav toggle ----
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- Cleanup function ----
  return () => {
    cleaned = true;
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('scroll', onScroll);
    io.disconnect();
    cio.disconnect();
  };
}
