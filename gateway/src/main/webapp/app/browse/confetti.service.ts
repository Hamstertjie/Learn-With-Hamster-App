import { Injectable } from '@angular/core';

// Glassmorphism colour schemes — bg, border, glow
const SCHEMES = [
  { bg: 'rgba(6,182,212,0.20)',   border: 'rgba(103,232,249,0.75)', glow: 'rgba(6,182,212,0.55)'   },
  { bg: 'rgba(139,92,246,0.20)',  border: 'rgba(196,181,253,0.75)', glow: 'rgba(139,92,246,0.55)'  },
  { bg: 'rgba(251,191,36,0.22)',  border: 'rgba(251,191,36,0.80)',  glow: 'rgba(251,191,36,0.60)'  },
  { bg: 'rgba(255,255,255,0.16)', border: 'rgba(255,255,255,0.70)', glow: 'rgba(255,255,255,0.35)' },
  { bg: 'rgba(240,171,252,0.20)', border: 'rgba(240,171,252,0.75)', glow: 'rgba(240,171,252,0.55)' },
  { bg: 'rgba(52,211,153,0.20)',  border: 'rgba(52,211,153,0.75)',  glow: 'rgba(52,211,153,0.55)'  },
  { bg: 'rgba(251,146,60,0.20)',  border: 'rgba(251,146,60,0.75)',  glow: 'rgba(251,146,60,0.55)'  },
  { bg: 'rgba(245,158,11,0.20)',  border: 'rgba(245,208,11,0.75)',  glow: 'rgba(245,158,11,0.55)'  },
];

const BURST_COLORS = ['#06b6d4', '#67e8f9', '#8b5cf6', '#c4b5fd', '#fbbf24', '#ffffff', '#f0abfc', '#34d399', '#fb923c'];

// Total experience: 13 s spawn window + up to 8.5 s fall = ~21.5 s visible, cleanup fade at 22 s
const SPAWN_WINDOW_MS = 13_000;
const CLEANUP_MS      = 22_000;
const SPAWN_INTERVAL  = 180;

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private container: HTMLDivElement | null = null;
  private styleEl: HTMLStyleElement | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  async fire(): Promise<void> {
    this.cleanup();

    // ── Screen flash — radial gold/teal bloom fading in 600 ms ──────────────
    this.flashScreen();

    // ── Body shake — 0.45 s physical impact ─────────────────────────────────
    this.shakeBody();

    // ── canvas-confetti burst waves ──────────────────────────────────────────
    const { default: confetti } = await import('canvas-confetti');
    const burst = (opts: Parameters<typeof confetti>[0]) =>
      confetti({ shapes: ['star', 'circle', 'square'], colors: BURST_COLORS, ...opts });

    // Wave 1 — massive opening starburst
    burst({ particleCount: 320, spread: 160, origin: { y: 0.42 }, ticks: 500, scalar: 1.5, startVelocity: 75, gravity: 0.8 });

    // Wave 2 — follow-up center (250 ms)
    setTimeout(() => burst({ particleCount: 220, spread: 130, origin: { y: 0.48 }, ticks: 450, scalar: 1.3, startVelocity: 60 }), 250);

    // Wave 3 — left + right cannons (500 ms)
    setTimeout(() => {
      burst({ particleCount: 150, angle: 60,  spread: 75, origin: { x: 0, y: 0.58 }, ticks: 400, scalar: 1.35, startVelocity: 70 });
      burst({ particleCount: 150, angle: 120, spread: 75, origin: { x: 1, y: 0.58 }, ticks: 400, scalar: 1.35, startVelocity: 70 });
    }, 500);

    // Wave 4 — angled side volleys (900 ms)
    setTimeout(() => {
      burst({ particleCount: 110, angle: 65,  spread: 60, origin: { x: 0, y: 0.63 }, ticks: 370, startVelocity: 58 });
      burst({ particleCount: 110, angle: 115, spread: 60, origin: { x: 1, y: 0.63 }, ticks: 370, startVelocity: 58 });
    }, 900);

    // Wave 5 — 4-corner simultaneous volley (1 400 ms)
    setTimeout(() => {
      burst({ particleCount: 90, angle: 45,  spread: 50, origin: { x: 0, y: 0 }, ticks: 340, scalar: 1.1, startVelocity: 65, gravity: 1.1 });
      burst({ particleCount: 90, angle: 135, spread: 50, origin: { x: 1, y: 0 }, ticks: 340, scalar: 1.1, startVelocity: 65, gravity: 1.1 });
      burst({ particleCount: 90, angle: 315, spread: 50, origin: { x: 0, y: 1 }, ticks: 340, scalar: 1.1, startVelocity: 65, gravity: 0.5 });
      burst({ particleCount: 90, angle: 225, spread: 50, origin: { x: 1, y: 1 }, ticks: 340, scalar: 1.1, startVelocity: 65, gravity: 0.5 });
    }, 1_400);

    // Wave 6 — secondary center burst to keep the sky full (2 200 ms)
    setTimeout(() => burst({ particleCount: 180, spread: 120, origin: { y: 0.45 }, ticks: 400, scalar: 1.2, startVelocity: 55, gravity: 0.9 }), 2_200);

    // Wave 7 — final golden rain from the top (4 000 ms)
    setTimeout(() => {
      burst({ particleCount: 200, spread: 200, origin: { y: 0 }, ticks: 380, scalar: 1.0, startVelocity: 30, gravity: 1.3, colors: ['#fbbf24', '#f59e0b', '#ffffff', '#06b6d4'] });
    }, 4_000);

    // ── Inject CSS for bounce-settle keyframe + body shake ───────────────────
    this.styleEl = document.createElement('style');
    this.styleEl.textContent = `
      @keyframes lwh-bounce {
        0%   { transform: translate3d(var(--fx), calc(var(--fy) - 18px), 0) var(--fr); }
        55%  { transform: translate3d(var(--fx), calc(var(--fy) + 6px),  0) var(--fr); }
        100% { transform: translate3d(var(--fx), var(--fy),              0) var(--fr); }
      }
      @keyframes lwh-shake {
        0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
        10%  { transform: translate3d(-6px, -3px, 0) rotate(-0.4deg); }
        20%  { transform: translate3d(7px,  4px,  0) rotate(0.5deg); }
        30%  { transform: translate3d(-5px, 2px,  0) rotate(-0.3deg); }
        40%  { transform: translate3d(6px, -4px,  0) rotate(0.4deg); }
        50%  { transform: translate3d(-4px, 3px,  0) rotate(-0.2deg); }
        60%  { transform: translate3d(4px, -2px,  0) rotate(0.3deg); }
        70%  { transform: translate3d(-3px, 2px,  0) rotate(-0.15deg); }
        80%  { transform: translate3d(2px, -1px,  0) rotate(0.1deg); }
        100% { transform: translate3d(0, 0, 0) rotate(0deg); }
      }
    `;
    document.head.appendChild(this.styleEl);

    // ── Full-screen overlay ─────────────────────────────────────────────────
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '9999',
      overflow: 'hidden',
    });
    document.body.appendChild(this.container);

    // ── Spawn pieces continuously ───────────────────────────────────────────
    let elapsed = 0;
    this.intervalId = setInterval(() => {
      elapsed += SPAWN_INTERVAL;
      // Heavy at the start, tapering off
      const n = elapsed < 1500 ? 16 : elapsed < 4000 ? 11 : elapsed < 8000 ? 8 : elapsed < 11000 ? 5 : 2;
      for (let i = 0; i < n; i++) this.spawnPiece();
      if (elapsed >= SPAWN_WINDOW_MS) {
        clearInterval(this.intervalId!);
        this.intervalId = null;
      }
    }, SPAWN_INTERVAL);

    // ── Fade then cleanup ───────────────────────────────────────────────────
    this.cleanupTimer = setTimeout(() => {
      if (this.container) {
        this.container.style.transition = 'opacity 2s ease';
        this.container.style.opacity = '0';
      }
      setTimeout(() => this.cleanup(), 2000);
    }, CLEANUP_MS);
  }

  /** Full-screen radial flash that fades out in 600 ms */
  private flashScreen(): void {
    const flash = document.createElement('div');
    Object.assign(flash.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '10000',
      background: 'radial-gradient(ellipse at 50% 45%, rgba(251,191,36,0.28) 0%, rgba(6,182,212,0.18) 40%, transparent 70%)',
      opacity: '1',
      transition: 'opacity 600ms ease-out',
    });
    document.body.appendChild(flash);
    // Trigger reflow then fade
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flash.style.opacity = '0';
        setTimeout(() => flash.remove(), 650);
      });
    });
  }

  /** Apply a CSS body shake for 450 ms then remove */
  private shakeBody(): void {
    // Inject the shake keyframe inline (styleEl may not be ready yet)
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
      @keyframes lwh-shake-body {
        0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
        10%  { transform: translate3d(-6px, -3px, 0) rotate(-0.4deg); }
        20%  { transform: translate3d(7px,  4px,  0) rotate(0.5deg); }
        30%  { transform: translate3d(-5px, 2px,  0) rotate(-0.3deg); }
        40%  { transform: translate3d(6px, -4px,  0) rotate(0.4deg); }
        50%  { transform: translate3d(-4px, 3px,  0) rotate(-0.2deg); }
        60%  { transform: translate3d(4px, -2px,  0) rotate(0.3deg); }
        70%  { transform: translate3d(-3px, 2px,  0) rotate(-0.15deg); }
        80%  { transform: translate3d(2px, -1px,  0) rotate(0.1deg); }
        100% { transform: translate3d(0, 0, 0) rotate(0deg); }
      }
    `;
    document.head.appendChild(shakeStyle);
    document.body.style.animation = 'lwh-shake-body 450ms ease-out';
    setTimeout(() => {
      document.body.style.animation = '';
      shakeStyle.remove();
    }, 480);
  }

  private spawnPiece(): void {
    if (!this.container) return;

    const scheme   = SCHEMES[Math.floor(Math.random() * SCHEMES.length)];
    const baseSize = 9 + Math.random() * 22;          // 9–31 px
    const roll     = Math.random();
    const isCircle = roll < 0.18;
    const isStrip  = !isCircle && roll < 0.38;
    const w = isStrip ? baseSize * 0.28 : baseSize;
    const h = isStrip ? baseSize * 2.4  : isCircle ? baseSize : baseSize * (0.65 + Math.random() * 0.9);

    // Start position — spread across full width plus slight overshoot on both sides
    const startVw = -8 + Math.random() * 116;
    // Also occasionally launch from sides (like cannon balls)
    const fromSide = Math.random() < 0.12;
    const startX   = fromSide ? (Math.random() < 0.5 ? '-40px' : `calc(100vw + 40px)`) : `${startVw}vw`;

    // Horizontal drift ±220 px
    const dxPx = (Math.random() - 0.5) * 440;
    // Land in bottom 20% of screen, stagger depth so they pile naturally
    const dyPx = window.innerHeight * (0.76 + Math.random() * 0.18) - h;

    // 3D tumble amounts (degrees)
    const rxDeg = 180 + Math.random() * 540;
    const ryDeg = 180 + Math.random() * 540;
    const rzDeg = 90  + Math.random() * 360;

    // Fall duration 3–8.5 s, staggered delay up to 1.5 s
    const duration = 3 + Math.random() * 5.5;
    const delay    = Math.random() * 1.5;

    const el = document.createElement('div');

    // Geometry & base style
    el.style.cssText = `
      position: absolute;
      left: ${startX};
      top: 0;
      width: ${w}px;
      height: ${h}px;
      border-radius: ${isCircle ? '50%' : '3px'};
      background: ${scheme.bg};
      border: 1px solid ${scheme.border};
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.45),
                  inset 0 -1px 0 rgba(0,0,0,0.08),
                  0 5px 16px ${scheme.glow};
      will-change: transform, opacity;
      transform-style: preserve-3d;
    `;

    // backdrop-filter only for larger pieces (performance budget)
    if (baseSize > 18) {
      el.style.setProperty('backdrop-filter', 'blur(5px) saturate(200%)');
      el.style.setProperty('-webkit-backdrop-filter', 'blur(5px) saturate(200%)');
    }

    // ── Fall animation via Web Animations API ──────────────────────────────
    const startTransform = `translate3d(0, -60px, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`;
    const endTransform   = `translate3d(${dxPx}px, ${dyPx}px, 0) rotateX(${rxDeg}deg) rotateY(${ryDeg}deg) rotateZ(${rzDeg}deg)`;

    this.container.appendChild(el);

    const fallAnim = el.animate(
      [
        { transform: startTransform, opacity: '1'   },
        { transform: endTransform,   opacity: '0.88' },
      ],
      {
        duration: duration * 1000,
        delay:    delay    * 1000,
        fill:     'forwards',
        // Ease-in for gravity feel, slight ease-out at landing
        easing:   'cubic-bezier(0.42, 0, 0.68, 1.0)',
      },
    );

    // ── After landing: CSS bounce-settle then freeze ───────────────────────
    fallAnim.addEventListener('finish', () => {
      if (!el.parentElement) return;

      // Use the keyframe directly
      const settle = el.animate(
        [
          { transform: `translate3d(${dxPx}px, ${dyPx - 18}px, 0) rotateX(${rxDeg}deg) rotateY(${ryDeg}deg) rotateZ(${rzDeg}deg)` },
          { transform: `translate3d(${dxPx}px, ${dyPx + 6}px,  0) rotateX(${rxDeg}deg) rotateY(${ryDeg}deg) rotateZ(${rzDeg + 4}deg)` },
          { transform: `translate3d(${dxPx}px, ${dyPx}px,      0) rotateX(${rxDeg}deg) rotateY(${ryDeg}deg) rotateZ(${rzDeg + 1}deg)` },
        ],
        { duration: 380, fill: 'forwards', easing: 'ease-out' },
      );

      // After settle, freeze in place permanently
      settle.addEventListener('finish', () => {
        if (!el.parentElement) return;
        el.style.transform = `translate3d(${dxPx}px, ${dyPx}px, 0) rotateX(${rxDeg}deg) rotateY(${ryDeg}deg) rotateZ(${rzDeg + 1}deg)`;
        el.style.opacity = '0.88';
        el.getAnimations().forEach(a => a.cancel());
      });
    });
  }

  private cleanup(): void {
    if (this.intervalId)    { clearInterval(this.intervalId);    this.intervalId    = null; }
    if (this.cleanupTimer)  { clearTimeout(this.cleanupTimer);   this.cleanupTimer  = null; }
    this.container?.remove(); this.container = null;
    this.styleEl?.remove();   this.styleEl   = null;
  }
}
