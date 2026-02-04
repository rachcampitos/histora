import { Component, OnInit, OnDestroy, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { CheckInService, CheckInStatus } from '../../../core/services/check-in.service';

@Component({
  selector: 'app-check-in-reminder',
  templateUrl: './check-in-reminder.component.html',
  styleUrls: ['./check-in-reminder.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckInReminderComponent implements OnInit, OnDestroy {
  private checkInService = inject(CheckInService);
  private toastCtrl = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  // State
  showReminder = signal(false);
  isLoading = signal(false);
  checkInStatus = signal<CheckInStatus | null>(null);
  countdown = signal('05:00');

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private readonly COUNTDOWN_SECONDS = 300; // 5 minutes
  private remainingSeconds = this.COUNTDOWN_SECONDS;

  ngOnInit() {
    // Subscribe to reminder visibility
    this.checkInService.showReminder$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(show => {
        this.showReminder.set(show);
        if (show) {
          this.startCountdown();
        } else {
          this.stopCountdown();
        }
      });

    // Subscribe to check-in status
    this.checkInService.checkInStatus$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(status => {
        this.checkInStatus.set(status);
      });
  }

  ngOnDestroy() {
    this.stopCountdown();
  }

  private startCountdown() {
    this.remainingSeconds = this.COUNTDOWN_SECONDS;
    this.updateCountdownDisplay();

    this.countdownInterval = setInterval(() => {
      this.remainingSeconds--;
      this.updateCountdownDisplay();

      if (this.remainingSeconds <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private updateCountdownDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    this.countdown.set(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
  }

  confirmOk() {
    this.isLoading.set(true);
    Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});

    this.checkInService.checkIn('Estoy bien')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showToast('Check-in registrado', 'success');
        },
        error: (err) => {
          console.error('Error checking in:', err);
          this.isLoading.set(false);
          this.showToast('Error al registrar check-in', 'danger');
        }
      });
  }

  dismiss() {
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    this.checkInService.dismissReminder();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color,
    });
    await toast.present();
  }

  get missedCount(): number {
    return this.checkInStatus()?.missedCheckIns || 0;
  }
}
