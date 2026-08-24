export const pageMarkup = String.raw`
<div class="motion-progress" aria-hidden="true"><span></span></div>
<div class="cursor-orb" aria-hidden="true"></div>
<canvas id="ambientCanvas" aria-hidden="true"></canvas>

<!-- NAV -->
<nav id="nav">
  <a class="nav-logo" href="#home"><span class="mark">W</span>Website <span>Makers</span></a>
  <button id="navToggle" class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
    <span></span><span></span><span></span>
  </button>
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
      <h1>You imagine it.<br>We <span class="accent">ship it live.</span></h1>
      <p class="lead">Dynamic, fast-loading websites and stores built for Indian businesses — premium design, honest pricing, and a team that actually picks up the phone.</p>
      <div class="hero-btns">
        <a href="tel:8957197142" class="btn btn-gold" data-magnetic>📞 Call now — 8957197142</a>
        <a href="#pricing" class="btn btn-ghost" data-magnetic>View plans</a>
      </div>
      <div class="hero-stats">
        <div class="stat-item"><h3><span class="count" data-target="100">0</span><span class="suffix">+</span></h3><p>// clients served</p></div>
        <div class="stat-item"><h3><span class="count" data-target="5">0</span><span class="suffix">★</span></h3><p>// average rating</p></div>
        <div class="stat-item"><h3>Same day</h3><p>// response time</p></div>
      </div>
    </div>
    <div class="terminal reveal">
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
      <p class="section-sub">We are a small team of designers and developers who believe great websites don't need corporate budgets. From landing pages to full e-commerce stores, we ship fast, mobile-first, and SEO-ready.</p>
      <ul class="about-list">
        <li>⚡ Performance-first (90+ PageSpeed)</li>
        <li>📱 Fully responsive on every device</li>
        <li>🔍 SEO structured data & meta tags</li>
        <li>🛡️ Secure hosting & SSL included</li>
      </ul>
    </div>
    <div class="about-visual reveal">
      <div class="code-window">
        <div class="code-bar"><span></span><span></span><span></span></div>
        <pre><code>const website = {
  speed: "fast",
  mobile: true,
  seo: "optimized",
  result: "more customers"
};</code></pre>
      </div>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section class="on-dark" id="services">
  <div class="container">
    <span class="eyebrow">What we do</span>
    <h2 class="section-title">Services that grow your business</h2>
    <div class="services-grid">
      <div class="service-card reveal">
        <div class="service-icon">🌐</div>
        <h3>Business Websites</h3>
        <p>Professional, fast-loading sites that convert visitors into customers. Built with modern stacks.</p>
      </div>
      <div class="service-card reveal">
        <div class="service-icon">🛒</div>
        <h3>E-commerce Stores</h3>
        <p>Full-featured online stores with payment gateways, inventory, and order management.</p>
      </div>
      <div class="service-card reveal">
        <div class="service-icon">⚛️</div>
        <h3>Web Applications</h3>
        <p>Custom dashboards, portals, and SaaS tools with React, Node.js, and MongoDB.</p>
      </div>
      <div class="service-card reveal">
        <div class="service-icon">🔍</div>
        <h3>SEO & Performance</h3>
        <p>Technical SEO, Core Web Vitals optimization, and structured data implementation.</p>
      </div>
    </div>
  </div>
</section>

<!-- WORK / PORTFOLIO -->
<section id="work">
  <div class="container">
    <span class="eyebrow">Selected work</span>
    <h2 class="section-title">Projects we've shipped</h2>
    <div class="work-grid">
      <a href="/projects/amara-studio/" class="work-card reveal">
        <div class="work-img">
          <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80" alt="Amara Studio website preview" loading="lazy" width="800" height="600" />
        </div>
        <div class="work-info">
          <h3>Amara Studio</h3>
          <p>Creative agency portfolio with WebGL effects</p>
          <span class="tag">React</span><span class="tag">Three.js</span>
        </div>
      </a>
      <a href="/projects/mode-store/" class="work-card reveal">
        <div class="work-img">
          <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80" alt="Mode Store e-commerce preview" loading="lazy" width="800" height="600" />
        </div>
        <div class="work-info">
          <h3>Mode Store</h3>
          <p>Fashion e-commerce with 50+ products</p>
          <span class="tag">Next.js</span><span class="tag">Stripe</span>
        </div>
      </a>
      <a href="/projects/nova-business/" class="work-card reveal">
        <div class="work-img">
          <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80" alt="Nova Business corporate website preview" loading="lazy" width="800" height="600" />
        </div>
        <div class="work-info">
          <h3>Nova Business</h3>
          <p>Corporate site with CMS and analytics</p>
          <span class="tag">React</span><span class="tag">Node.js</span>
        </div>
      </a>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="on-dark" id="pricing">
  <div class="container">
    <span class="eyebrow">Pricing</span>
    <h2 class="section-title">Honest pricing, no hidden fees</h2>
    <div class="pricing-grid">
      <div class="pricing-card reveal">
        <h3>Starter</h3>
        <div class="price">₹14,999</div>
        <p class="pricing-desc">Perfect for small businesses and portfolios</p>
        <ul>
          <li>✓ Up to 5 pages</li>
          <li>✓ Mobile responsive</li>
          <li>✓ Contact form</li>
          <li>✓ Basic SEO</li>
          <li>✓ 1 month support</li>
        </ul>
        <a href="#contact" class="btn btn-ghost" data-magnetic>Get started</a>
      </div>
      <div class="pricing-card featured reveal">
        <div class="badge-popular">Most Popular</div>
        <h3>Business</h3>
        <div class="price">₹34,999</div>
        <p class="pricing-desc">For growing businesses that need more</p>
        <ul>
          <li>✓ Up to 15 pages</li>
          <li>✓ CMS integration</li>
          <li>✓ Advanced SEO</li>
          <li>✓ Speed optimization</li>
          <li>✓ 3 months support</li>
        </ul>
        <a href="#contact" class="btn btn-gold" data-magnetic>Get started</a>
      </div>
      <div class="pricing-card reveal">
        <h3>Enterprise</h3>
        <div class="price">Custom</div>
        <p class="pricing-desc">Complex apps, e-commerce, custom solutions</p>
        <ul>
          <li>✓ Unlimited pages</li>
          <li>✓ Custom features</li>
          <li>✓ E-commerce ready</li>
          <li>✓ Priority support</li>
          <li>✓ 6 months support</li>
        </ul>
        <a href="#contact" class="btn btn-ghost" data-magnetic>Contact us</a>
      </div>
    </div>
  </div>
</section>

<!-- TESTIMONIALS -->
<section id="testimonials">
  <div class="container">
    <span class="eyebrow">Testimonials</span>
    <h2 class="section-title">Loved by founders</h2>
    <div class="testimonials-grid" id="testiWrap">
      <!-- Fallback content shown while loading or if API fails -->
      <div class="testimonial-card">
        <div class="stars">★★★★★</div>
        <p class="quote">"Website Makers transformed our online presence. The site loads in under a second and our inquiries doubled within a month."</p>
        <div class="author"><strong>Rahul Sharma</strong><span>Founder, TechStart India</span></div>
      </div>
      <div class="testimonial-card">
        <div class="stars">★★★★★</div>
        <p class="quote">"Professional, fast, and incredibly easy to work with. They understood our vision and delivered beyond expectations."</p>
        <div class="author"><strong>Priya Patel</strong><span>CEO, Mode Fashion</span></div>
      </div>
      <div class="testimonial-card">
        <div class="stars">★★★★★</div>
        <p class="quote">"The e-commerce store they built handles 1000+ orders monthly without a hitch. Best investment we made."</p>
        <div class="author"><strong>Amit Kumar</strong><span>Director, Nova Retail</span></div>
      </div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section class="on-dark" id="contact">
  <div class="container">
    <span class="eyebrow">Get in touch</span>
    <h2 class="section-title">Let's build something great</h2>
    <div class="contact-grid">
      <div class="contact-info reveal">
        <p class="section-sub">Tell us about your project. We'll respond within 24 hours with a clear quote and timeline.</p>
        <div class="contact-details">
          <a href="tel:8957197142" class="contact-row">
            <span class="contact-icon">📞</span>
            <div><strong>Phone</strong><span>8957197142</span></div>
          </a>
          <a href="mailto:hello@sitesmaker.online" class="contact-row">
            <span class="contact-icon">✉️</span>
            <div><strong>Email</strong><span>hello@sitesmaker.online</span></div>
          </a>
          <div class="contact-row">
            <span class="contact-icon">📍</span>
            <div><strong>Location</strong><span>India (Remote-friendly)</span></div>
          </div>
        </div>
      </div>
      <form id="contactForm" class="contact-form reveal" novalidate>
        <label>
          <span>Name</span>
          <input type="text" name="name" required minlength="2" maxlength="120" placeholder="Your name" />
        </label>
        <label>
          <span>Email</span>
          <input type="email" name="email" required placeholder="you@company.com" />
        </label>
        <label>
          <span>Phone</span>
          <input type="tel" name="phone" required minlength="6" maxlength="30" placeholder="+91 98765 43210" />
        </label>
        <label>
          <span>Message</span>
          <textarea name="message" rows="4" maxlength="3000" placeholder="Tell us about your project..."></textarea>
        </label>
        <input type="hidden" name="source" value="website" />
        <button type="submit" class="btn btn-gold" data-magnetic>Send message</button>
        <div id="formStatus" class="form-status" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-brand">
      <a class="nav-logo" href="#home"><span class="mark">W</span>Website <span>Makers</span></a>
      <p>Web development studio for Indian businesses. Premium design, honest pricing.</p>
    </div>
    <div class="footer-links">
      <div>
        <h4>Company</h4>
        <a href="#about">About</a>
        <a href="#services">Services</a>
        <a href="#work">Work</a>
        <a href="#pricing">Pricing</a>
      </div>
      <div>
        <h4>Legal</h4>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
        <a href="/refund">Refund Policy</a>
        <a href="/cookies">Cookie Policy</a>
      </div>
      <div>
        <h4>Connect</h4>
        <a href="tel:8957197142">Call us</a>
        <a href="mailto:hello@sitesmaker.online">Email us</a>
        <a href="#contact">Start a project</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>© ${new Date().getFullYear()} Website Makers. All rights reserved.</p>
  </div>
</footer>
`;
