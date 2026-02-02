import { Component, EventEmitter, Output, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { LoadingController, ToastController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PatientVerificationService } from '../../../../core/services/patient-verification.service';
import { ApiService } from '../../../../core/services/api.service';

type SelfieSubStep = 'instructions' | 'capture' | 'review';

interface PhotoData {
  base64: string;
  mimeType: string;
  url?: string;
  publicId?: string;
}

@Component({
  selector: 'app-selfie-step',
  templateUrl: './selfie-step.component.html',
  standalone: false,
  styleUrls: ['./selfie-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelfieStepComponent {
  @Output() completed = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private verificationService = inject(PatientVerificationService);
  private api = inject(ApiService);

  // State
  subStep = signal<SelfieSubStep>('instructions');
  selfiePhoto = signal<PhotoData | null>(null);
  isLoading = signal(false);
  isUploading = signal(false);
  error = signal<string | null>(null);

  get canSubmit(): boolean {
    return this.selfiePhoto()?.url !== undefined;
  }

  startCapture() {
    this.subStep.set('capture');
  }

  async takeSelfie() {
    try {
      // Use front camera for selfie
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        direction: 'front' as any, // Use front camera
        width: 800,
        height: 800,
        correctOrientation: true,
        webUseInput: true
      });

      if (!image.base64String) {
        return;
      }

      this.isUploading.set(true);
      this.error.set(null);

      const loading = await this.loadingCtrl.create({
        message: 'Subiendo selfie...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        // Upload to Cloudinary via API
        const response = await this.api.post<{ url: string; publicId: string }>('/uploads/selfie-photo', {
          imageData: image.base64String,
          mimeType: `image/${image.format || 'jpeg'}`
        }).toPromise();

        this.selfiePhoto.set({
          base64: image.base64String,
          mimeType: `image/${image.format || 'jpeg'}`,
          url: response?.url,
          publicId: response?.publicId
        });

        this.subStep.set('review');
        await this.showToast('Selfie capturado correctamente', 'success');
      } catch (err: any) {
        console.error('Error uploading selfie:', err);
        this.error.set('Error al subir la selfie');
      } finally {
        await loading.dismiss();
      }
    } catch (err: any) {
      // User cancelled
      if (err?.message?.includes('cancelled') || err?.message?.includes('No image')) {
        console.log('User cancelled selfie');
        return;
      }
      console.error('Error taking selfie:', err);
      this.error.set('Error al tomar la selfie');
    } finally {
      this.isUploading.set(false);
    }
  }

  retakeSelfie() {
    this.selfiePhoto.set(null);
    this.subStep.set('capture');
  }

  async submitSelfie() {
    if (!this.canSubmit) {
      this.error.set('Debes tomar una selfie');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const loading = await this.loadingCtrl.create({
      message: 'Verificando selfie...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const photo = this.selfiePhoto();

      await this.verificationService.uploadSelfie({
        selfiePhotoUrl: photo!.url!,
        selfiePhotoPublicId: photo!.publicId
      }).toPromise();

      await this.showToast('Selfie verificado correctamente', 'success');
      this.completed.emit();
    } catch (err: any) {
      console.error('Error verifying selfie:', err);
      this.error.set(err?.error?.message || 'Error al verificar la selfie');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  goBack() {
    const step = this.subStep();

    switch (step) {
      case 'instructions':
        this.back.emit();
        break;
      case 'capture':
        this.subStep.set('instructions');
        break;
      case 'review':
        this.subStep.set('capture');
        break;
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
