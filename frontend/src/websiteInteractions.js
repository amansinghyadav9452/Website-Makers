export function initWebsiteInteractions(apiBaseUrl) {
  if (typeof window === 'undefined') return () => {};
  let cleaned = false;
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

// ---- Contact form: submit to backend (MongoDB Atlas via API) ----
const inquiryForm = document.getElementById('inquiryForm');
if (inquiryForm) {
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
      website: document.getElementById('f-website').value // honeypot — must stay empty
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
      statusEl.textContent = 'Thank you! We will contact you soon at 8957197142.';
      statusEl.style.color = '#49c2b0';
      inquiryForm.reset();
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
  const nodes=[...document.querySelectorAll('.pipeline-node')],status=document.getElementById('pipelineStatus');if(nodes.length&&status){const names=['DESIGNING','BUILDING','TESTING','DEPLOYING'];let i=0;setInterval(()=>{nodes.forEach((n,j)=>n.classList.toggle('active',j===i));status.textContent=names[i];i=(i+1)%4},1900)}
})();

  return () => { cleaned = true; };
}
