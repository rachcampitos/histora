import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
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
import {
  PeruLocationsService,
  Departamento,
  Provincia,
  Distrito,
} from '../../core/services/peru-locations.service';
import { GeolocationService } from '../../core/services/geolocation.service';

type UserType = 'nurse' | 'patient';
type Step = 'select' | 'form' | 'location' | 'documents' | 'terms';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private locationsService = inject(PeruLocationsService);
  private geoService = inject(GeolocationService);

  // Step: 'select', 'form', 'location', 'documents', or 'terms'
  step = signal<Step>('select');
  selectedType = signal<UserType | null>(null);

  // Location state
  departamentos = signal<Departamento[]>([]);
  provincias = signal<Provincia[]>([]);
  distritos = signal<Distrito[]>([]);
  selectedDepartamento = signal<Departamento | null>(null);
  selectedProvincia = signal<Provincia | null>(null);
  selectedDistrito = signal<Distrito | null>(null);
  serviceRadius = signal<number>(10);
  distritosSearchQuery = signal<string>('');
  loadingLocation = signal<boolean>(false);
  distritosAgrupados = signal<Map<string, Distrito[]> | null>(null);

  // Computed for location display
  estimatedDistricts = computed(() => {
    const dept = this.selectedDepartamento();
    const radius = this.serviceRadius();
    if (!dept) return 0;
    return this.locationsService.estimarDistritosEnRadio(dept.id, radius);
  });

  // Check if Lima to show zones
  isLima = computed(() => {
    const dept = this.selectedDepartamento();
    return dept ? this.locationsService.esLimaMetropolitana(dept.id) : false;
  });

  // Terms acceptance
  termsAccepted = signal(false);
  professionalDisclaimerAccepted = signal(false);
  showTermsModal = signal(false);
  showDisclaimerModal = signal(false);
  activeModalContent = signal<'terms' | 'disclaimer' | null>(null);

  // Form for nurse (requires CEP number and DNI)
  nurseForm: FormGroup;

  // Location form for nurse
  locationForm: FormGroup;

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

    this.locationForm = this.fb.group({
      departamentoId: ['', Validators.required],
      provinciaId: ['', Validators.required],
      distritoId: ['', Validators.required],
      serviceRadius: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
    });

    // Load departments on init
    this.departamentos.set(this.locationsService.getDepartamentos(true));
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
      this.step.set('location');
    } else if (currentStep === 'location') {
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

  // Proceed to location step (after form)
  proceedToLocation() {
    if (this.nurseForm.invalid) {
      this.nurseForm.markAllAsTouched();
      return;
    }
    this.step.set('location');
  }

  // Proceed to documents step (after location)
  proceedToDocuments() {
    if (!this.selectedDistrito()) {
      this.showToast('Debes seleccionar tu ubicacion', 'warning');
      return;
    }
    this.step.set('documents');
  }

  // Location selection methods
  onDepartamentoChange(event: CustomEvent) {
    const deptId = event.detail.value;
    const dept = this.departamentos().find((d) => d.id === deptId);

    this.selectedDepartamento.set(dept || null);
    this.selectedProvincia.set(null);
    this.selectedDistrito.set(null);
    this.distritos.set([]);
    this.distritosAgrupados.set(null);
    this.distritosSearchQuery.set('');

    if (dept) {
      // Load provinces
      const provs = this.locationsService.getProvincias(deptId);
      this.provincias.set(provs);

      // For Lima, also load districts grouped by zone
      if (this.locationsService.esLimaMetropolitana(deptId)) {
        const grouped = this.locationsService.getDistritosLimaPorZona();
        this.distritosAgrupados.set(grouped);
      }

      this.locationForm.patchValue({ departamentoId: deptId, provinciaId: '', distritoId: '' });
    }
  }

  onProvinciaChange(event: CustomEvent) {
    const provId = event.detail.value;
    const prov = this.provincias().find((p) => p.id === provId);

    this.selectedProvincia.set(prov || null);
    this.selectedDistrito.set(null);
    this.distritosSearchQuery.set('');

    if (prov) {
      const dists = this.locationsService.getDistritos(provId, true);
      this.distritos.set(dists);
      this.locationForm.patchValue({ provinciaId: provId, distritoId: '' });
    }
  }

  selectDistrito(distrito: Distrito) {
    this.selectedDistrito.set(distrito);
    this.locationForm.patchValue({ distritoId: distrito.id });

    // Set suggested radius
    const suggested = this.locationsService.getRadioSugerido(distrito);
    this.serviceRadius.set(suggested);
    this.locationForm.patchValue({ serviceRadius: suggested });
  }

  onRadiusChange(event: CustomEvent) {
    const value = event.detail.value as number;
    this.serviceRadius.set(value);
    this.locationForm.patchValue({ serviceRadius: value });
  }

  filterDistritos(event: CustomEvent) {
    const query = (event.detail.value as string) || '';
    this.distritosSearchQuery.set(query);

    if (query.length >= 2) {
      const deptId = this.selectedDepartamento()?.id;
      const results = this.locationsService.buscarDistritos(query, deptId);
      this.distritos.set(results);
    } else if (this.selectedProvincia()) {
      const dists = this.locationsService.getDistritos(this.selectedProvincia()!.id, true);
      this.distritos.set(dists);
    }
  }

  async useCurrentLocation() {
    this.loadingLocation.set(true);

    try {
      const permission = await this.geoService.requestPermissions();
      if (permission.location !== 'granted') {
        this.showToast('Permiso de ubicacion denegado', 'warning');
        this.loadingLocation.set(false);
        return;
      }

      const coords = await this.geoService.getCurrentPosition();

      // For now, just set Lima as default since reverse geocoding would require an external API
      // In production, you'd call a reverse geocoding service
      const limaDept = this.departamentos().find((d) => d.nombre === 'Lima');
      if (limaDept) {
        this.selectedDepartamento.set(limaDept);
        this.provincias.set(this.locationsService.getProvincias(limaDept.id));
        this.locationForm.patchValue({ departamentoId: limaDept.id });

        if (this.locationsService.esLimaMetropolitana(limaDept.id)) {
          const grouped = this.locationsService.getDistritosLimaPorZona();
          this.distritosAgrupados.set(grouped);
        }

        this.showToast('Ubicacion detectada. Selecciona tu distrito.', 'success');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      this.showToast('No se pudo obtener tu ubicacion', 'warning');
    } finally {
      this.loadingLocation.set(false);
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color,
    });
    await toast.present();
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

      // Get location data
      const distrito = this.selectedDistrito();
      const departamento = this.selectedDepartamento();

      if (!distrito || !departamento) {
        await loading.dismiss();
        this.showToast('Ubicacion no seleccionada', 'danger');
        return;
      }

      // Build location object
      const locationData = {
        coordinates: distrito.coordenadas
          ? [distrito.coordenadas.lng, distrito.coordenadas.lat]
          : [-77.0428, -12.0464], // Default Lima coords
        city: departamento.nombre,
        district: distrito.nombre,
        address: '',
      };

      // First, complete basic registration with terms acceptance and location
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
          location: locationData,
          serviceRadius: this.serviceRadius(),
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
        cssClass: 'histora-alert histora-alert-success',
        header: 'Registro Completado',
        message:
          'Tu solicitud de verificacion ha sido enviada. Te notificaremos cuando sea aprobada. Ahora vamos a configurar tu perfil.',
        buttons: [
          {
            text: 'Continuar',
            handler: () => {
              this.router.navigate(['/nurse/onboarding'], { replaceUrl: true });
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
