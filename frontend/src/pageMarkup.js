export const pageMarkup = String.raw`
<div class="preloader" id="preloader">
  <div class="preloader-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <div class="preloader-orbit orbit-a" aria-hidden="true"></div>
  <div class="preloader-orbit orbit-b" aria-hidden="true"></div>
  <div class="preloader-orbit orbit-c" aria-hidden="true"></div>
  <div class="preloader-sigil" aria-hidden="true"><span>✦</span></div>
  <div class="preloader-core">
    <div class="preloader-aura" aria-hidden="true"></div>
    <div class="preloader-logo"><img src="/assets/sites-maker-logo.png" alt="Sites Maker"></div>
    <div class="preloader-brand">SITES <b>MAKER</b></div>
  </div>
  <div class="preloader-rune" aria-hidden="true">एकोऽहम् द्वितीयो नास्ति</div>
  <div class="preloader-bar"><span></span></div>
  <div class="preloader-status"><span></span><b>CRAFTING YOUR EXPERIENCE</b><em>00%</em></div>
  <button type="button" class="preloader-tap" id="preloaderTap">🔔 Tap for sound</button>
</div>
<div class="motion-progress" aria-hidden="true"><span></span></div>
<div class="cursor-orb" aria-hidden="true"></div>
<canvas id="ambientCanvas" aria-hidden="true"></canvas>

<!-- NAV -->
<nav id="nav">
  <a class="nav-logo" href="#home"><span class="mark-image"><img src="/assets/sites-maker-logo.png" alt="Sites Maker logo"></span><strong>Sites <span>Maker</span></strong></a>
  <ul class="nav-links">
    <li><a href="#about">About</a></li>
    <li><a href="#services">Services</a></li>
    <li><a href="#work">Work</a></li>
    <li><a href="#pricing">Pricing</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a class="nav-cta" href="tel:8957197142">Call: 8957197142</a>
</nav>

<!-- HERO -->
<section class="hero" id="home">
  <div class="hero-noise"></div>
  <div class="hero-glow" id="heroGlow"></div>
  <div class="hero-inner">
    <div class="hero-content">
      <span class="eyebrow">Web development studio · India</span>
      <h1 class="hero-headline"><span class="decode-line" data-text="You imagine it.">You imagine it.</span><br><span class="decode-line" data-text="We ship it live.">We <span class="accent">ship it live.</span></span></h1>
      <p class="lead">Dynamic, fast-loading websites and stores built for Indian businesses — premium design, honest pricing, and a team that actually picks up the phone.</p>
      <div class="hero-btns">
        <a href="tel:8957197142" class="btn btn-gold" data-magnetic>📞 Call now — 8957197142</a>
        <a href="#pricing" class="btn btn-ghost" data-magnetic>View plans</a>
      </div>
      <div class="hero-stats">
        <div class="stat-item"><h3>100%</h3><p>// responsive builds</p></div>
        <div class="stat-item"><h3>SEO</h3><p>// ready to launch</p></div>
        <div class="stat-item"><h3>Direct</h3><p>// human support</p></div>
      </div>
    </div>
    <div class="terminal reveal">
      <div class="terminal-scanline" aria-hidden="true"></div>
      <div class="terminal-bar">
        <span class="terminal-dot"></span><span class="terminal-dot"></span><span class="terminal-dot"></span>
        <span class="terminal-title">building-your-website.html</span>
      </div>
      <div class="terminal-body" id="typeTarget"></div>
      <div class="terminal-status"><span class="live-dot"></span> deploying to production…</div>
    </div>
  </div>
</section>

<!-- ABOUT -->
<section id="about">
  <div class="about-grid">
    <div class="about-copy reveal">
      <span class="eyebrow">About us</span>
      <h2 class="section-title">A web development studio built around Indian businesses</h2>
      <p class="section-sub">Businesses use us for websites and digital products that are attractive, responsive and genuinely built to convert — not just to look good in a screenshot.</p>
      <p class="body">We plan, design and ship every project ourselves, in-house — no outsourced templates, no vanishing after launch. Every site leaves our hands SEO-ready, on budget and delivered before the deadline we quoted.</p>
    </div>
    <div class="about-visual reveal">
      <div class="about-card"><span class="about-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 6l-4 12"/></svg></span><div><h4>Web design & development</h4><p>Custom builds, from wireframe to launch</p></div></div>
      <div class="about-card"><span class="about-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></span><div><h4>E-commerce solutions</h4><p>Complete online store setup</p></div></div>
      <div class="about-card"><span class="about-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="14 6 21 6 21 13"/></svg></span><div><h4>Digital marketing & SEO</h4><p>Grow your organic reach</p></div></div>
      <div class="about-card"><span class="about-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg></span><div><h4>Security & ongoing support</h4><p>SSL, backups and a team on call</p></div></div>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section class="services-bg" id="services">
  <div style="text-align:center; margin:0 auto 4px; max-width:640px;" class="reveal">
    <span class="eyebrow" style="justify-content:center;">Services</span>
    <h2 class="section-title">Your business deserves a website that earns its keep</h2>
    <p class="section-sub" style="margin:0 auto;">Custom development, tuned for every screen, backed by a team that stays on call after launch.</p>
  </div>
  <div class="services-grid stagger">
    <div class="service-card tilt reveal" style="--i:0">
      <div class="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 9l-3 3 3 3M16 9l3 3-3 3M14 6l-4 12"/></svg></div>
      <h3>Website development</h3>
      <p>High-performance websites and custom storefronts designed to scale with your business.</p>
      <div class="service-tags"><span class="tag">WordPress</span><span class="tag">Laravel</span><span class="tag">PHP</span><span class="tag">Node.js</span><span class="tag">React</span></div>
    </div>
    <div class="service-card tilt reveal" style="--i:1">
      <div class="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></div>
      <h3>Custom e-commerce</h3>
      <p>Tailored e-commerce platforms built with robust modern technologies for maximum sales.</p>
      <div class="service-tags"><span class="tag">WooCommerce</span><span class="tag">Shopify</span><span class="tag">Next.js</span><span class="tag">Python</span></div>
    </div>
    <div class="service-card tilt reveal" style="--i:2">
      <div class="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 17 9 11 13 15 21 6"/><polyline points="14 6 21 6 21 13"/></svg></div>
      <h3>Digital marketing</h3>
      <p>Expand your reach through data-driven SEO and social marketing strategies.</p>
      <div class="service-tags"><span class="tag">SEO</span><span class="tag">Social</span><span class="tag">Google Ads</span><span class="tag">Analytics</span></div>
    </div>
    <div class="service-card tilt reveal" style="--i:3">
      <div class="service-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-1-1-2-2-2h-2.5a1.5 1.5 0 0 1 0-3H18a2 2 0 0 0 2-2c0-2-3.6-4-8-4z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7.5" r="1"/></svg></div>
      <h3>Graphic designing</h3>
      <p>Professional visual identities and branding assets that build lasting trust with customers.</p>
      <div class="service-tags"><span class="tag">Brand identity</span><span class="tag">Logo</span><span class="tag">Social banners</span><span class="tag">Print</span></div>
    </div>
  </div>
</section>

<!-- TECHNOLOGIES -->
<section class="tech-bg on-dark">
  <div class="tech-head reveal">
    <span class="eyebrow">Technologies</span>
    <h2 class="section-title">Technologies we build with</h2>
  </div>
  <div class="marquee-wrap">
    <div class="marquee" id="marquee">
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="">PHP</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" alt="">Laravel</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wordpress/wordpress-plain-wordmark.svg" alt="" style="filter:invert(1)">WordPress</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.worldvectorlogo.com/logos/shopify.svg" alt="">Shopify</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/woocommerce/woocommerce-original.svg" alt="">WooCommerce</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" alt="">Node.js</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="">React.js</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" alt="" style="filter:invert(1)">Next.js</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="">Python</div>
      <div class="tech-pill"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeigniter/codeigniter-plain.svg" alt="">CodeIgniter</div>
      <!-- duplicate set for seamless loop -->
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg" alt="">PHP</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/laravel/laravel-original.svg" alt="">Laravel</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/wordpress/wordpress-plain-wordmark.svg" alt="" style="filter:invert(1)">WordPress</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.worldvectorlogo.com/logos/shopify.svg" alt="">Shopify</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/woocommerce/woocommerce-original.svg" alt="">WooCommerce</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" alt="">Node.js</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" alt="">React.js</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-original.svg" alt="" style="filter:invert(1)">Next.js</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg" alt="">Python</div>
      <div class="tech-pill" aria-hidden="true"><img loading="lazy" decoding="async" referrerpolicy="no-referrer" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/codeigniter/codeigniter-plain.svg" alt="">CodeIgniter</div>
    </div>
  </div>
</section>


<section id="work" class="premium-section">
  <div class="premium-heading reveal"><span class="eyebrow">Selected demo builds</span><h2 class="section-title">Built to look expensive. Built to work.</h2><p class="section-sub">Representative builds across business, e-commerce and personal brands.</p></div>
  <div class="project-grid">
    <article class="project-card reveal"><div class="project-preview project-business"><div class="mock-browser"><span></span><span></span><span></span></div><div class="mock-brand">NOVA<span>CO.</span></div><div class="mock-hero-line"></div><div class="mock-hero-line short"></div><div class="mock-cards"><i></i><i></i><i></i></div><div class="project-live"><b></b> WORKING DEMO</div></div><div class="project-info"><span class="project-type">Demo build · Business</span><h3>Nova Business</h3><p>A working business-site demo with responsive layout, service sections and enquiry capture.</p><div class="project-tags"><span>Responsive</span><span>Lead form</span><span>SEO-ready</span></div><a class="project-btn" href="/projects/nova-business/" target="_blank" rel="noopener">Open live demo ↗</a></div></article>
    <article class="project-card reveal"><div class="project-preview project-store"><div class="mock-browser"><span></span><span></span><span></span></div><div class="store-nav">MØDE <small>NEW ARRIVALS · COLLECTION</small></div><div class="store-product"><div class="product-orb"></div><div class="product-copy">ESSENTIAL<br><b>01</b></div></div><div class="project-live"><b></b> WORKING DEMO</div></div><div class="project-info"><span class="project-type">Demo build · E-commerce</span><h3>Mode Store</h3><p>A working storefront with filters, product cards, cart state and checkout interaction.</p><div class="project-tags"><span>Catalog</span><span>Filters</span><span>Cart</span></div><a class="project-btn" href="/projects/mode-store/" target="_blank" rel="noopener">Open live demo ↗</a></div></article>
    <article class="project-card reveal"><div class="project-preview project-creator"><div class="mock-browser"><span></span><span></span><span></span></div><div class="creator-avatar">A</div><div class="creator-name">AMARA</div><div class="creator-line"></div><div class="creator-line small"></div><div class="creator-grid"><i></i><i></i><i></i><i></i></div><div class="project-live"><b></b> WORKING DEMO</div></div><div class="project-info"><span class="project-type">Demo build · Portfolio</span><h3>Amara Studio</h3><p>A working portfolio with category filters, project case-study modals and enquiry capture.</p><div class="project-tags"><span>Portfolio</span><span>Filters</span><span>Case studies</span></div><a class="project-btn" href="/projects/amara-studio/" target="_blank" rel="noopener">Open live demo ↗</a></div></article>
  </div>
</section>
</div>

<section class="process-section"><div class="premium-heading reveal"><span class="eyebrow">How it works</span><h2 class="section-title">From rough idea to live website.</h2><p class="section-sub">A simple process, without the mysterious agency fog machine.</p></div><div class="process-grid"><div class="process-step reveal"><span>01</span><i>✦</i><h3>Discover</h3><p>Understand the business, audience and actual problem.</p></div><div class="process-step reveal"><span>02</span><i>◈</i><h3>Design</h3><p>Shape structure, visual direction and responsive layouts.</p></div><div class="process-step reveal"><span>03</span><i>⌁</i><h3>Build</h3><p>Develop, integrate, test and tune for real devices.</p></div><div class="process-step reveal"><span>04</span><i>↗</i><h3>Launch</h3><p>Deploy, connect the domain and verify everything.</p></div></div></section>

<div class="quote-calculator reveal" id="quoteCalculator"><div class="calculator-copy"><span class="eyebrow">Instant estimate</span><h3>Build your website budget.</h3><p>Choose what you need. The estimate updates instantly. Final pricing is confirmed after project scope.</p><div class="calculator-total"><small>Estimated starting range</small><strong id="quoteTotal">₹18,000</strong><span id="quoteNote">Starter build</span></div></div><div class="calculator-controls"><label>Website type<select id="quoteType"><option value="18000">Business website</option><option value="26000">Portfolio / personal brand</option><option value="35000">E-commerce website</option><option value="42000">Custom web application</option></select></label><label>Extra pages <output id="pagesOut">0</output><input id="quotePages" type="range" min="0" max="10" value="0"></label><label class="check-row"><input id="quoteAdmin" type="checkbox"><span>Admin panel</span><b>+₹6k</b></label><label class="check-row"><input id="quotePayment" type="checkbox"><span>Payment gateway</span><b>+₹7k</b></label><label class="check-row"><input id="quoteSeo" type="checkbox"><span>SEO setup</span><b>+₹4k</b></label><label class="check-row"><input id="quoteDeploy" type="checkbox"><span>Deployment + domain setup</span><b>+₹3k</b></label><a href="#contact" class="btn btn-gold calculator-cta">Request this build →</a></div></div>

<section class="live-build-strip reveal"><div class="live-build-left"><span class="eyebrow">Production pipeline</span><h2>Watch the handoff happen.</h2><p>Design → code → test → deploy.</p></div><div class="build-pipeline"><div class="pipeline-node active"><span>01</span><b>Design</b></div><div class="pipeline-connector"></div><div class="pipeline-node"><span>02</span><b>Build</b></div><div class="pipeline-connector"></div><div class="pipeline-node"><span>03</span><b>Test</b></div><div class="pipeline-connector"></div><div class="pipeline-node"><span>04</span><b>Deploy</b></div><div class="pipeline-status"><b></b><span id="pipelineStatus">DESIGNING</span></div></div></section>

<!-- PRICING -->
<section id="pricing">
  <div style="text-align:center; margin:0 auto 4px; max-width:600px;" class="reveal">
    <span class="eyebrow" style="justify-content:center;">Pricing</span>
    <h2 class="section-title">Plans built around what you need</h2>
    <p class="section-sub" style="margin:0 auto;">Every project is scoped and quoted individually — tell us what you need and we'll send a clear, no-surprises quote.</p>
  </div>
  <div class="plans-grid stagger">
    <div class="plan-card tilt reveal" style="--i:0">
      <p class="plan-name">Starter plan</p>
      <p class="plan-tagline">For new businesses getting online</p>
      <ul class="plan-features">
        <li>5 page website</li>
        <li>1 year free domain (.com/.in/.org)</li>
        <li>1 year free cloud hosting</li>
        <li>Dynamic website, premium design</li>
        <li>Admin access</li>
        <li>Free SSL certificate</li>
        <li>SEO-ready & responsive</li>
        <li>WhatsApp & call button, inquiry form</li>
        <li>1 year free technical support</li>
      </ul>
      <a href="#contact" class="plan-btn">Get a free quote</a>
    </div>
    <div class="plan-card popular tilt reveal" style="--i:1">
      <span class="popular-badge">★ Most popular</span>
      <p class="plan-name">Growth plan</p>
      <p class="plan-tagline">For businesses ready to scale up</p>
      <ul class="plan-features">
        <li>Up to 12 page website</li>
        <li>1 year free domain & hosting</li>
        <li>Dynamic website, premium design</li>
        <li>Admin access + Google Search Console</li>
        <li>Free SSL certificate</li>
        <li>SEO-ready & responsive</li>
        <li>Payment gateway integration</li>
        <li>WhatsApp & call button, inquiry form</li>
        <li>1 year free technical support</li>
      </ul>
      <a href="#contact" class="plan-btn">Get a free quote</a>
    </div>
    <div class="plan-card tilt reveal" style="--i:2">
      <p class="plan-name">E-commerce plan</p>
      <p class="plan-tagline">For businesses ready to sell online</p>
      <ul class="plan-features">
        <li>Full online store, product catalogue</li>
        <li>1 year free domain & hosting</li>
        <li>Premium design + admin access</li>
        <li>Google Search Console setup</li>
        <li>Auto invoice bill generator</li>
        <li>Order notification features</li>
        <li>Payment gateway integration</li>
        <li>1 year free technical support</li>
      </ul>
      <a href="#contact" class="plan-btn">Get a free quote</a>
    </div>
    <div class="plan-card tilt reveal" style="--i:3">
      <p class="plan-name">Custom plan</p>
      <p class="plan-tagline">For projects with specific requirements</p>
      <ul class="plan-features">
        <li>Pages & features as per requirement</li>
        <li>1 year free domain & hosting</li>
        <li>Dynamic website, any type</li>
        <li>Admin access + Google Search Console</li>
        <li>Free SSL certificate</li>
        <li>All integrations included</li>
        <li>1 year free technical support</li>
      </ul>
      <a href="#contact" class="plan-btn">Talk to us</a>
    </div>
  </div>
  <p style="text-align:center; margin-top:32px; font-size:.86rem; color:var(--muted-dark);">All plans include a free consultation call — pricing depends on scope and is shared privately, never on the page.</p>
</section>

<!-- WHY US -->
<section class="why-bg">
  <div style="text-align:center; margin:0 auto; max-width:600px;" class="reveal">
    <span class="eyebrow" style="justify-content:center;">Why choose us</span>
    <h2 class="section-title">Why businesses choose a practical web partner</h2>
  </div>
  <div class="why-grid stagger">
    <div class="why-card reveal" style="--i:0"><div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 14.3 0 18M12 3c-2.5 2.7-2.5 14.3 0 18"/></svg></div><h4>1 year free domain & hosting</h4><p>Get your domain and hosting absolutely free for the first year with every plan.</p></div>
    <div class="why-card reveal" style="--i:1"><div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 9 9c0-1-1-2-2-2h-2.5a1.5 1.5 0 0 1 0-3H18a2 2 0 0 0 2-2c0-2-3.6-4-8-4z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7.5" r="1"/></svg></div><h4>Dynamic premium designs</h4><p>Visually attractive, modern websites that convert visitors into customers.</p></div>
    <div class="why-card reveal" style="--i:2"><div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13a8 8 0 0 1 16 0v5a2 2 0 0 1-2 2h-1v-6h3M4 13v5a2 2 0 0 0 2 2h1v-6H4"/></svg></div><h4>responsive support</h4><p>Direct support is available through phone, WhatsApp and email, with response times agreed for each project.</p></div>
    <div class="why-card reveal" style="--i:3"><div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12l9-9h9v9l-9 9-9-9z"/><circle cx="15" cy="9" r="1.5"/></svg></div><h4>Transparent, fair pricing</h4><p>No hidden costs — every quote is scoped clearly before we begin work.</p></div>
    <div class="why-card reveal" style="--i:4"><div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><h4>On-time delivery</h4><p>We agree a delivery timeline before work starts and communicate changes when scope changes.</p></div>
    <div class="why-card reveal" style="--i:5"><div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c3 2 5 6 5 10 0 2-1 4-1 4l-4 2-4-2s-1-2-1-4c0-4 2-8 5-10z"/><circle cx="12" cy="10" r="1.6"/><path d="M8 16l-2 4 4-1M16 16l2 4-4-1"/></svg></div><h4>Innovation & creativity</h4><p>We bring fresh ideas to every project to help your business stand out online.</p></div>
    <div class="why-card reveal" style="--i:6"><div class="why-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg></div><h4>Security built in</h4><p>HTTPS, server-side validation, rate limiting and protected API routes are used where the project requires them.</p></div>
  </div>
</section>

<!-- TRUST / SECURITY BAND -->
<section class="trust-band on-dark">
  <div class="trust-grid reveal">
    <div class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
      <div><h4>SSL encrypted, always</h4><p>Every site we ship runs on HTTPS by default.</p></div>
    </div>
    <div class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>
      <div><h4>Your data stays private</h4><p>Inquiries are stored securely and never sold or shared.</p></div>
    </div>
    <div class="trust-item">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/></svg>
      <div><h4>Spam-protected forms</h4><p>Bot and abuse filtering built into every contact form.</p></div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section id="testimonials">
  <div class="testi-head reveal">
    <div>
      <span class="eyebrow">Testimonials</span>
      <h2 class="section-title">What our clients say</h2>
      <p class="section-sub">Customer satisfaction is our topmost priority — here's the record.</p>
    </div>
    <span class="testi-hint">← drag to browse →</span>
  </div>
  <div class="testi-track-wrap" id="testiWrap">
    <div class="testi-track">
      <div class="testimonial-card testimonial-empty"><div class="stars">✦</div><p>Approved client feedback will appear here as projects are completed.</p><div class="reviewer"><div class="reviewer-avatar logo-avatar"><img src="/assets/sites-maker-logo.png" alt="Sites Maker"></div><div><div class="reviewer-name">Sites Maker</div><div class="reviewer-role">Client feedback</div></div></div></div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section id="contact" class="contact-bg">
  <div class="contact-grid">
    <div class="contact-info reveal">
      <span class="eyebrow">Contact us</span>
      <h2 class="section-title">Let's build something great together</h2>
      <p class="lead">Have a project in mind or just want to ask us something? We're always ready to help — reach out and we'll respond as soon as possible.</p>
      <div class="contact-item"><div class="contact-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg></div><div><h4>Phone / WhatsApp</h4><a href="tel:8957197142">+91-8957197142</a></div></div>
      <div class="contact-item"><div class="contact-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg></div><div><h4>Email address</h4><a href="mailto:websitemaker695@gmail.com">websitemaker695@gmail.com</a></div></div>
      <div class="contact-item"><div class="contact-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 14.3 0 18M12 3c-2.5 2.7-2.5 14.3 0 18"/></svg></div><div><h4>We serve</h4><span>India & worldwide — remote & online</span></div></div>
      <div class="contact-item"><div class="contact-item-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div><div><h4>Availability</h4><span>Business hours + support windows are confirmed with each project.</span></div></div>
    </div>
    <div class="contact-form reveal">
      <h3>Submit your query</h3>
      <form id="inquiryForm">
        <div class="form-row">
          <div class="form-group"><label>Your name</label><input id="f-name" type="text" placeholder="Enter your name" required></div>
          <div class="form-group"><label>Phone number</label><input id="f-phone" type="tel" placeholder="Your phone number" required></div>
        </div>
        <div class="form-group"><label>Email address</label><input id="f-email" type="email" placeholder="your@email.com" required></div>
        <div class="form-group"><label>Service required</label>
          <select id="f-service">
            <option>Website Development</option>
            <option>E-Commerce Website</option>
            <option>Digital Marketing / SEO</option>
            <option>Graphic Designing</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group"><label>Message</label><textarea id="f-message" placeholder="Describe your project..."></textarea></div>
        <div class="hp-field" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" type="text" tabindex="-1" autocomplete="off"></div>
        <p id="formStatus" style="font-size:.8rem;margin-bottom:14px;min-height:16px;font-family:'JetBrains Mono',monospace;"></p>
        <button type="submit" class="submit-btn" id="submitBtn">Send message →</button>
        <p class="form-privacy"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg> Your details are encrypted in transit and never shared.</p>
      </form>
    </div>
  </div>
</section>

<!-- FAQ -->
<section class="services-bg">
  <div style="text-align:center; margin:0 auto; max-width:600px;" class="reveal">
    <span class="eyebrow" style="justify-content:center;">FAQ</span>
    <h2 class="section-title">Frequently asked questions</h2>
  </div>
  <div class="faq-grid">
    <details><summary>What is the difference between web design and web development?<span class="plus"></span></summary><p>Web design focuses on the visual layout and aesthetics — how a site looks, while web development focuses on the functionality — how the site works. Designers use tools like Figma and Photoshop; developers use HTML, CSS, JavaScript, PHP and more. We provide both under one roof.</p></details>
    <details><summary>How long does it take to build a website?<span class="plus"></span></summary><p>A standard website is typically delivered within 7–10 business days. Larger e-commerce or custom projects may take 15–30 days. We always provide a clear timeline before starting and stick to it.</p></details>
    <details><summary>Do you provide free hosting and domain?<span class="plus"></span></summary><p>Yes! Every plan includes 1 year free domain (.com / .in / .org) and 1 year free cloud hosting with a free SSL certificate. Renewal after year one is billed at a transparent, low annual rate — we'll always confirm it with you before renewing.</p></details>
    <details><summary>What is a dynamic website?<span class="plus"></span></summary><p>A dynamic website generates content in response to user interaction and can be easily updated via an admin panel — no coding needed. Perfect for businesses that need to regularly update their content, products, or services.</p></details>
    <details><summary>Do you offer support after the website is launched?<span class="plus"></span></summary><p>Absolutely! Support coverage and response times are defined in the approved project scope. You can reach us through phone, WhatsApp, or email.</p></details>
    <details><summary>Can you build an e-commerce website with payment gateway?<span class="plus"></span></summary><p>Yes! We build fully functional e-commerce websites with payment gateway integration, product categories, order notifications, OTP verification, wallet systems, and auto invoice generation.</p></details>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-grid">
    <div class="footer-brand">
      <div class="footer-logo"><span class="footer-mark-image"><img src="/assets/sites-maker-logo.png" alt="Sites Maker logo"></span><strong>Sites <span>Maker</span></strong></div>
      <p>Web development studio focused on practical, maintainable digital products. We build unique, premium-quality websites and digital products at honest, transparent prices.</p>
      <p>📞 <a href="tel:8957197142" style="color:var(--gold-light);text-decoration:none;">+91-8957197142</a></p>
      <p>✉️ <a href="mailto:websitemaker695@gmail.com" style="color:var(--gold-light);text-decoration:none;">websitemaker695@gmail.com</a></p>
    </div>
    <div class="footer-col">
      <h4>Quick links</h4>
      <ul><li><a href="#home">Home</a></li><li><a href="#about">About us</a></li><li><a href="#services">Services</a></li>
    <li><a href="#work">Work</a></li><li><a href="#pricing">Pricing</a></li><li><a href="#contact">Contact us</a></li></ul>
    </div>
    <div class="footer-col">
      <h4>Our services</h4>
      <ul><li><a href="#services">Website Development</a></li><li><a href="#services">E-Commerce Websites</a></li><li><a href="#services">Digital Marketing / SEO</a></li><li><a href="#services">Graphic Designing</a></li></ul>
    </div>
  </div>
  <div class="footer-legal-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/refund">Refunds</a><a href="/cookies">Cookies</a></div>
  <div class="footer-bottom">
    <p>Sites Maker © 2025. All rights reserved.</p>
    <p>Made with ❤️ in India</p>
  </div>
</footer>

<!-- WhatsApp Float -->
<a class="wa-float" href="https://wa.me/918957197142?text=Hi%2C%20I%20want%20to%20know%20more%20about%20your%20services" target="_blank" title="Chat on WhatsApp">💬</a>

`;
