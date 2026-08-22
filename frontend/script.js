// ---- Nav shrink on scroll ----
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, {passive:true});

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
      message: document.getElementById('f-message').value.trim()
    };
    if (!payload.name || !payload.phone || !payload.email) {
      statusEl.textContent = 'Please fill your name, phone and email.';
      statusEl.style.color = '#e0716b';
      return;
    }
    const apiBase = window.API_BASE_URL || '';
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
      const res = await fetch(apiBase + '/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Request failed');
      statusEl.textContent = 'Thank you! We will contact you soon at 8957197142.';
      statusEl.style.color = '#49c2b0';
      inquiryForm.reset();
    } catch (err) {
      statusEl.textContent = 'Something went wrong. Please call us at 8957197142 instead.';
      statusEl.style.color = '#e0716b';
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}
