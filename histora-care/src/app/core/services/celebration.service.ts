import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({ providedIn: 'root' })
export class CelebrationService {
  private confettiInterval: ReturnType<typeof setInterval> | null = null;

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

  startContinuousConfetti() {
    this.stopContinuousConfetti();

    // Burst inicial grande
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.3 },
      colors: ['#4a9d9a', '#2d5f8a', '#06B6D4', '#FFD700', '#FF6B6B'],
      startVelocity: 30,
      gravity: 0.8,
      ticks: 200
    });

    // Confeti continuo cada 2.5 segundos
    this.confettiInterval = setInterval(() => {
      // Lado izquierdo
      confetti({
        particleCount: 20,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.5 },
        colors: ['#4a9d9a', '#FFD700', '#06B6D4'],
        startVelocity: 25,
        gravity: 1,
        ticks: 180
      });
      // Lado derecho
      confetti({
        particleCount: 20,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.5 },
        colors: ['#2d5f8a', '#FF6B6B', '#06B6D4'],
        startVelocity: 25,
        gravity: 1,
        ticks: 180
      });
    }, 2500);
  }

  stopContinuousConfetti() {
    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
      this.confettiInterval = null;
    }
  }
}
