import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({ providedIn: 'root' })
export class CelebrationService {
  triggerConfetti() {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.4 },
      colors: ['#4a9d9a', '#2d5f8a', '#06B6D4'],
      startVelocity: 20,
      decay: 0.94,
      gravity: 1.2,
      ticks: 150
    });
    setTimeout(() => {
      confetti({
        particleCount: 15,
        spread: 45,
        origin: { y: 0.4 },
        colors: ['#4a9d9a', '#2d5f8a'],
        startVelocity: 15,
        decay: 0.92
      });
    }, 250);
  }
}
