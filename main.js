/**
 * CAR CFR Brasov — Main JS
 * Handles: nav scroll, mobile menu, scroll reveal, counters, particle canvas, loan calculator
 */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initHeroCanvas();
  initCalculator();
  initTableHovers();
});

/* ==============================
   Navigation — scroll aware
   ============================== */
function initNav() {
  const header = document.querySelector('.header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ==============================
   Mobile Menu
   ============================== */
function initMobileMenu() {
  const toggle   = document.getElementById('mobileToggle');
  const menu     = document.getElementById('navMenu');
  const overlay  = document.querySelector('.nav-overlay');
  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.add('active');
    if (overlay) overlay.classList.add('active');
    toggle.innerHTML = '<i class="fas fa-times"></i>';
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    menu.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    menu.classList.contains('active') ? close() : open();
  });

  if (overlay) overlay.addEventListener('click', close);

  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', close);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('active')) close();
  });
}

/* ==============================
   Scroll Reveal (IntersectionObserver)
   ============================== */
function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => io.observe(el));
}

/* ==============================
   Animated Number Counters
   ============================== */
function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => io.observe(el));
}

function animateCounter(el) {
  const target   = parseInt(el.dataset.counter, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = 1800;
  const start    = performance.now();

  const tick = (now) => {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Cubic ease-out
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target).toLocaleString('ro-RO') + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ==============================
   Hero Smoke Canvas (mouse-interactive)
   ============================== */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let smokeList = [];
  let sparkList = [];
  let raf;

  // ---- Mouse / touch tracking ----
  const mouse = { x: -9999, y: -9999, vx: 0, vy: 0 };

  const heroSection = document.querySelector('.hero');
  const trackTarget = heroSection || canvas;

  const onMove = (cx, cy) => {
    const rect = canvas.getBoundingClientRect();
    const nx = cx - rect.left;
    const ny = cy - rect.top;
    mouse.vx = (nx - mouse.x) * 0.6;
    mouse.vy = (ny - mouse.y) * 0.6;
    mouse.x  = nx;
    mouse.y  = ny;
  };

  trackTarget.addEventListener('mousemove', e => onMove(e.clientX, e.clientY), { passive: true });
  trackTarget.addEventListener('touchmove', e => {
    if (e.touches.length) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  trackTarget.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999; mouse.vx = 0; mouse.vy = 0;
  }, { passive: true });

  // ---- Smoke blob ----
  class Smoke {
    constructor(spread) { this.init(spread); }

    init(spread) {
      this.x      = Math.random() * canvas.width;
      this.y      = spread ? Math.random() * canvas.height : canvas.height + 40;
      this.vx     = (Math.random() - 0.5) * 0.45;
      this.vy     = -(Math.random() * 0.38 + 0.12);
      this.r      = Math.random() * 18 + 10;
      this.maxR   = Math.random() * 75 + 45;
      this.life   = spread ? Math.floor(Math.random() * 200) : 0;
      this.maxLife = Math.floor(Math.random() * 180 + 130);
      this.wobble  = Math.random() * Math.PI * 2;
      this.wSpeed  = (Math.random() - 0.5) * 0.022;
      // Warm gold–brown hue (HSL) — lightness boosted so blobs are visible on dark bg
      this.h = Math.random() * 30 + 28;   // 28–58 °
      this.s = Math.random() * 30 + 35;   // 35–65 %
      this.l = Math.random() * 18 + 50;   // 50–68 % (much brighter)
    }

    update() {
      this.life++;
      this.wobble += this.wSpeed;

      const t    = this.life / this.maxLife;
      this.r     = 10 + (this.maxR - 10) * Math.min(t * 1.8, 1);

      this.vx   += Math.sin(this.wobble) * 0.01;
      this.vx   *= 0.988;

      // Mouse repulsion field — gentler so smoke distorts but stays visible
      const dx   = this.x - mouse.x;
      const dy   = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 160 && dist > 0.5) {
        const f = (1 - dist / 160);
        this.vx += (dx / dist) * f * 0.22;
        this.vy += (dy / dist) * f * 0.22;
        // Drag: carry smoke in the direction of mouse movement
        this.vx += mouse.vx * f * 0.05;
        this.vy += mouse.vy * f * 0.05;
      }

      this.x += this.vx;
      this.y += this.vy;

      if (this.life >= this.maxLife || this.y < -(this.maxR + 10)) this.init(false);
    }

    draw() {
      const t  = this.life / this.maxLife;
      let a;
      if      (t < 0.12) a = (t / 0.12) * 0.42;
      else if (t > 0.60) a = ((1 - t) / 0.40) * 0.42;
      else               a = 0.42;

      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0,    `hsla(${this.h},${this.s}%,${this.l}%,${a})`);
      g.addColorStop(0.45, `hsla(${this.h},${this.s}%,${this.l}%,${(a * 0.38).toFixed(4)})`);
      g.addColorStop(1,    `hsla(${this.h},${this.s}%,${this.l}%,0)`);

      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }

  // ---- Gold sparkle ----
  class Sparkle {
    constructor(spread) { this.reset(spread); }

    reset(spread) {
      this.x       = Math.random() * canvas.width;
      this.y       = spread ? Math.random() * canvas.height : canvas.height + 5;
      this.size    = Math.random() * 1.3 + 0.3;
      this.vx      = (Math.random() - 0.5) * 0.22;
      this.vy      = -(Math.random() * 0.45 + 0.1);
      this.maxLife = Math.floor(Math.random() * 140 + 80);
      this.life    = spread ? Math.floor(Math.random() * this.maxLife) : 0;
      this.baseA   = Math.random() * 0.45 + 0.15;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;

      // Subtle attraction toward mouse (opposite of smoke)
      const dx   = mouse.x - this.x;
      const dy   = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && dist > 0.5) {
        const f = (1 - dist / 100) * 0.008;
        this.vx += dx / dist * f;
        this.vy += dy / dist * f;
      }

      if (this.life >= this.maxLife || this.y < -5) this.reset(false);
    }

    draw() {
      const t = this.life / this.maxLife;
      const a = this.baseA * Math.sin(t * Math.PI);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(212,175,55,${a.toFixed(3)})`;
      ctx.fill();
    }
  }

  // ---- Lifecycle ----
  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  // ---- Cursor trail smoke (spawned on fast mouse movement) ----
  const cursorSmoke = [];
  const MAX_CURSOR_SMOKE = 12;

  class CursorSmoke {
    constructor(x, y, mvx, mvy) {
      this.x = x + (Math.random() - 0.5) * 30;
      this.y = y + (Math.random() - 0.5) * 30;
      this.vx = (Math.random() - 0.5) * 0.6 - mvx * 0.04;
      this.vy = (Math.random() - 0.5) * 0.6 - mvy * 0.04 - 0.3;
      this.r = Math.random() * 12 + 8;
      this.maxR = Math.random() * 45 + 30;
      this.life = 0;
      this.maxLife = Math.floor(Math.random() * 80 + 60);
      this.h = Math.random() * 20 + 35;   // gold-amber
      this.s = 60;
      this.l = 65;
    }
    update() {
      this.life++;
      this.r = 8 + (this.maxR - 8) * Math.min(this.life / this.maxLife * 2, 1);
      this.vx *= 0.97;
      this.vy *= 0.97;
      this.x += this.vx;
      this.y += this.vy;
    }
    draw() {
      const t = this.life / this.maxLife;
      const a = 0.55 * Math.sin(t * Math.PI);
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r);
      g.addColorStop(0,   `hsla(${this.h},${this.s}%,${this.l}%,${a})`);
      g.addColorStop(0.5, `hsla(${this.h},${this.s}%,${this.l}%,${(a * 0.3).toFixed(4)})`);
      g.addColorStop(1,   `hsla(${this.h},${this.s}%,${this.l}%,0)`);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
    get dead() { return this.life >= this.maxLife; }
  }

  function spawnCursorSmoke() {
    const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
    if (speed < 2 || mouse.x < 0) return;
    const count = Math.min(Math.floor(speed / 4), 3);
    for (let i = 0; i < count; i++) {
      if (cursorSmoke.length < MAX_CURSOR_SMOKE) {
        cursorSmoke.push(new CursorSmoke(mouse.x, mouse.y, mouse.vx, mouse.vy));
      }
    }
  }

  function init(spread) {
    resize();
    smokeList = Array.from({ length: 30 }, () => new Smoke(spread));
    sparkList = Array.from({ length: 55 }, () => new Sparkle(spread));
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Soft-blur pass for ambient smoke + cursor trail
    ctx.save();
    ctx.filter = 'blur(7px)';
    smokeList.forEach(p => { p.update(); p.draw(); });

    spawnCursorSmoke();
    for (let i = cursorSmoke.length - 1; i >= 0; i--) {
      cursorSmoke[i].update();
      cursorSmoke[i].draw();
      if (cursorSmoke[i].dead) cursorSmoke.splice(i, 1);
    }
    ctx.restore();

    // Decay mouse velocity
    mouse.vx *= 0.82;
    mouse.vy *= 0.82;

    // Sharp gold sparkles on top
    sparkList.forEach(s => { s.update(); s.draw(); });

    raf = requestAnimationFrame(animate);
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(raf);
      init(true);
      animate();
    }, 200);
  });

  init(true);
  animate();
}

/* ==============================
   Loan Calculator (real-time)
   ============================== */
function initCalculator() {
  const amountInput  = document.getElementById('loanAmount');
  const amountSlider = document.getElementById('amountSlider');
  const resultBox    = document.getElementById('resultBox');
  if (!amountInput || !resultBox) return;

  let selectedMonths = 24;

  /* ---- slider <-> input sync ---- */
  if (amountSlider) {
    syncSliderFill(amountSlider);

    amountSlider.addEventListener('input', () => {
      amountInput.value = amountSlider.value;
      syncSliderFill(amountSlider);
      updateDisplay();
    });

    amountInput.addEventListener('input', () => {
      const v = clamp(parseInt(amountInput.value) || 0, 1000, 50000);
      amountSlider.value = v;
      syncSliderFill(amountSlider);
      updateDisplay();
    });
  } else {
    amountInput.addEventListener('input', updateDisplay);
  }

  /* ---- duration buttons ---- */
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedMonths = parseInt(this.dataset.months, 10);
      updateDisplay();
    });
  });

  /* ---- calculate & display ---- */
  function updateDisplay() {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount < 1000) {
      resultBox.classList.remove('visible');
      return;
    }

    const annualRate   = 0.07;
    const monthlyRate  = annualRate / 12;
    const n            = selectedMonths;
    const payment      = (amount * monthlyRate * Math.pow(1 + monthlyRate, n))
                       / (Math.pow(1 + monthlyRate, n) - 1);
    const totalPayment = payment * n;
    const totalInterest = totalPayment - amount;

    const fmt = v => v.toLocaleString('ro-RO', { maximumFractionDigits: 0 });

    document.getElementById('monthlyRate').textContent     = fmt(payment) + ' lei/lună';
    document.getElementById('totalAmount').textContent     = fmt(amount) + ' lei';
    document.getElementById('totalInterest').textContent   = fmt(totalInterest) + ' lei';
    document.getElementById('totalPayment').textContent    = fmt(totalPayment) + ' lei';

    resultBox.classList.add('visible');
  }

  // Trigger initial calc if there's a default value
  if (amountSlider && amountSlider.value) updateDisplay();
}

function syncSliderFill(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background =
    `linear-gradient(to right, #D4AF37 0%, #D4AF37 ${pct}%, rgba(255,255,255,0.1) ${pct}%, rgba(255,255,255,0.1) 100%)`;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

/* ==============================
   Comparison Table — hover highlights
   ============================== */
function initTableHovers() {
  const rows = document.querySelectorAll('.comparison-table tbody tr');
  rows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.background = 'rgba(212,175,55,0.04)';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = '';
    });
  });
}
