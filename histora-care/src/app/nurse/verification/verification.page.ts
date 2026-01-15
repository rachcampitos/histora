import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController, ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NurseApiService } from '../../core/services/nurse.service';
import { AuthService } from '../../core/services/auth.service';
import { Nurse, NurseVerification, VerificationDocumentType, VerificationStatus, CepValidationResult } from '../../core/models';

type VerificationStep = 'validate_cep' | 'confirm_identity' | 'upload_documents';

interface DocumentUpload {
  type: VerificationDocumentType;
  label: string;
  description: string;
  icon: string;
  imageData: string | null;
  mimeType: string | null;
}

@Component({
  selector: 'app-verification',
  templateUrl: './verification.page.html',
  standalone: false,
  styleUrls: ['./verification.page.scss'],
})
export class VerificationPage implements OnInit {
  private nurseApi = inject(NurseApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private actionSheetCtrl = inject(ActionSheetController);

  // State
  nurse = signal<Nurse | null>(null);
  verification = signal<NurseVerification | null>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  isValidatingCep = signal(false);

  // Step management
  currentStep = signal<VerificationStep>('validate_cep');

  // CEP Validation state
  cepValidation = signal<CepValidationResult | null>(null);
  cepValidationMessage = signal('');

  // Form fields
  dniNumber = signal('');
  fullNameOnDni = signal('');

  // Document uploads
  documents = signal<DocumentUpload[]>([
    {
      type: 'cep_front',
      label: 'Carnet CEP (Frente)',
      description: 'Foto clara del frente de tu carnet del Colegio de Enfermeros',
      icon: 'card-outline',
      imageData: null,
      mimeType: null
    },
    {
      type: 'cep_back',
      label: 'Carnet CEP (Reverso)',
      description: 'Foto clara del reverso de tu carnet del Colegio de Enfermeros',
      icon: 'card-outline',
      imageData: null,
      mimeType: null
    },
    {
      type: 'dni_front',
      label: 'DNI (Frente)',
      description: 'Foto clara del frente de tu DNI',
      icon: 'id-card-outline',
      imageData: null,
      mimeType: null
    },
    {
      type: 'dni_back',
      label: 'DNI (Reverso)',
      description: 'Foto clara del reverso de tu DNI',
      icon: 'id-card-outline',
      imageData: null,
      mimeType: null
    },
    {
      type: 'selfie_with_dni',
      label: 'Selfie con DNI',
      description: 'Selfie sosteniendo tu DNI junto a tu rostro',
      icon: 'camera-outline',
      imageData: null,
      mimeType: null
    }
  ]);

  // Computed values
  user = this.authService.user;
  fullName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : 'Enfermera';
  });

  cepNumber = computed(() => this.nurse()?.cepNumber || '');
  verificationStatus = computed(() => this.verification()?.status || this.nurse()?.verificationStatus || 'pending');
  isApproved = computed(() => this.verificationStatus() === 'approved');
  isPending = computed(() => this.verificationStatus() === 'pending');
  isUnderReview = computed(() => this.verificationStatus() === 'under_review');
  isRejected = computed(() => this.verificationStatus() === 'rejected');

  // CEP photo from validation
  cepPhotoUrl = computed(() => this.cepValidation()?.photoUrl || null);

  canValidateCep = computed(() => {
    return this.dniNumber().length === 8 && !this.isValidatingCep();
  });

  canSubmitDocuments = computed(() => {
    const docs = this.documents();
    const allDocsUploaded = docs.every(d => d.imageData !== null);
    return allDocsUploaded && !this.isSubmitting();
  });

  uploadProgress = computed(() => {
    const docs = this.documents();
    const uploaded = docs.filter(d => d.imageData !== null).length;
    return Math.round((uploaded / docs.length) * 100);
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // Load nurse profile first
      const nurse = await this.nurseApi.getMyProfile().toPromise();
      if (nurse) {
        this.nurse.set(nurse);

        // Pre-fill full name from user
        const u = this.user();
        if (u) {
          this.fullNameOnDni.set(`${u.lastName} ${u.firstName}`.toUpperCase());
        }

        // Load verification status if exists
        try {
          const verification = await this.nurseApi.getVerificationStatus(nurse._id).toPromise();
          if (verification) {
            this.verification.set(verification);
            // Pre-fill form if data exists
            if (verification.dniNumber) {
              this.dniNumber.set(verification.dniNumber);
            }
            if (verification.fullNameOnDni) {
              this.fullNameOnDni.set(verification.fullNameOnDni);
            }
            // If CEP was already validated and confirmed, skip to documents
            if (verification.cepIdentityConfirmed) {
              this.currentStep.set('upload_documents');
            }
          }
        } catch {
          // No verification exists yet, that's fine
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Error al cargar datos', 'danger');
    } finally {
      this.isLoading.set(false);
    }
  }

  onDniNumberChange(event: CustomEvent) {
    const value = (event.detail.value || '').replace(/\D/g, '').slice(0, 8);
    this.dniNumber.set(value);
  }

  onFullNameChange(event: CustomEvent) {
    this.fullNameOnDni.set(event.detail.value || '');
  }

  // ============= STEP 1: Validate CEP =============

  async validateCep() {
    const nurse = this.nurse();
    if (!nurse || !this.canValidateCep()) return;

    this.isValidatingCep.set(true);
    this.cepValidationMessage.set('');

    try {
      const result = await this.nurseApi.preValidateCep(nurse._id, {
        dniNumber: this.dniNumber(),
        cepNumber: nurse.cepNumber,
        fullName: this.fullNameOnDni()
      }).toPromise();

      if (result) {
        this.cepValidation.set(result.cepValidation);
        this.cepValidationMessage.set(result.message);

        if (result.isValid) {
          // Update fullName from CEP if available
          if (result.cepValidation.fullName) {
            this.fullNameOnDni.set(result.cepValidation.fullName);
          }
          // Move to identity confirmation step
          this.currentStep.set('confirm_identity');
          this.showToast('CEP validado correctamente', 'success');
        } else {
          this.showToast(result.message || 'No se pudo validar el CEP', 'warning');
        }
      }
    } catch (error: unknown) {
      console.error('Error validating CEP:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al validar CEP';
      const httpError = error as { error?: { message?: string } };
      this.showToast(httpError?.error?.message || errorMessage, 'danger');
    } finally {
      this.isValidatingCep.set(false);
    }
  }

  // ============= STEP 2: Confirm Identity =============

  async confirmIdentity() {
    const nurse = this.nurse();
    const validation = this.cepValidation();
    if (!nurse || !validation) return;

    this.isSubmitting.set(true);

    try {
      const verification = await this.nurseApi.confirmCepIdentity(nurse._id, {
        dniNumber: this.dniNumber(),
        cepNumber: nurse.cepNumber,
        fullName: this.fullNameOnDni(),
        cepValidation: validation,
        confirmed: true
      }).toPromise();

      if (verification) {
        this.verification.set(verification);
        this.currentStep.set('upload_documents');
        this.showToast('Identidad confirmada. Ahora sube tus documentos.', 'success');
      }
    } catch (error: unknown) {
      console.error('Error confirming identity:', error);
      const httpError = error as { error?: { message?: string } };
      this.showToast(httpError?.error?.message || 'Error al confirmar identidad', 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  rejectIdentity() {
    // Reset and go back to step 1
    this.cepValidation.set(null);
    this.cepValidationMessage.set('');
    this.currentStep.set('validate_cep');
    this.showToast('Por favor verifica tu numero de DNI', 'warning');
  }

  // ============= STEP 3: Upload Documents =============

  async selectImage(docType: VerificationDocumentType) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera-outline',
          handler: () => {
            this.captureImage(docType, CameraSource.Camera);
          }
        },
        {
          text: 'Elegir de galeria',
          icon: 'images-outline',
          handler: () => {
            this.captureImage(docType, CameraSource.Photos);
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private async captureImage(docType: VerificationDocumentType, source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source,
        width: 1200,
        height: 1600,
        correctOrientation: true
      });

      if (image.base64String) {
        const docs = [...this.documents()];
        const docIndex = docs.findIndex(d => d.type === docType);
        if (docIndex !== -1) {
          docs[docIndex] = {
            ...docs[docIndex],
            imageData: image.base64String,
            mimeType: `image/${image.format || 'jpeg'}`
          };
          this.documents.set(docs);
        }
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      // User cancelled or error occurred
    }
  }

  removeImage(docType: VerificationDocumentType) {
    const docs = [...this.documents()];
    const docIndex = docs.findIndex(d => d.type === docType);
    if (docIndex !== -1) {
      docs[docIndex] = {
        ...docs[docIndex],
        imageData: null,
        mimeType: null
      };
      this.documents.set(docs);
    }
  }

  async submitVerification() {
    if (!this.canSubmitDocuments() || !this.nurse()) return;

    const alert = await this.alertCtrl.create({
      header: 'Confirmar envio',
      message: 'Una vez enviados los documentos, seran revisados por nuestro equipo. Este proceso puede tomar de 24 a 48 horas. Deseas continuar?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: () => this.doSubmit()
        }
      ]
    });
    await alert.present();
  }

  private async doSubmit() {
    const nurse = this.nurse();
    if (!nurse) return;

    this.isSubmitting.set(true);
    const loading = await this.loadingCtrl.create({
      message: 'Enviando documentos...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const documentsData = this.documents()
        .filter(d => d.imageData !== null)
        .map(d => ({
          imageData: d.imageData!,
          documentType: d.type,
          mimeType: d.mimeType || 'image/jpeg'
        }));

      const verification = await this.nurseApi.submitVerification(nurse._id, {
        dniNumber: this.dniNumber(),
        fullNameOnDni: this.fullNameOnDni(),
        documents: documentsData
      }).toPromise();

      if (verification) {
        this.verification.set(verification);
      }

      await loading.dismiss();
      this.showToast('Documentos enviados correctamente', 'success');
    } catch (error: unknown) {
      await loading.dismiss();
      console.error('Error submitting verification:', error);

      let message = 'Error al enviar documentos';
      const httpError = error as { status?: number; error?: { message?: string } };
      if (httpError.status === 400) {
        message = httpError?.error?.message || 'Documentos invalidos o ya verificado';
      }
      this.showToast(message, 'danger');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  // ============= Navigation =============

  goBack() {
    if (this.currentStep() === 'confirm_identity') {
      this.currentStep.set('validate_cep');
    } else if (this.currentStep() === 'upload_documents' && !this.verification()?.cepIdentityConfirmed) {
      this.currentStep.set('confirm_identity');
    } else {
      this.router.navigate(['/nurse/dashboard']);
    }
  }

  goToProfile() {
    this.router.navigate(['/nurse/profile']);
  }

  getStatusLabel(status: VerificationStatus): string {
    const labels: Record<VerificationStatus, string> = {
      pending: 'Pendiente',
      under_review: 'En revision',
      approved: 'Aprobado',
      rejected: 'Rechazado'
    };
    return labels[status] || 'Desconocido';
  }

  getStatusColor(status: VerificationStatus): string {
    const colors: Record<VerificationStatus, string> = {
      pending: 'warning',
      under_review: 'primary',
      approved: 'success',
      rejected: 'danger'
    };
    return colors[status] || 'medium';
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
