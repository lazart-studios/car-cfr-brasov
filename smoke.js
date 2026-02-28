/**
 * Smoke Effect – CAR CFR Brașov
 * Canvas-based smoke contained within the hero section only
 * Pure JS, no dependencies
 */
(function () {
  'use strict';

  function init() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    /* ---------- Canvas setup ---------- */
    const canvas = document.createElement('canvas');
    canvas.id = 'smokeCanvas';
    Object.assign(canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '1',
    });
    hero.insertBefore(canvas, hero.firstChild);

    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width  = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---------- Mouse tracking (relative to hero bounds) ---------- */
    const mouse = { x: -999, y: -999, active: false };
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x      = e.clientX - rect.left;
      mouse.y      = e.clientY - rect.top;
      mouse.active = true;
    });
    hero.addEventListener('mouseleave', () => {
      mouse.active = false;
    });

    /* ---------- Color palette ---------- */
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
      constructor(fromMouse = false) {
        this.fromMouse = fromMouse;
        this._birth();
      }

      _birth() {
        if (this.fromMouse) {
          this.x          = mouse.x + (Math.random() - 0.5) * 40;
          this.y          = mouse.y + (Math.random() - 0.5) * 40;
          this.r          = Math.random() * 35 + 12;
          this.maxR       = this.r   + Math.random() * 80 + 40;
          this.baseAlpha  = Math.random() * 0.20 + 0.10;
          this.maxLife    = Math.random() * 80  + 60;
        } else {
          // Spawn below the hero, drift upward
          this.x          = Math.random() * W;
          this.y          = H + Math.random() * 60 + 20;
          this.r          = Math.random() * 120 + 55;
          this.maxR       = this.r   + Math.random() * 140 + 80;
          this.baseAlpha  = Math.random() * 0.14 + 0.04;
          this.maxLife    = Math.random() * 350 + 180;
        }

        this.vx          = (Math.random() - 0.5) * 0.7;
        this.vy          = -(Math.random() * 1.1 + 0.35);
        this.life        = 0;
        this.angle       = Math.random() * Math.PI * 2;
        this.angleSpeed  = (Math.random() - 0.5) * 0.008;
        this.scaleY      = Math.random() * 0.3 + 0.6;
        this.curAlpha    = 0;
        this.color       = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      }

      update() {
        this.life++;
        this.vx     += Math.sin(this.life * 0.025 + this.angle) * 0.018;
        this.vy     -= 0.0008;
        this.x      += this.vx;
        this.y      += this.vy;
        this.angle  += this.angleSpeed;

        if (this.r < this.maxR) this.r += 0.45;

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
        g.addColorStop(0,    `rgba(${this.color}, ${this.curAlpha})`);
        g.addColorStop(0.45, `rgba(${this.color}, ${this.curAlpha * 0.45})`);
        g.addColorStop(1,    `rgba(${this.color}, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    /* ---------- Particle pools ---------- */
    const BG_COUNT = 65;
    const bgPool   = [];

    for (let i = 0; i < BG_COUNT; i++) {
      const p = new Smoke(false);
      p.y    = Math.random() * (H + 200) - 100;
      p.life = Math.random() * p.maxLife * 0.85;
      bgPool.push(p);
    }

    const mousePool = [];
    let   mouseTick = 0;

    /* ---------- Render loop ---------- */
    function frame() {
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < bgPool.length; i++) {
        if (!bgPool[i].update()) {
          bgPool[i] = new Smoke(false);
        }
        bgPool[i].draw();
      }

      if (mouse.active) {
        mouseTick++;
        if (mouseTick % 4 === 0) {
          mousePool.push(new Smoke(true));
          if (mousePool.length > 60) mousePool.splice(0, 5);
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
