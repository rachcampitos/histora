import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-verification-required-modal',
  templateUrl: './verification-required-modal.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./verification-required-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerificationRequiredModalComponent {
  private modalCtrl = inject(ModalController);
  private router = inject(Router);

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async goToVerification() {
    await this.modalCtrl.dismiss(null, 'verify');
    this.router.navigate(['/patient/verification']);
  }
}
