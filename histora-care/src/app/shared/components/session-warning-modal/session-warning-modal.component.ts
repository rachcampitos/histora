import { Component, inject, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-session-warning-modal',
  templateUrl: './session-warning-modal.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./session-warning-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionWarningModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() minutesRemaining: number = 1;

  get minuteText(): string {
    return this.minutesRemaining === 1 ? 'minuto' : 'minutos';
  }

  logout() {
    this.modalCtrl.dismiss(null, 'logout');
  }

  keepSession() {
    this.modalCtrl.dismiss(null, 'keep');
  }
}
