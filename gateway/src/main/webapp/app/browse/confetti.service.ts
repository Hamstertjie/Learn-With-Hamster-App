import { Injectable } from '@angular/core';

// LN colour palette — electric yellow dominant, white highlights
const FW_COLORS = ['#D2FF00', '#ffffff', '#aaf000', '#e8ff80', '#ccff00', '#f5ff66', '#ffffff', '#D2FF00'];

const BURST_INTERVAL_MS = 650;   // ms between auto rockets
const ACTIVE_MS         = 11_000; // how long rockets keep auto-firing
const CLEANUP_MS        = 14_000; // total lifetime before teardown

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  private confetti: ((opts: object) => void) | null = null;
  private styleEl:      HTMLStyleElement | null = null;
  private intervalId:   ReturnType<typeof setInterval> | null = null;
  private cleanupTimer: ReturnType<typeof setTimeout>  | null = null;

  // Live interaction state — updated by event listeners
  private mouseX         = 0.5; // 0 = left edge, 1 = right edge
  private mouseY         = 0.5; // 0 = top, 1 = bottom
  private scrollFraction = 0;   // 0 = top of page, 1 = bottom

  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private scrollHandler:    (() => void)               | null = null;

  async fire(): Promise<void> {
    this.cleanup();

    const { default: confetti } = await import('canvas-confetti');
    this.confetti = confetti as unknown as (opts: object) => void;

    // ── Inject shared keyframes ─────────────────────────────────────────────
    this.styleEl = document.createElement('style');
    this.styleEl.textContent = `
      /* Expanding ring at each explosion point */
      @keyframes fw-ring {
        0%   { box-shadow: 0 0 0   0px rgba(210,255,0,0.85); opacity: 1; }
        60%  { box-shadow: 0 0 0  70px rgba(210,255,0,0.15); opacity: 0.6; }
        100% { box-shadow: 0 0 0 120px rgba(210,255,0,0);    opacity: 0; }
      }
      /* Physical impact shake on the body */
      @keyframes fw-shake {
        0%,100% { transform: translate3d(0,0,0) rotate(0deg); }
        12%  { transform: translate3d(-6px,-3px,0) rotate(-0.4deg); }
        25%  { transform: translate3d(7px, 4px,0) rotate(0.5deg); }
        37%  { transform: translate3d(-5px, 2px,0) rotate(-0.3deg); }
        50%  { transform: translate3d(6px,-4px,0) rotate(0.4deg); }
        62%  { transform: translate3d(-4px, 3px,0) rotate(-0.2deg); }
        75%  { transform: translate3d(3px,-2px,0) rotate(0.15deg); }
        87%  { transform: translate3d(-2px, 1px,0) rotate(-0.1deg); }
      }
    `;
    document.head.appendChild(this.styleEl);

    // ── Immediate impact effects ────────────────────────────────────────────
    this.flashScreen();
    this.shakeBody();

    // ── Start tracking mouse + scroll ───────────────────────────────────────
    this.mouseMoveHandler = (e: MouseEvent): void => {
      this.mouseX = e.clientX / window.innerWidth;
      this.mouseY = e.clientY / window.innerHeight;
    };
    this.scrollHandler = (): void => {
      const max = document.body.scrollHeight - window.innerHeight;
      this.scrollFraction = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };
    window.addEventListener('mousemove', this.mouseMoveHandler);
    window.addEventListener('scroll',    this.scrollHandler, { passive: true });

    // ── Opening salvo — 3 rockets staggered over 550 ms ────────────────────
    this.launchRocket(0.2);
    setTimeout(() => this.launchRocket(0.5), 300);
    setTimeout(() => this.launchRocket(0.8), 550);

    // ── Continuous rockets ──────────────────────────────────────────────────
    let elapsed = 0;
    this.intervalId = setInterval(() => {
      elapsed += BURST_INTERVAL_MS;

      // Horizontal: random base biased toward mouse X (±0.4 influence)
      const base    = 0.15 + Math.random() * 0.7;
      const bias    = (this.mouseX - 0.5) * 0.4;
      const launchX = Math.max(0.05, Math.min(0.95, base + bias));
      this.launchRocket(launchX);

      // Scrolling down: add a bonus rocket with slight delay
      if (this.scrollFraction > 0.35 && Math.random() < 0.6) {
        const bx = 0.1 + Math.random() * 0.8;
        setTimeout(() => this.launchRocket(bx), 180);
      }

      if (elapsed >= ACTIVE_MS) {
        clearInterval(this.intervalId!);
        this.intervalId = null;
      }
    }, BURST_INTERVAL_MS);

    // ── Schedule teardown ───────────────────────────────────────────────────
    this.cleanupTimer = setTimeout(() => this.cleanup(), CLEANUP_MS);
  }

  /**
   * Fire one firework burst at the given horizontal viewport fraction.
   *
   * Mouse Y drives explosion height:
   *   mouseY = 0 (cursor at top)    → burst near top of screen (low canvas y)
   *   mouseY = 1 (cursor at bottom) → burst in lower half
   *
   * Scroll fraction boosts particle count, velocity, and ticks.
   */
  private launchRocket(originX: number): void {
    const scrollBoost   = this.scrollFraction;
    const explosionY    = 0.1 + this.mouseY * 0.5;         // canvas y: 0=top, 1=bottom
    const particleCount = 80 + Math.round(scrollBoost * 70) + Math.round(Math.random() * 55);
    const velocity      = 22 + scrollBoost * 14 + Math.random() * 14;
    const ticks         = 280 + Math.round(scrollBoost * 100);

    // Visual ring flash at explosion point
    this.ringFlashAt(originX, explosionY);

    (this.confetti as any)?.({
      particleCount,
      spread:        360,
      startVelocity: velocity,
      decay:         0.91,
      gravity:       0.7,
      scalar:        0.85 + Math.random() * 0.5,
      origin:        { x: originX, y: explosionY },
      colors:        FW_COLORS,
      shapes:        ['circle', 'star'],
      ticks,
    });
  }

  /**
   * Tiny DOM dot that expands as a glowing ring — marks each explosion point.
   * viewX / viewY are fractions of the viewport (0–1, matching canvas-confetti axes).
   */
  private ringFlashAt(viewX: number, viewY: number): void {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:      'fixed',
      left:          `${viewX * 100}vw`,
      top:           `${viewY * 100}vh`,
      width:         '6px',
      height:        '6px',
      borderRadius:  '50%',
      background:    'rgba(210,255,0,0.9)',
      pointerEvents: 'none',
      zIndex:        '10001',
      transform:     'translate(-50%,-50%)',
      animation:     'fw-ring 420ms ease-out forwards',
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 470);
  }

  /** Full-viewport yellow bloom that fades in 700 ms */
  private flashScreen(): void {
    const el = document.createElement('div');
    Object.assign(el.style, {
      position:      'fixed',
      inset:         '0',
      pointerEvents: 'none',
      zIndex:        '10000',
      background:    'radial-gradient(ellipse at 50% 40%, rgba(210,255,0,0.28) 0%, rgba(210,255,0,0.08) 45%, transparent 68%)',
      opacity:       '1',
      transition:    'opacity 700ms ease-out',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 750);
    }));
  }

  /** 450 ms CSS body shake for physical impact feel */
  private shakeBody(): void {
    document.body.style.animation = 'fw-shake 450ms ease-out';
    setTimeout(() => { document.body.style.animation = ''; }, 480);
  }

  private cleanup(): void {
    if (this.intervalId)   { clearInterval(this.intervalId);  this.intervalId   = null; }
    if (this.cleanupTimer) { clearTimeout(this.cleanupTimer); this.cleanupTimer = null; }
    if (this.mouseMoveHandler) {
      window.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    this.styleEl?.remove();
    this.styleEl  = null;
    this.confetti = null;
    // Reset interaction state for next fire()
    this.mouseX = 0.5;
    this.mouseY = 0.5;
    this.scrollFraction = 0;
  }
}
