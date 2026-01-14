import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LoadingController,
  ToastController,
  ActionSheetController,
  AlertController,
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

type UserType = 'nurse' | 'patient';
type Step = 'select' | 'form' | 'documents' | 'terms';

interface DocumentUpload {
  type: 'cep_front' | 'cep_back' | 'dni_front' | 'dni_back' | 'selfie_with_dni';
  label: string;
  description: string;
  icon: string;
  imageData: string | null;
  previewUrl: string | null;
}

@Component({
  selector: 'app-complete-registration',
  templateUrl: './complete-registration.page.html',
  standalone: false,
  styleUrls: ['./complete-registration.page.scss'],
})
export class CompleteRegistrationPage {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private actionSheetCtrl = inject(ActionSheetController);
  private alertCtrl = inject(AlertController);
  private authService = inject(AuthService);
  private api = inject(ApiService);

  // Step: 'select', 'form', 'documents', or 'terms'
  step = signal<Step>('select');
  selectedType = signal<UserType | null>(null);

  // Terms acceptance
  termsAccepted = signal(false);
  professionalDisclaimerAccepted = signal(false);
  showTermsModal = signal(false);
  showDisclaimerModal = signal(false);
  activeModalContent = signal<'terms' | 'disclaimer' | null>(null);

  // Form for nurse (requires CEP number and DNI)
  nurseForm: FormGroup;

  // Document uploads
  documents = signal<DocumentUpload[]>([
    {
      type: 'cep_front',
      label: 'Carnet CEP (Frente)',
      description: 'Foto del frente de tu carnet del Colegio de Enfermeros',
      icon: 'card-outline',
      imageData: null,
      previewUrl: null,
    },
    {
      type: 'cep_back',
      label: 'Carnet CEP (Dorso)',
      description: 'Foto del dorso de tu carnet del Colegio de Enfermeros',
      icon: 'card-outline',
      imageData: null,
      previewUrl: null,
    },
    {
      type: 'dni_front',
      label: 'DNI (Frente)',
      description: 'Foto del frente de tu DNI',
      icon: 'id-card-outline',
      imageData: null,
      previewUrl: null,
    },
    {
      type: 'dni_back',
      label: 'DNI (Dorso)',
      description: 'Foto del dorso de tu DNI',
      icon: 'id-card-outline',
      imageData: null,
      previewUrl: null,
    },
    {
      type: 'selfie_with_dni',
      label: 'Selfie con DNI',
      description: 'Foto tuya sosteniendo tu DNI junto a tu rostro',
      icon: 'person-circle-outline',
      imageData: null,
      previewUrl: null,
    },
  ]);

  constructor() {
    this.nurseForm = this.fb.group({
      cepNumber: ['', [Validators.required, Validators.minLength(5)]],
      dniNumber: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      fullNameOnDni: ['', [Validators.required, Validators.minLength(3)]],
      specialties: [[]],
    });
  }

  // Available nursing specialties
  specialtiesList = [
    'Cuidado General',
    'Inyecciones',
    'Curaciones',
    'Terapia IV',
    'Cuidado de Heridas',
    'Control de Signos Vitales',
    'Cuidado Post-Operatorio',
    'Cuidado de Adulto Mayor',
    'Pediatria',
    'Emergencias',
  ];

  selectUserType(type: UserType) {
    this.selectedType.set(type);

    if (type === 'patient') {
      // For patient, go directly to terms
      this.step.set('terms');
    } else {
      this.step.set('form');
    }
  }

  goBack() {
    const currentStep = this.step();
    if (currentStep === 'terms') {
      if (this.selectedType() === 'patient') {
        this.step.set('select');
        this.selectedType.set(null);
      } else {
        this.step.set('documents');
      }
      this.termsAccepted.set(false);
      this.professionalDisclaimerAccepted.set(false);
    } else if (currentStep === 'documents') {
      this.step.set('form');
    } else if (currentStep === 'form') {
      this.step.set('select');
      this.selectedType.set(null);
    } else {
      this.authService.logout();
    }
  }

  // Terms modal methods
  openTermsModal() {
    this.activeModalContent.set('terms');
    this.showTermsModal.set(true);
  }

  openDisclaimerModal() {
    this.activeModalContent.set('disclaimer');
    this.showDisclaimerModal.set(true);
  }

  closeModals() {
    this.showTermsModal.set(false);
    this.showDisclaimerModal.set(false);
    this.activeModalContent.set(null);
  }

  toggleTermsAccepted() {
    this.termsAccepted.set(!this.termsAccepted());
  }

  toggleProfessionalDisclaimerAccepted() {
    this.professionalDisclaimerAccepted.set(!this.professionalDisclaimerAccepted());
  }

  // Check if can proceed from terms step
  get canProceedFromTerms(): boolean {
    if (this.selectedType() === 'patient') {
      return this.termsAccepted();
    } else {
      // Nurse needs both
      return this.termsAccepted() && this.professionalDisclaimerAccepted();
    }
  }

  toggleSpecialty(specialty: string) {
    const current = this.nurseForm.get('specialties')?.value || [];
    const index = current.indexOf(specialty);

    if (index === -1) {
      current.push(specialty);
    } else {
      current.splice(index, 1);
    }

    this.nurseForm.patchValue({ specialties: [...current] });
  }

  isSpecialtySelected(specialty: string): boolean {
    const current = this.nurseForm.get('specialties')?.value || [];
    return current.includes(specialty);
  }

  // Proceed to documents step
  proceedToDocuments() {
    if (this.nurseForm.invalid) {
      this.nurseForm.markAllAsTouched();
      return;
    }
    this.step.set('documents');
  }

  // Proceed to terms step (for nurses after documents)
  proceedToTerms() {
    if (!this.allDocumentsUploaded) {
      return;
    }
    this.step.set('terms');
  }

  // Take photo for a document
  async takePhoto(docType: DocumentUpload['type']) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: 'Tomar Foto',
          icon: 'camera',
          handler: () => this.captureImage(docType, CameraSource.Camera),
        },
        {
          text: 'Galeria',
          icon: 'images',
          handler: () => this.captureImage(docType, CameraSource.Photos),
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  private async captureImage(docType: DocumentUpload['type'], source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: source,
        correctOrientation: true,
      });

      if (image.base64String) {
        const docs = this.documents();
        const index = docs.findIndex((d) => d.type === docType);
        if (index !== -1) {
          docs[index].imageData = `data:image/${image.format};base64,${image.base64String}`;
          docs[index].previewUrl = `data:image/${image.format};base64,${image.base64String}`;
          this.documents.set([...docs]);
        }
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al capturar la imagen',
        duration: 2000,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
    }
  }

  // Remove a document
  removeDocument(docType: DocumentUpload['type']) {
    const docs = this.documents();
    const index = docs.findIndex((d) => d.type === docType);
    if (index !== -1) {
      docs[index].imageData = null;
      docs[index].previewUrl = null;
      this.documents.set([...docs]);
    }
  }

  // Check if all documents are uploaded
  get allDocumentsUploaded(): boolean {
    return this.documents().every((d) => d.imageData !== null);
  }

  // Get count of uploaded documents
  get uploadedCount(): number {
    return this.documents().filter((d) => d.imageData !== null).length;
  }

  async completeAsPatient() {
    if (!this.termsAccepted()) {
      const toast = await this.toastCtrl.create({
        message: 'Debe aceptar los terminos y condiciones',
        duration: 2000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Completando registro...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const response = await this.api
        .post<{
          access_token: string;
          refresh_token: string;
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            avatar?: string;
          };
        }>('/auth/google/complete-registration', {
          userType: 'patient',
          termsAccepted: true,
        })
        .toPromise();

      await loading.dismiss();

      if (response) {
        await this.authService.handleWebOAuthCallback({
          access_token: response.access_token,
          refresh_token: response.refresh_token,
          user: JSON.stringify(response.user),
          is_new_user: 'false',
        });

        const toast = await this.toastCtrl.create({
          message: 'Registro completado como paciente',
          duration: 2000,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle-outline',
        });
        await toast.present();

        this.router.navigate(['/patient/tabs/home']);
      }
    } catch (error) {
      await loading.dismiss();
      console.error('Error completing registration:', error);

      const toast = await this.toastCtrl.create({
        message: 'Error al completar el registro',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline',
      });
      await toast.present();
    }
  }

  async completeAsNurse() {
    if (!this.allDocumentsUploaded) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor sube todos los documentos requeridos',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
        icon: 'alert-circle-outline',
      });
      await toast.present();
      return;
    }

    if (!this.termsAccepted() || !this.professionalDisclaimerAccepted()) {
      const toast = await this.toastCtrl.create({
        message: 'Debe aceptar los terminos y la exencion de responsabilidad',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
        icon: 'alert-circle-outline',
      });
      await toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Subiendo documentos...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const { cepNumber, dniNumber, fullNameOnDni, specialties } = this.nurseForm.value;

      // First, complete basic registration with terms acceptance
      const response = await this.api
        .post<{
          access_token: string;
          refresh_token: string;
          user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
            avatar?: string;
          };
          nurseId: string;
        }>('/auth/google/complete-registration', {
          userType: 'nurse',
          cepNumber,
          specialties,
          termsAccepted: true,
          professionalDisclaimerAccepted: true,
        })
        .toPromise();

      if (!response) {
        throw new Error('No response from server');
      }

      // Update local auth state
      await this.authService.handleWebOAuthCallback({
        access_token: response.access_token,
        refresh_token: response.refresh_token,
        user: JSON.stringify(response.user),
        is_new_user: 'false',
      });

      // Now submit verification documents
      loading.message = 'Enviando verificacion...';

      const documentsToUpload = this.documents()
        .filter((d) => d.imageData)
        .map((d) => ({
          documentType: d.type,
          imageData: d.imageData!,
        }));

      await this.api
        .post(`/nurses/${response.nurseId}/verification`, {
          dniNumber,
          fullNameOnDni,
          documents: documentsToUpload,
        })
        .toPromise();

      await loading.dismiss();

      // Show success alert
      const alert = await this.alertCtrl.create({
        header: 'Registro Completado',
        message:
          'Tu solicitud de verificacion ha sido enviada. Te notificaremos cuando sea aprobada. Mientras tanto, puedes configurar tu perfil.',
        buttons: [
          {
            text: 'Entendido',
            handler: () => {
              this.router.navigate(['/nurse/dashboard']);
            },
          },
        ],
        backdropDismiss: false,
      });
      await alert.present();
    } catch (error: unknown) {
      await loading.dismiss();
      console.error('Error completing registration:', error);

      let message = 'Error al completar el registro';
      if (error && typeof error === 'object' && 'error' in error) {
        const err = error as { error?: { message?: string } };
        if (err.error?.message?.includes('CEP')) {
          message = 'El numero de CEP ya esta registrado';
        } else if (err.error?.message) {
          message = err.error.message;
        }
      }

      const toast = await this.toastCtrl.create({
        message,
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline',
      });
      await toast.present();
    }
  }

  // Getters for template
  get cepNumber() {
    return this.nurseForm.get('cepNumber');
  }
  get dniNumber() {
    return this.nurseForm.get('dniNumber');
  }
  get fullNameOnDni() {
    return this.nurseForm.get('fullNameOnDni');
  }
}
