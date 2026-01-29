import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController, ActionSheetController, NavController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NurseApiService } from '../../core/services/nurse.service';
import { AuthService } from '../../core/services/auth.service';
import { NurseOnboardingService } from '../../core/services/nurse-onboarding.service';
import { ProductTourService } from '../../core/services/product-tour.service';
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

// Things nurse can do while waiting
interface WaitingTask {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  action?: string;
  completed: boolean;
}

@Component({
  selector: 'app-verification',
  templateUrl: './verification.page.html',
  standalone: false,
  styleUrls: ['./verification.page.scss'],
})
export class VerificationPage implements OnInit, OnDestroy {
  private nurseApi = inject(NurseApiService);
  private authService = inject(AuthService);
  private nurseOnboarding = inject(NurseOnboardingService);
  private productTour = inject(ProductTourService);
  private router = inject(Router);
  private navCtrl = inject(NavController);
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

  // Waiting screen state
  waitingTimeElapsed = signal('');
  waitingProgressPercent = signal(0);
  private waitingTimeInterval: ReturnType<typeof setInterval> | null = null;
  private statusPollingInterval: ReturnType<typeof setInterval> | null = null;

  // Tasks to complete while waiting
  waitingTasks = signal<WaitingTask[]>([
    {
      id: 'profile',
      title: 'Completa tu perfil profesional',
      description: 'Agrega tus especialidades, experiencia y certificaciones',
      icon: 'person-outline',
      route: '/nurse/profile',
      completed: false
    },
    {
      id: 'services',
      title: 'Configura tus servicios',
      description: 'Define qué servicios ofreces y tus tarifas',
      icon: 'medical-outline',
      route: '/nurse/services',
      completed: false
    },
    {
      id: 'availability',
      title: 'Establece tu disponibilidad',
      description: 'Configura los horarios en que puedes atender',
      icon: 'calendar-outline',
      route: '/nurse/profile',
      completed: false
    },
    {
      id: 'notifications',
      title: 'Activa las notificaciones',
      description: 'Para que te avisemos cuando tu cuenta esté lista',
      icon: 'notifications-outline',
      action: 'enable_notifications',
      completed: false
    }
  ]);

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
  isApproved = computed(() => this.verificationStatus() === 'approved' && !this.showApprovalTransition());
  isPending = computed(() => this.verificationStatus() === 'pending');
  isUnderReview = computed(() => this.verificationStatus() === 'under_review' || this.showApprovalTransition());
  isRejected = computed(() => this.verificationStatus() === 'rejected');

  // Transition state to show checklist completing before approved card
  showApprovalTransition = signal(false);
  // Track if all checklist items should show as completed
  allChecklistCompleted = computed(() => this.verificationStatus() === 'approved' || this.showApprovalTransition());

  // CEP data from validation
  cepPhotoUrl = computed(() => this.cepValidation()?.photoUrl || null);
  cepRegion = computed(() => this.cepValidation()?.region || null);
  cepIsHabil = computed(() => this.cepValidation()?.isHabil ?? false);
  cepStatus = computed(() => this.cepValidation()?.status || 'UNKNOWN');
  cepOfficialName = computed(() => this.cepValidation()?.fullName || null);

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

  ngOnDestroy() {
    this.stopWaitingTimer();
    this.stopStatusPolling();
  }

  ionViewWillLeave() {
    // Stop any active tour when leaving to prevent freezing
    this.productTour.forceStop();
  }

  // ============= Waiting Screen Methods =============

  private startWaitingTimer() {
    this.updateWaitingTime();
    this.waitingTimeInterval = setInterval(() => {
      this.updateWaitingTime();
    }, 60000); // Update every minute
  }

  private stopWaitingTimer() {
    if (this.waitingTimeInterval) {
      clearInterval(this.waitingTimeInterval);
      this.waitingTimeInterval = null;
    }
  }

  // ============= Status Polling (auto-refresh when admin approves) =============

  private startStatusPolling() {
    console.log('[VERIFICATION POLL] Starting status polling (every 15 seconds)');
    // Poll every 15 seconds to check if status changed (faster for better UX)
    this.statusPollingInterval = setInterval(() => {
      console.log('[VERIFICATION POLL] Polling tick...');
      this.checkVerificationStatus();
    }, 15000);
  }

  private stopStatusPolling() {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
      this.statusPollingInterval = null;
    }
  }

  async checkVerificationStatus() {
    const nurse = this.nurse();
    if (!nurse) return;

    try {
      console.log('[VERIFICATION POLL] Checking status for nurse:', nurse._id);

      // Fetch both verification and nurse profile to ensure we get the latest status
      const [verification, updatedNurse] = await Promise.all([
        this.nurseApi.getVerificationStatus(nurse._id).toPromise(),
        this.nurseApi.getMyProfile().toPromise()
      ]);

      console.log('[VERIFICATION POLL] API Response - Verification status:', verification?.status);
      console.log('[VERIFICATION POLL] API Response - Nurse verificationStatus:', updatedNurse?.verificationStatus);

      // Update nurse profile
      if (updatedNurse) {
        this.nurse.set(updatedNurse);
      }

      if (verification) {
        const previousStatus = this.verification()?.status;
        console.log('[VERIFICATION POLL] Previous status:', previousStatus, '-> New status:', verification.status);

        this.verification.set(verification);

        // Log computed values after signal update
        console.log('[VERIFICATION POLL] After signal update - verificationStatus():', this.verificationStatus());
        console.log('[VERIFICATION POLL] After signal update - allChecklistCompleted():', this.allChecklistCompleted());

        // If status changed to approved, show success and stop polling
        if (verification.status === 'approved' && previousStatus !== 'approved') {
          console.log('[VERIFICATION POLL] Status changed to APPROVED! Showing success...');
          this.stopStatusPolling();
          this.stopWaitingTimer();
          this.showApprovalSuccess();
        }
        // Also check nurse profile as backup
        else if (verification.status !== 'approved' && updatedNurse?.verificationStatus === 'approved') {
          console.log('[VERIFICATION POLL] Nurse profile shows APPROVED but verification doc does not. Using nurse profile status.');
          this.stopStatusPolling();
          this.stopWaitingTimer();
          this.showApprovalSuccess();
        }
        // If status changed to rejected, stop polling
        else if (verification.status === 'rejected' && previousStatus !== 'rejected') {
          console.log('[VERIFICATION POLL] Status changed to REJECTED!');
          this.stopStatusPolling();
          this.stopWaitingTimer();
          this.showRejectionAlert(verification.rejectionReason);
        }
      } else if (updatedNurse?.verificationStatus === 'approved') {
        // Fallback: check nurse profile status if verification document not found
        console.log('[VERIFICATION POLL] Fallback: Nurse profile shows APPROVED');
        this.stopStatusPolling();
        this.stopWaitingTimer();
        this.showApprovalSuccess();
      }
    } catch (error) {
      // Silently fail on polling errors
      console.error('[VERIFICATION POLL] Error polling verification status:', error);
    }
  }

  private async showApprovalSuccess() {
    console.log('[VERIFICATION] showApprovalSuccess called');
    console.log('[VERIFICATION] Current verificationStatus:', this.verificationStatus());
    console.log('[VERIFICATION] allChecklistCompleted:', this.allChecklistCompleted());

    // Mark celebration as shown to prevent duplicate modal in dashboard
    const nurse = this.nurse();
    if (nurse) {
      const celebrationKey = `verification_celebration_${nurse._id}`;
      localStorage.setItem(celebrationKey, 'shown');
    }

    // First, show the transition state (checklist items completing)
    this.showApprovalTransition.set(true);
    console.log('[VERIFICATION] showApprovalTransition set to TRUE');
    console.log('[VERIFICATION] allChecklistCompleted after transition:', this.allChecklistCompleted());

    // Wait 2 seconds for user to see the checklist complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Hide transition and show approved card
    this.showApprovalTransition.set(false);
    console.log('[VERIFICATION] showApprovalTransition set to FALSE');
    console.log('[VERIFICATION] Final verificationStatus:', this.verificationStatus());
    console.log('[VERIFICATION] Final isApproved:', this.isApproved());
    console.log('[VERIFICATION] Final isUnderReview:', this.isUnderReview());

    // Show success alert
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-success',
      header: '¡Felicitaciones!',
      message: 'Tu cuenta ha sido verificada. Ya puedes activar tu disponibilidad y comenzar a recibir solicitudes de pacientes.',
      buttons: [
        {
          text: 'Ir al Dashboard',
          handler: () => {
            this.router.navigate(['/nurse/dashboard']);
          }
        }
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  private async showRejectionAlert(reason?: string) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-warning',
      header: 'Verificación Rechazada',
      message: reason || 'Tu verificación fue rechazada. Por favor revisa los documentos e intenta nuevamente.',
      buttons: ['Entendido']
    });
    await alert.present();
  }

  private async showDocumentsSubmittedAlert() {
    // Check if onboarding is already completed
    await this.nurseOnboarding.init();
    const onboardingCompleted = this.nurseOnboarding.isCompleted();

    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-success',
      header: '¡Documentos enviados!',
      message: 'Tu solicitud está en revisión. Te notificaremos en 24-48 horas cuando esté lista.',
      buttons: [
        {
          text: 'Continuar',
          cssClass: 'alert-button-primary',
          handler: () => {
            if (onboardingCompleted) {
              // Go directly to dashboard if onboarding already done
              this.router.navigate(['/nurse/dashboard'], { replaceUrl: true });
            } else {
              // Navigate to onboarding to complete location and payment setup
              this.router.navigate(['/nurse/onboarding'], { replaceUrl: true });
            }
          }
        }
      ],
      backdropDismiss: false
    });
    await alert.present();
  }

  private updateWaitingTime() {
    const verification = this.verification();
    if (!verification?.createdAt) {
      this.waitingTimeElapsed.set('Hace unos momentos');
      this.waitingProgressPercent.set(5);
      return;
    }

    const submittedAt = new Date(verification.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - submittedAt.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    // Format elapsed time
    if (diffHours < 1) {
      this.waitingTimeElapsed.set(`Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`);
    } else if (diffHours < 24) {
      this.waitingTimeElapsed.set(`Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`);
    } else {
      const diffDays = Math.floor(diffHours / 24);
      this.waitingTimeElapsed.set(`Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`);
    }

    // Calculate progress (0-100%, assuming 48 hours max)
    const maxWaitHours = 48;
    const progressPercent = Math.min(Math.round((diffHours / maxWaitHours) * 100), 95);
    this.waitingProgressPercent.set(Math.max(progressPercent, 10)); // At least 10%
  }

  onTaskClick(task: WaitingTask) {
    if (task.route) {
      // Stop any tours before navigating
      this.productTour.forceStop();
      // Use navigateForward with replaceUrl to avoid stacking verification in history
      // This way, back button from profile/services goes to dashboard, not verification
      this.navCtrl.navigateForward(task.route, { replaceUrl: true });
    } else if (task.action === 'enable_notifications') {
      this.requestNotificationPermission();
    }
  }

  private async requestNotificationPermission() {
    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.markTaskCompleted('notifications');
        this.showToast('Notificaciones activadas', 'success');
      } else {
        this.showToast('Por favor activa las notificaciones en la configuración de tu dispositivo', 'warning');
      }
    } catch {
      // Fallback for devices without Notification API
      this.showToast('Recibirás notificaciones por email', 'primary');
      this.markTaskCompleted('notifications');
    }
  }

  private markTaskCompleted(taskId: string) {
    const tasks = this.waitingTasks().map(t =>
      t.id === taskId ? { ...t, completed: true } : t
    );
    this.waitingTasks.set(tasks);
  }

  get completedTasksCount(): number {
    return this.waitingTasks().filter(t => t.completed).length;
  }

  get totalTasksCount(): number {
    return this.waitingTasks().length;
  }

  contactSupport() {
    // Open WhatsApp or email
    window.open('https://wa.me/51999999999?text=Hola, tengo una consulta sobre mi verificación en NurseLite', '_blank');
  }

  async loadData() {
    this.isLoading.set(true);
    console.log('[VERIFICATION] loadData() starting...');
    try {
      // Load nurse profile first
      const nurse = await this.nurseApi.getMyProfile().toPromise();
      console.log('[VERIFICATION] Nurse profile loaded:', nurse?.verificationStatus);

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
          console.log('[VERIFICATION] Verification status loaded:', verification?.status);

          if (verification) {
            this.verification.set(verification);

            console.log('[VERIFICATION] After setting signals:');
            console.log('[VERIFICATION] - verificationStatus():', this.verificationStatus());
            console.log('[VERIFICATION] - isApproved():', this.isApproved());
            console.log('[VERIFICATION] - isUnderReview():', this.isUnderReview());
            console.log('[VERIFICATION] - allChecklistCompleted():', this.allChecklistCompleted());

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
            // Start waiting timer and status polling if under review
            if (verification.status === 'under_review') {
              console.log('[VERIFICATION] Status is under_review, starting polling...');
              this.startWaitingTimer();
              this.startStatusPolling();
            } else {
              console.log('[VERIFICATION] Status is', verification.status, '- NOT starting polling');
            }
          } else {
            console.log('[VERIFICATION] No verification document found');
          }
        } catch (err) {
          // No verification exists yet, that's fine
          console.log('[VERIFICATION] Error or no verification:', err);
        }
      }
    } catch (error) {
      console.error('[VERIFICATION] Error loading data:', error);
      this.showToast('Error al cargar datos', 'danger');
    } finally {
      this.isLoading.set(false);
      console.log('[VERIFICATION] loadData() completed');
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
        correctOrientation: true,
        // Force file input on web to avoid video mode from getUserMedia
        webUseInput: true
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
      cssClass: 'histora-alert histora-alert-primary',
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
        // Start polling for status updates
        if (verification.status === 'under_review') {
          this.startWaitingTimer();
          this.startStatusPolling();
        }
      }

      await loading.dismiss();

      // Show success modal with next steps
      await this.showDocumentsSubmittedAlert();
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
    // Stop any active tours first
    this.productTour.forceStop();

    // If under review, approved, or still loading - go to dashboard
    // This ensures the back button always works regardless of data state
    if (this.isLoading() || this.isUnderReview() || this.isApproved()) {
      this.navCtrl.navigateRoot('/nurse/dashboard', { animated: true, animationDirection: 'back' });
      return;
    }

    // Only handle step navigation if we're in the pending flow
    if (this.isPending() || this.isRejected()) {
      if (this.currentStep() === 'confirm_identity') {
        this.currentStep.set('validate_cep');
        return;
      } else if (this.currentStep() === 'upload_documents' && !this.verification()?.cepIdentityConfirmed) {
        this.currentStep.set('confirm_identity');
        return;
      }
    }

    // Default: go to dashboard using navigateRoot to clear stack
    this.navCtrl.navigateRoot('/nurse/dashboard', { animated: true, animationDirection: 'back' });
  }

  goToProfile() {
    this.productTour.forceStop();
    this.navCtrl.navigateForward('/nurse/profile', { replaceUrl: true });
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
