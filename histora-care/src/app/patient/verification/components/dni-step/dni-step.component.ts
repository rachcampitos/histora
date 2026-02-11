import { Component, EventEmitter, Output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { PatientVerificationService } from '../../../../core/services/patient-verification.service';
import { UploadsService } from '../../../../core/services/uploads.service';
import { ApiService } from '../../../../core/services/api.service';

type DniSubStep = 'enter-number' | 'front-photo' | 'back-photo' | 'review';

interface PhotoData {
  base64: string;
  mimeType: string;
  url?: string;
  publicId?: string;
}

@Component({
  selector: 'app-dni-step',
  templateUrl: './dni-step.component.html',
  standalone: false,
  styleUrls: ['./dni-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DniStepComponent {
  @Output() completed = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private verificationService = inject(PatientVerificationService);
  private uploadsService = inject(UploadsService);
  private api = inject(ApiService);

  // State
  subStep = signal<DniSubStep>('enter-number');
  dniNumber = signal('');
  frontPhoto = signal<PhotoData | null>(null);
  backPhoto = signal<PhotoData | null>(null);
  isLoading = signal(false);
  isUploading = signal(false);
  error = signal<string | null>(null);

  get isDniValid(): boolean {
    const dni = this.dniNumber().replace(/\D/g, '');
    return dni.length === 8;
  }

  get canProceedToReview(): boolean {
    return this.frontPhoto()?.url !== undefined && this.backPhoto()?.url !== undefined;
  }

  onDniInput(event: any) {
    const value = event.target.value.replace(/\D/g, '');
    this.dniNumber.set(value.slice(0, 8));
    this.error.set(null);
  }

  proceedToFrontPhoto() {
    if (!this.isDniValid) {
      this.error.set('Ingresa un DNI valido de 8 digitos');
      return;
    }
    this.subStep.set('front-photo');
  }

  async takeFrontPhoto() {
    await this.takePhoto('front');
  }

  async takeBackPhoto() {
    await this.takePhoto('back');
  }

  private async takePhoto(side: 'front' | 'back') {
    try {
      const photo = await this.uploadsService.promptAndGetPhoto();

      if (!photo) {
        return; // User cancelled
      }

      this.isUploading.set(true);
      this.error.set(null);

      const loading = await this.loadingCtrl.create({
        message: 'Subiendo foto...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        // Upload to Cloudinary via API
        const response = await this.api.post<{ url: string; publicId: string }>('/uploads/dni-photo', {
          imageData: photo.base64,
          mimeType: photo.mimeType,
          side: side
        }).toPromise();

        const photoData: PhotoData = {
          base64: photo.base64,
          mimeType: photo.mimeType,
          url: response?.url,
          publicId: response?.publicId
        };

        if (side === 'front') {
          this.frontPhoto.set(photoData);
          // Automatically proceed to back photo
          this.subStep.set('back-photo');
        } else {
          this.backPhoto.set(photoData);
          // Proceed to review
          this.subStep.set('review');
        }

        await this.showToast('Foto subida correctamente', 'success');
      } catch (err: any) {
        console.error('Error uploading photo:', err);
        this.error.set('Error al subir la foto');
      } finally {
        await loading.dismiss();
      }
    } catch (err: any) {
      console.error('Error taking photo:', err);
      this.error.set('Error al tomar la foto');
    } finally {
      this.isUploading.set(false);
    }
  }

  async retakeFrontPhoto() {
    this.frontPhoto.set(null);
    this.subStep.set('front-photo');
  }

  async retakeBackPhoto() {
    this.backPhoto.set(null);
    this.subStep.set('back-photo');
  }

  async submitDni() {
    if (!this.canProceedToReview) {
      this.error.set('Debes subir ambas fotos del DNI');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const loading = await this.loadingCtrl.create({
      message: 'Verificando DNI...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const front = this.frontPhoto();
      const back = this.backPhoto();

      await this.verificationService.uploadDni({
        dniNumber: this.dniNumber(),
        frontPhotoUrl: front!.url!,
        frontPhotoPublicId: front!.publicId,
        backPhotoUrl: back!.url!,
        backPhotoPublicId: back!.publicId
      }).toPromise();

      await this.showToast('DNI verificado correctamente', 'success');
      this.completed.emit();
    } catch (err: any) {
      console.error('Error verifying DNI:', err);
      this.error.set(err?.error?.message || 'Error al verificar el DNI');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  goBack() {
    const step = this.subStep();

    switch (step) {
      case 'enter-number':
        this.back.emit();
        break;
      case 'front-photo':
        this.subStep.set('enter-number');
        break;
      case 'back-photo':
        this.subStep.set('front-photo');
        break;
      case 'review':
        this.subStep.set('back-photo');
        break;
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 4000 : 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
