/**
 * Smoke Effect – CAR CFR Brașov
 * Canvas-based ambient smoke particle system
 * Pure JS, no dependencies
 */
(function () {
  'use strict';

  /* ---------- Canvas setup ---------- */
  const canvas = document.createElement('canvas');
  canvas.id = 'smokeCanvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '0',
  });
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- Mouse tracking ---------- */
  const mouse = { x: -999, y: -999, active: false };
  document.addEventListener('mousemove', (e) => {
    mouse.x      = e.clientX;
    mouse.y      = e.clientY;
    mouse.active = true;
  });

  /* ---------- Color palette ---------- */
  // Warm burgundy/gold tones matching the brand
  const PALETTE = [
    '139, 30,  63',   // burgundy
    '107, 24,  50',   // dark burgundy
    ' 80, 15,  40',   // deep burgundy
    '160, 43,  75',   // mid burgundy
    '212,175,  55',   // gold accent
    '180,140,  40',   // dark gold
    '220,195, 140',   // warm cream smoke
    '100, 40,  60',   // muted plum
  ];

  /* ---------- Smoke particle ---------- */
  class Smoke {
    /**
     * @param {boolean} fromMouse – smaller, faster trail puff
     */
    constructor(fromMouse = false) {
      this.fromMouse = fromMouse;
      this._birth();
    }

    _birth() {
      if (this.fromMouse) {
        this.x          = mouse.x + (Math.random() - 0.5) * 30;
        this.y          = mouse.y + (Math.random() - 0.5) * 30;
        this.r          = Math.random() * 25 + 8;
        this.maxR       = this.r   + Math.random() * 55 + 25;
        this.baseAlpha  = Math.random() * 0.10 + 0.04;
        this.maxLife    = Math.random() * 70  + 50;
      } else {
        // Spawn below the viewport, drift upward
        this.x          = Math.random() * W;
        this.y          = H + Math.random() * 60 + 20;
        this.r          = Math.random() * 90 + 40;
        this.maxR       = this.r   + Math.random() * 100 + 60;
        this.baseAlpha  = Math.random() * 0.055 + 0.012;
        this.maxLife    = Math.random() * 350 + 180;
      }

      this.vx          = (Math.random() - 0.5) * 0.7;
      this.vy          = -(Math.random() * 1.1 + 0.35);
      this.life        = 0;
      this.angle       = Math.random() * Math.PI * 2;
      this.angleSpeed  = (Math.random() - 0.5) * 0.008;
      this.scaleY      = Math.random() * 0.3 + 0.6; // slight ellipse
      this.curAlpha    = 0;
      this.color       = PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    update() {
      this.life++;

      // Drift with gentle turbulence
      this.vx     += Math.sin(this.life * 0.025 + this.angle) * 0.018;
      this.vy     -= 0.0008; // slight upward acceleration
      this.x      += this.vx;
      this.y      += this.vy;
      this.angle  += this.angleSpeed;

      // Grow radius
      if (this.r < this.maxR) this.r += 0.45;

      // Fade envelope
      const t = this.life / this.maxLife;
      if      (t < 0.15) this.curAlpha = this.baseAlpha * (t / 0.15);
      else if (t > 0.60) this.curAlpha = this.baseAlpha * (1 - (t - 0.60) / 0.40);
      else               this.curAlpha = this.baseAlpha;

      return this.life < this.maxLife && this.y > -this.maxR;
    }

    draw() {
      if (this.curAlpha <= 0.001) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(1, this.scaleY);

      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r);
      g.addColorStop(0,   `rgba(${this.color}, ${this.curAlpha})`);
      g.addColorStop(0.45,`rgba(${this.color}, ${this.curAlpha * 0.45})`);
      g.addColorStop(1,   `rgba(${this.color}, 0)`);

      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- Particle pools ---------- */
  const BG_COUNT = 55;
  const bgPool   = [];

  for (let i = 0; i < BG_COUNT; i++) {
    const p = new Smoke(false);
    // Spread initial positions across the whole viewport height
    p.y    = Math.random() * (H + 200) - 100;
    p.life = Math.random() * p.maxLife * 0.85;
    bgPool.push(p);
  }

  const mousePool = [];
  let   mouseTick = 0;

  /* ---------- Render loop ---------- */
  function frame() {
    ctx.clearRect(0, 0, W, H);

    // Background ambient smoke
    for (let i = 0; i < bgPool.length; i++) {
      if (!bgPool[i].update()) {
        bgPool[i] = new Smoke(false);
      }
      bgPool[i].draw();
    }

    // Mouse-trail smoke
    if (mouse.active) {
      mouseTick++;
      if (mouseTick % 4 === 0) {
        mousePool.push(new Smoke(true));
        // Limit pool
        if (mousePool.length > 80) mousePool.splice(0, 5);
      }
    }

    for (let i = mousePool.length - 1; i >= 0; i--) {
      if (!mousePool[i].update()) {
        mousePool.splice(i, 1);
      } else {
        mousePool[i].draw();
      }
    }

    requestAnimationFrame(frame);
  }

  frame();
})();
