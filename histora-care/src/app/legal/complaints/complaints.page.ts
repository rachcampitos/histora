import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsApiService, CreateComplaintRequest } from '../../core/services/complaints.service';
import { AuthUser } from '../../core/models';

@Component({
  selector: 'app-complaints',
  templateUrl: './complaints.page.html',
  standalone: false,
  styleUrls: ['./complaints.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComplaintsPage implements OnInit {
  private location = inject(Location);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private authService = inject(AuthService);
  private complaintsApi = inject(ComplaintsApiService);

  type = signal<'reclamo' | 'queja'>('reclamo');
  fullName = signal('');
  dni = signal('');
  email = signal('');
  phone = signal('');
  description = signal('');
  submitting = signal(false);

  ngOnInit() {
    const user: AuthUser | null = this.authService.user();
    if (user) {
      this.fullName.set(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      this.email.set(user.email || '');
    }
  }

  get isValid(): boolean {
    return (
      this.fullName().trim().length > 0 &&
      this.dni().trim().length > 0 &&
      this.email().trim().length > 0 &&
      this.phone().trim().length > 0 &&
      this.description().trim().length >= 20
    );
  }

  async onSubmit() {
    if (!this.isValid || this.submitting()) return;

    this.submitting.set(true);
    const loading = await this.loadingCtrl.create({ message: 'Enviando...' });
    await loading.present();

    const data: CreateComplaintRequest = {
      type: this.type(),
      fullName: this.fullName(),
      dni: this.dni(),
      email: this.email(),
      phone: this.phone(),
      description: this.description(),
    };

    this.complaintsApi.create(data).subscribe({
      next: async (result) => {
        await loading.dismiss();
        this.submitting.set(false);
        const alert = await this.alertCtrl.create({
          header: 'Registro Exitoso',
          message: `Tu ${result.type === 'reclamo' ? 'reclamo' : 'queja'} ha sido registrado con el numero <strong>${result.claimNumber}</strong>. Recibirás una respuesta en un plazo maximo de 30 dias calendario.`,
          buttons: [
            {
              text: 'Ver mis reclamos',
              handler: () => this.router.navigate(['/legal/complaints/list']),
            },
            {
              text: 'Aceptar',
              role: 'cancel',
              handler: () => this.location.back(),
            },
          ],
        });
        await alert.present();
      },
      error: async () => {
        await loading.dismiss();
        this.submitting.set(false);
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'No se pudo registrar tu reclamo. Intenta de nuevo.',
          buttons: ['Aceptar'],
        });
        await alert.present();
      },
    });
  }

  goBack() {
    this.location.back();
  }
}
