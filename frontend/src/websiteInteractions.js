export function initWebsiteInteractions(apiBaseUrl) {
  if (typeof window === 'undefined') return () => {};
  let cleaned = false;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Preloader ----
  (() => {
    const pre = document.getElementById('preloader');
    if (!pre) return;
    if (prefersReduced) { pre.remove(); return; }
    requestAnimationFrame(() => pre.classList.add('fill'));
    let done = false;
    const hide = () => {
      if (done) return; done = true;
      pre.classList.add('hide');
      setTimeout(() => pre.remove(), 550);
    };
    setTimeout(hide, 2500);
    setTimeout(hide, 3500); // hard fallback
    window.addEventListener('load', () => setTimeout(hide, 300), { once: true });
  })();

  // ---- TextScramble (decode effect) ----
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#________';
      this.frame = 0; this.queue = []; this.frameRequest = null;
    }
    setText(newText) {
      const oldText = this.el.textContent;
      const length = Math.max(oldText.length, newText.length);
      this.queue = [];
      // slower reveal: each character starts later and takes longer to lock in
      for (let i = 0; i < length; i++) {
        const from = oldText[i] || '';
        const to = newText[i] || '';
        const start = i * 2 + Math.floor(Math.random() * 8);
        const end = start + 22 + Math.floor(Math.random() * 22);
        this.queue.push({ from, to, start, end });
      }
      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;
      this.lastTick = 0;
      return new Promise((resolve) => {
        this.resolve = resolve;
        this.update();
      });
    }
    update(now) {
      // throttle to ~20fps so the scramble reads clearly instead of flickering
      if (now && now - this.lastTick < 55) {
        this.frameRequest = requestAnimationFrame((t) => this.update(t));
        return;
      }
      this.lastTick = now || 0;
      let output = '', complete = 0;
      for (let i = 0, n = this.queue.length; i < n; i++) {
        let { from, to, start, end, char } = this.queue[i];
        if (this.frame >= end) { complete++; output += to; }
        else if (this.frame >= start) {
          if (!char || Math.random() < 0.22) {
            char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.queue[i].char = char;
          }
          output += `<span class="scramble-char">${char}</span>`;
        } else { output += from; }
      }
      this.el.innerHTML = output;
      if (complete === this.queue.length) { this.resolve(); return; }
      this.frame++;
      this.frameRequest = requestAnimationFrame((t) => this.update(t));
    }
  }

  // ---- Hero decode-line trigger ----
  (() => {
    const lines = document.querySelectorAll('.hero-headline .decode-line');
    if (!lines.length) return;
    if (prefersReduced) return;
    const scrambleChars = '!<>-_\\/[]{}—=+*^?#________';
    lines.forEach((line, idx) => {
      const finalText = line.dataset.text || line.textContent;
      const originalHTML = line.innerHTML; // preserves nested <span class="accent">
      // show random characters immediately so the line never flashes readable text first
      line.textContent = finalText.split('').map(c => c === ' ' ? ' ' : scrambleChars[Math.floor(Math.random() * scrambleChars.length)]).join('');
      const scrambler = new TextScramble(line);
      const delay = 1000 + idx * 900;
      setTimeout(() => {
        line.classList.add('scrambling');
        scrambler.setText(finalText).then(() => {
          line.classList.remove('scrambling');
          line.innerHTML = originalHTML; // restore real markup/styling after decoding
        });
      }, delay);
    });
  })();

  // ---- Custom cursor hover expand ----
  (() => {
    const orb = document.querySelector('.cursor-orb');
    if (!orb || !window.matchMedia('(pointer:fine)').matches) return;
    document.querySelectorAll('a, button, [data-magnetic], .tilt, summary').forEach(el => {
      el.addEventListener('mouseenter', () => orb.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => orb.classList.remove('cursor-hover'));
    });
  })();

  // ---- FAQ: only one open at a time ----
  (() => {
    const items = document.querySelectorAll('.faq-grid details');
    items.forEach(item => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          items.forEach(other => { if (other !== item) other.open = false; });
        }
      });
    });
  })();

  // ---- Marquee speeds up briefly while user scrolls ----
  (() => {
    const marquee = document.getElementById('marquee');
    if (!marquee || prefersReduced) return;
    let resetTimer = null;
    window.addEventListener('scroll', () => {
      marquee.style.setProperty('--marquee-speed', '10s');
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => marquee.style.setProperty('--marquee-speed', '32s'), 500);
    }, { passive: true });
  })();
  const sessionKey = 'wm_analytics_session';
  const sessionId = sessionStorage.getItem(sessionKey) || (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  sessionStorage.setItem(sessionKey, sessionId);
  const track = (event, meta={}) => {
    if (!apiBaseUrl || apiBaseUrl.includes('YOUR-BACKEND')) return;
    const w = window.innerWidth;
    const device = w < 700 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
    fetch(`${apiBaseUrl}/api/analytics/events`, {
      method:'POST', headers:{'Content-Type':'application/json'}, keepalive:true,
      body:JSON.stringify({event,path:location.pathname,referrer:document.referrer,device,browser:navigator.userAgent.slice(0,80),sessionId,meta})
    }).catch(()=>{});
  };
  track('page_view');
// ---- Nav shrink on scroll ----
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, {passive:true});

document.addEventListener('click', (e) => { const a=e.target.closest('a'); if(!a)return; const href=a.getAttribute('href')||''; if(href.startsWith('#')) track('cta_click',{target:href}); if(href.includes('/projects/')) track('demo_open',{target:href}); });

// ---- Scroll reveal ----
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, {threshold:.15});
revealEls.forEach(el => io.observe(el));

// ---- Count-up stats ----
const counters = document.querySelectorAll('.count');
const cio = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const target = parseInt(e.target.dataset.target, 10);
    const dur = 1200; const start = performance.now();
    function tick(now){
      const p = Math.min(1, (now-start)/dur);
      e.target.textContent = Math.floor(p*target);
      if (p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}, {threshold:.6});
counters.forEach(el => cio.observe(el));

// ---- Magnetic buttons ----
document.querySelectorAll('[data-magnetic]').forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    btn.style.setProperty('--tx', (x*0.18)+'px');
    btn.style.setProperty('--ty', (y*0.28)+'px');
  });
  btn.addEventListener('mouseleave', () => { btn.style.setProperty('--tx','0px'); btn.style.setProperty('--ty','0px'); });
});

// ---- Hero glow follows cursor ----
const hero = document.querySelector('.hero');
const glow = document.getElementById('heroGlow');
if (hero && glow) {
  hero.addEventListener('mousemove', (e) => {
    const r = hero.getBoundingClientRect();
    glow.style.setProperty('--gx', (r.width - (e.clientX - r.left) - 320) + 'px');
    glow.style.setProperty('--gy', ((e.clientY - r.top) - 320) + 'px');
  });
}

// ---- Card tilt (subtle 3D) ----
document.querySelectorAll('.tilt').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left)/r.width - .5;
    const py = (e.clientY - r.top)/r.height - .5;
    card.style.transform = `perspective(700px) rotateX(${(-py*4.5)}deg) rotateY(${(px*4.5)}deg) translateY(-3px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ---- Testimonial drag-to-scroll ----
const wrap = document.getElementById('testiWrap');
let isDown = false, startX, scrollLeft;
wrap.addEventListener('mousedown', (e) => { isDown = true; wrap.classList.add('grabbing'); startX = e.pageX - wrap.offsetLeft; scrollLeft = wrap.scrollLeft; });
window.addEventListener('mouseup', () => { isDown = false; wrap.classList.remove('grabbing'); });
wrap.addEventListener('mousemove', (e) => {
  if (!isDown) return; e.preventDefault();
  const x = e.pageX - wrap.offsetLeft; wrap.scrollLeft = scrollLeft - (x - startX)*1.4;
});

// ---- Terminal typewriter ----
const codeLines = [
  {t:'&lt;', p:''},
];
const typeTarget = document.getElementById('typeTarget');
const script = [
  {tag:'div', attr:'class', val:'homepage', text:''},
  {tag:'h1', text:'Welcome to Your Business'},
  {tag:'button', attr:'onClick', val:'callNow()', text:'Get Started'},
  {tag:'section', attr:'id', val:'services', text:''},
  {comment:'// SEO-friendly · mobile-first · deployed in 7 days'}
];
function renderLine({tag, attr, val, text, comment}, closing){
  if (comment) return `<span class="tok-com">${comment}</span>`;
  if (closing) return `<span class="tok-tag">&lt;/${tag}&gt;</span>`;
  let s = `<span class="tok-tag">&lt;${tag}</span>`;
  if (attr) s += ` <span class="tok-attr">${attr}</span>=<span class="tok-str">"${val}"</span>`;
  s += `<span class="tok-tag">&gt;</span>`;
  if (text) s += `<span class="tok-plain">${text}</span>`;
  return s;
}
async function typeLoop(){
  typeTarget.innerHTML = '';
  let ln = 1;
  for (const item of script){
    const lineEl = document.createElement('div');
    lineEl.innerHTML = `<span class="ln">${ln++}</span><span class="content"></span>`;
    typeTarget.appendChild(lineEl);
    const full = renderLine(item, false);
    const contentSpan = lineEl.querySelector('.content');
    await typeHTML(contentSpan, full);
    if (!item.comment && item.tag !== 'button' && item.tag !== 'section'){ /* keep simple, no nested closing for brevity */ }
    await sleep(180);
  }
  await sleep(1400);
  typeTarget.style.transition = 'opacity .4s';
  typeTarget.style.opacity = 0;
  await sleep(450);
  typeTarget.style.opacity = 1;
  typeLoop();
}
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function typeHTML(el, html){
  return new Promise((resolve) => {
    // parse into tokens preserving tag structure, reveal char by char based on text content length
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    const full = tmp.innerHTML;
    let i = 0;
    const total = tmp.textContent.length;
    let shown = 0;
    function step(){
      shown++;
      // reveal proportionally by re-slicing textContent isn't trivial with tags, so fade in whole line quickly per char count using a simple char-based typer on textContent then swap
      if (shown >= total){ el.innerHTML = full; resolve(); return; }
      el.textContent = tmp.textContent.slice(0, shown);
      requestAnimationFrame(() => setTimeout(step, 14));
    }
    if (total === 0){ el.innerHTML = full; resolve(); return; }
    step();
  });
}
typeLoop();

// ---- Prefers reduced motion: skip heavy JS motion ----
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

// ---- Contact form: premium animated submission flow ----
const inquiryForm = document.getElementById('inquiryForm');
if (inquiryForm) {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function buildSubmissionOverlay(payload, result) {
    const old = document.querySelector('.submission-flow');
    if (old) old.remove();
    const id = result?.id ? String(result.id).slice(-6).toUpperCase() : 'PENDING';
    const submitted = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    const overlay = document.createElement('div');
    overlay.className = 'submission-flow';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = `
      <div class="submission-backdrop"></div>
      <div class="submission-stage" aria-live="polite">
        <div class="submission-particles" aria-hidden="true"></div><div class="submission-confetti" aria-hidden="true"></div>
        <div class="submission-topbar"><span class="submission-brand">Sites <b>Maker</b></span><span class="submission-secure">● Encrypted</span></div>
        <div class="submission-content">
          <div class="submission-icon-wrap"><div class="submission-icon"></div></div>
          <div class="submission-kicker"></div>
          <h2 class="submission-title"></h2>
          <p class="submission-subtitle"></p>
          <div class="submission-orbit" aria-hidden="true">
            <span class="orbit-item orbit-top">✉<small>Sending</small></span>
            <span class="orbit-item orbit-right">✓<small>Validating</small></span>
            <span class="orbit-item orbit-bottom">▣<small>Securing</small></span>
            <span class="orbit-item orbit-left">▤<small>Storing</small></span>
          </div>
          <div class="submission-progress"><span></span></div>
          <div class="submission-dots"><i></i><i></i><i></i></div>
          <div class="submission-details">
            <div class="detail-row"><span>QUERY ID</span><strong>#SM-${esc(id)} <button class="copy-query" type="button" title="Copy query ID">⧉</button></strong></div>
            <div class="detail-row"><span>SUBMITTED ON</span><strong>${esc(submitted)}</strong></div>
            <div class="detail-row"><span>WE WILL CONTACT YOU ON</span><strong>☎ ${esc(payload.phone)}<br>✉ ${esc(payload.email)}</strong></div>
          </div>
          <button class="submission-cta" type="button">Awesome! ✨</button>
        </div>
        <div class="submission-thanks">✦ Thank you for reaching out to <b>Sites Maker</b>.</div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('submission-lock');
    inquiryForm.setAttribute('aria-hidden', 'true');

    const title = overlay.querySelector('.submission-title');
    const subtitle = overlay.querySelector('.submission-subtitle');
    const kicker = overlay.querySelector('.submission-kicker');
    const icon = overlay.querySelector('.submission-icon-wrap');
    const progress = overlay.querySelector('.submission-progress span');
    const orbit = overlay.querySelector('.submission-orbit');
    const details = overlay.querySelector('.submission-details');
    const cta = overlay.querySelector('.submission-cta');
    const thanks = overlay.querySelector('.submission-thanks');
    const dots = overlay.querySelector('.submission-dots');
    const confetti = overlay.querySelector('.submission-confetti');
    const makeConfetti = () => {
      if (!confetti || reducedMotion) return;
      const pieces = ['#f2d58f','#73f28b','#f59eae','#78d6ff','#ffffff','#d9b75c'];
      confetti.innerHTML = Array.from({length: 34}, (_, i) => {
        const x = Math.random() * 100;
        const delay = Math.random() * .45;
        const duration = 1.8 + Math.random() * 1.4;
        const drift = (Math.random() * 300 - 150).toFixed(1);
        const rise = -(80 + Math.random() * 260).toFixed(1);
        const color = pieces[i % pieces.length];
        const size = 5 + Math.random() * 5;
        return `<i style="--x:${x}%;--d:${delay}s;--t:${duration}s;--drift:${drift}px;--rise:${rise}px;--c:${color};--s:${size}px"></i>`;
      }).join('');
    };

    const setStage = async (name, k, t, sub) => {
      const animated = !reducedMotion && overlay.dataset.stage;
      if (animated) {
        overlay.classList.add('stage-switching');
        await wait(120);
      }
      overlay.dataset.stage = name;
      kicker.textContent = k;
      title.textContent = t;
      subtitle.textContent = sub;
      if (animated) {
        requestAnimationFrame(() => overlay.classList.remove('stage-switching'));
      }
    };

    const finish = () => {
      overlay.classList.add('is-closing');
      document.body.classList.remove('submission-lock');
      inquiryForm.removeAttribute('aria-hidden');
      setTimeout(() => overlay.remove(), reducedMotion ? 0 : 520);
    };

    overlay.querySelector('.copy-query')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(`#SM-${id}`); } catch {}
      overlay.querySelector('.copy-query').textContent = '✓';
    });
    cta.addEventListener('click', finish);

    (async () => {
      overlay.classList.add('is-visible');
      await setStage('submitting','STEP 01 / 05','Submitting your query','Please wait a moment…');
      icon.innerHTML = '<span class="plane" aria-hidden="true"><svg viewBox="0 0 64 64" role="img"><path d="M6 30.5 56 8 36 56l-7-19-23-6.5Z" fill="currentColor"/><path d="M29 37 56 8" fill="none" stroke="#fff6d7" stroke-width="2.5" stroke-linecap="round" opacity=".75"/></svg></span>'; 
      progress.style.width = '32%';
      await wait(reducedMotion ? 80 : 1200);

      await setStage('processing','STEP 02 / 05','Processing your request','This will just take a few seconds…');
      icon.innerHTML = '<span class="pulse-dot"></span>';
      orbit.classList.add('active'); dots.classList.add('active'); progress.style.width = '64%';
      await wait(reducedMotion ? 80 : 1500);

      await setStage('success','STEP 03 / 05','Query submitted successfully!','We’ve received your message and will get back to you shortly.');
      icon.innerHTML = '<span class="check">✓</span>';
      orbit.classList.remove('active'); dots.classList.remove('active'); progress.style.width = '100%';
      overlay.classList.add('celebrate');
      makeConfetti();
      await wait(reducedMotion ? 80 : 1700);

      await setStage('details','STEP 04 / 05','Your submission is confirmed','Here are your reference details.');
      icon.innerHTML = '<span class="check">✓</span>';
      details.classList.add('visible');
      cta.textContent = 'Back to home →';
      await wait(reducedMotion ? 80 : 1200);

      await setStage('final','STEP 05 / 05','You’re all set ✨','Your enquiry is safely in our system.');
      cta.textContent = 'Back to home →';
      thanks.classList.add('visible');
    })();
    return overlay;
  }

  inquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('formStatus');
    const btn = document.getElementById('submitBtn');
    const payload = {
      name: document.getElementById('f-name').value.trim(),
      phone: document.getElementById('f-phone').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      service: document.getElementById('f-service').value,
      message: document.getElementById('f-message').value.trim(),
      website: document.getElementById('f-website')?.value || ''
    };
    if (!payload.name || !payload.phone || !payload.email) {
      statusEl.textContent = 'Please fill your name, phone and email.';
      statusEl.style.color = '#e0716b';
      return;
    }
    const apiBase = (apiBaseUrl || '').replace(/\/$/, '');
    if (!apiBase || apiBase.includes('YOUR-BACKEND-URL')) {
      statusEl.textContent = 'Backend URL not configured yet — set window.API_BASE_URL in index.html.';
      statusEl.style.color = '#e0716b';
      return;
    }
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    statusEl.textContent = '';
    try {
      track('inquiry_submit',{service:payload.service});
      const res = await fetch(apiBase + '/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      inquiryForm.reset();
      buildSubmissionOverlay(payload, data);
    } catch (err) {
      statusEl.textContent = err?.message || 'Unable to reach the server. Please try again or call us at 8957197142.';
      statusEl.style.color = '#e0716b';
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

// =========================================================
// SITES MAKER — ULTRA MOTION PACK
// =========================================================
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  document.body.classList.add('motion-ready');

  // Scroll progress + section cinematic divider.
  const progress = document.querySelector('.motion-progress span');
  const motionSections = document.querySelectorAll('section, footer');
  const updateScrollUI = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progress) progress.style.width = `${pct}%`;
  };
  window.addEventListener('scroll', updateScrollUI, {passive:true});
  updateScrollUI();

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('motion-visible');
    });
  }, {threshold:.12});
  motionSections.forEach(section => sectionObserver.observe(section));

  // Cursor spotlight on desktop.
  const orb = document.querySelector('.cursor-orb');
  if (orb && window.matchMedia('(pointer:fine)').matches) {
    let ox = innerWidth / 2, oy = innerHeight / 2;
    let tx = ox, ty = oy;
    const move = (e) => { tx = e.clientX; ty = e.clientY; };
    window.addEventListener('pointermove', move, {passive:true});
    const renderOrb = () => {
      ox += (tx - ox) * .14;
      oy += (ty - oy) * .14;
      orb.style.left = `${ox}px`;
      orb.style.top = `${oy}px`;
      requestAnimationFrame(renderOrb);
    };
    renderOrb();
  }

  // Ambient particles: intentionally subtle and canvas-only.
  const canvas = document.getElementById('ambientCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d', {alpha:true});
    let w = 0, h = 0, dpr = 1;
    let particles = [];
    let mouseX = -9999, mouseY = -9999;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      w = innerWidth; h = innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const count = w < 700 ? 22 : Math.min(54, Math.floor(w / 24));
      particles = Array.from({length:count}, () => ({
        x: Math.random()*w,
        y: Math.random()*h,
        r: .5 + Math.random()*1.5,
        vx: (Math.random()-.5)*.18,
        vy: -.08 - Math.random()*.22,
        a: .08 + Math.random()*.24,
        phase: Math.random()*Math.PI*2
      }));
    };

    const onPointer = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('pointermove', onPointer, {passive:true});
    window.addEventListener('resize', resize, {passive:true});
    resize();

    const draw = (time) => {
      ctx.clearRect(0,0,w,h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += .012;
        if (p.y < -8) { p.y = h + 8; p.x = Math.random()*w; }
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;

        const dx = p.x - mouseX, dy = p.y - mouseY;
        const dist = Math.hypot(dx,dy);
        if (dist < 130) {
          const force = (130-dist)/130;
          p.x += (dx/dist || 0) * force * .7;
          p.y += (dy/dist || 0) * force * .7;
        }

        const pulse = .72 + Math.sin(p.phase + time*.0005)*.28;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(231,205,147,${p.a*pulse})`;
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // Progressive stagger for cards already present in the page.
  document.querySelectorAll(
    '.services-grid .service-card, .why-grid .why-card, .about-visual .about-card, .faq-grid details, .testimonial-card'
  ).forEach((el, i) => {
    el.style.setProperty('--motion-index', i % 8);
  });

  // Subtle 3D spotlight inside cards on pointer devices.
  const spotlightCards = document.querySelectorAll('.service-card, .plan-card, .why-card, .testimonial-card, .about-card');
  spotlightCards.forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = ((e.clientX-r.left)/r.width)*100;
      const y = ((e.clientY-r.top)/r.height)*100;
      card.style.setProperty('--mx', `${x}%`);
      card.style.setProperty('--my', `${y}%`);
    }, {passive:true});
  });

  // When the contact form succeeds, give the whole card a short success pulse.
  const form = document.getElementById('inquiryForm');
  if (form) {
    const status = document.getElementById('formStatus');
    const observer = new MutationObserver(() => {
      if (status && status.textContent.includes('Thank you')) {
        const box = form.closest('.contact-form');
        if (box) {
          box.classList.remove('success-flash');
          void box.offsetWidth;
          box.classList.add('success-flash');
        }
      }
    });
    if (status) observer.observe(status, {childList:true, characterData:true, subtree:true});
  }
})();

// PREMIUM CONVERSION FEATURES
(() => {
  const type=document.getElementById('quoteType'),pages=document.getElementById('quotePages'),out=document.getElementById('pagesOut'),total=document.getElementById('quoteTotal'),note=document.getElementById('quoteNote');
  if(type&&pages&&total){const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);const update=()=>{let n=+type.value+(+pages.value*1800);if(document.getElementById('quoteAdmin').checked)n+=6000;if(document.getElementById('quotePayment').checked)n+=7000;if(document.getElementById('quoteSeo').checked)n+=4000;if(document.getElementById('quoteDeploy').checked)n+=3000;out.textContent=pages.value;total.textContent=fmt(n);note.textContent=`${pages.value} extra page${pages.value==1?'':'s'} · scope-based estimate`};[type,pages,...document.querySelectorAll('#quoteCalculator input[type=checkbox]')].forEach(x=>x.addEventListener('input',update));update()}
  const nodes=[...document.querySelectorAll('.pipeline-node')],status=document.getElementById('pipelineStatus');
  if(nodes.length&&status){
    const names=['DESIGNING','BUILDING','TESTING','DEPLOYING','LIVE'];
    const statusScrambler = (typeof TextScramble !== 'undefined') ? new TextScramble(status) : null;
    let i=0;
    setInterval(()=>{
      nodes.forEach((n,j)=>n.classList.toggle('active', j===Math.min(i, nodes.length-1)));
      if (statusScrambler && !prefersReduced) statusScrambler.setText(names[i]);
      else status.textContent = names[i];
      i=(i+1)%names.length;
    }, 4000);
  }
})();

  return () => { cleaned = true; };
}
