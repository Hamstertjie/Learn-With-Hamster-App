import { Injectable } from '@angular/core';

// Glassmorphism palette colours — teal, violet, gold, light variants, slate
const GLASS_COLORS = ['#06b6d4', '#67e8f9', '#8b5cf6', '#c4b5fd', '#fbbf24', '#f1f5f9'];

@Injectable({ providedIn: 'root' })
export class ConfettiService {
  async fire(): Promise<void> {
    const { default: confetti } = await import('canvas-confetti');

    // Centre burst — main celebration
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.5 },
      colors: GLASS_COLORS,
      ticks: 300,
      scalar: 1.1,
      gravity: 0.9,
    });

    // Left cannon at 400ms — teal/gold
    setTimeout(
      () =>
        confetti({
          particleCount: 70,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.65 },
          colors: ['#06b6d4', '#67e8f9', '#fbbf24'],
          ticks: 250,
          scalar: 0.95,
        }),
      400,
    );

    // Right cannon at 400ms — violet/white
    setTimeout(
      () =>
        confetti({
          particleCount: 70,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.65 },
          colors: ['#8b5cf6', '#c4b5fd', '#f1f5f9'],
          ticks: 250,
          scalar: 0.95,
        }),
      400,
    );

    // Final gravity drop at 900ms for lingering effect
    setTimeout(
      () =>
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0 },
          colors: GLASS_COLORS,
          ticks: 200,
          gravity: 1.4,
        }),
      900,
    );
  }
}
