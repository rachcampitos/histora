import { Component, OnInit, inject, signal, computed, ViewChild, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { AlertController, ToastController, IonModal, RefresherCustomEvent } from '@ionic/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NurseApiService } from '../../core/services/nurse.service';
import { ProductTourService } from '../../core/services/product-tour.service';
import { Nurse, NurseService, ServiceCategory } from '../../core/models';

interface CategoryOption {
  value: ServiceCategory;
  label: string;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.page.html',
  standalone: false,
  styleUrls: ['./services.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesPage implements OnInit {
  @ViewChild('serviceModal') serviceModal!: IonModal;

  private nurseApi = inject(NurseApiService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  private destroyRef = inject(DestroyRef);
  private productTour = inject(ProductTourService);

  // State signals
  nurse = signal<Nurse | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  editingServiceId = signal<string | null>(null);

  // Form data
  serviceForm = signal<Partial<NurseService>>({
    name: '',
    description: '',
    category: 'other',
    price: 0,
    currency: 'PEN',
    durationMinutes: 30,
    isActive: true,
  });

  // Computed
  services = computed(() => this.nurse()?.services ?? []);
  activeServices = computed(() => this.services().filter(s => s.isActive));
  inactiveServices = computed(() => this.services().filter(s => !s.isActive));

  // Categories
  categories: CategoryOption[] = [
    { value: 'injection', label: 'Inyectables' },
    { value: 'wound_care', label: 'Curaciones' },
    { value: 'catheter', label: 'Sondas' },
    { value: 'vital_signs', label: 'Signos vitales' },
    { value: 'iv_therapy', label: 'Terapia IV' },
    { value: 'blood_draw', label: 'Toma de muestras' },
    { value: 'medication', label: 'Medicamentos' },
    { value: 'elderly_care', label: 'Adulto mayor' },
    { value: 'post_surgery', label: 'Post-operatorio' },
    { value: 'other', label: 'Otro' },
  ];

  ngOnInit() {
    this.loadProfile();
  }

  ionViewWillLeave() {
    // Stop any active tour when leaving to prevent freezing
    this.productTour.forceStop();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.nurseApi.getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nurse) => {
          this.nurse.set(nurse);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading profile:', err);
          this.showToast('Error al cargar servicios', 'danger');
          this.isLoading.set(false);
        },
      });
  }

  handleRefresh(event: RefresherCustomEvent) {
    this.nurseApi.getMyProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nurse) => {
          this.nurse.set(nurse);
          event.target.complete();
        },
        error: () => {
          event.target.complete();
          this.showToast('Error al actualizar', 'danger');
        },
      });
  }

  // Modal management
  openAddModal() {
    this.isEditMode.set(false);
    this.editingServiceId.set(null);
    this.serviceForm.set({
      name: '',
      description: '',
      category: 'other',
      price: 0,
      currency: 'PEN',
      durationMinutes: 30,
      isActive: true,
    });
    this.isModalOpen.set(true);
  }

  openEditModal(service: NurseService) {
    this.isEditMode.set(true);
    this.editingServiceId.set(service._id || null);
    this.serviceForm.set({
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      currency: service.currency,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
    });
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.serviceModal?.dismiss();
  }

  // Form field updates
  updateFormField(field: keyof NurseService, value: any) {
    this.serviceForm.update(form => ({ ...form, [field]: value }));
  }

  // Save service
  async saveService() {
    const form = this.serviceForm();

    // Validation
    if (!form.name?.trim()) {
      this.showToast('El nombre es requerido', 'warning');
      return;
    }
    if (!form.price || form.price <= 0) {
      this.showToast('El precio debe ser mayor a 0', 'warning');
      return;
    }
    if (!form.durationMinutes || form.durationMinutes < 15) {
      this.showToast('La duracion debe ser minimo 15 minutos', 'warning');
      return;
    }

    this.isSaving.set(true);

    if (this.isEditMode() && this.editingServiceId()) {
      // Update existing service
      this.nurseApi.updateService(this.editingServiceId()!, form).subscribe({
        next: (nurse) => {
          this.nurse.set(nurse);
          this.closeModal();
          this.showToast('Servicio actualizado', 'success');
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Error updating service:', err);
          const message = err?.error?.message || 'Error al actualizar servicio';
          this.showToast(Array.isArray(message) ? message[0] : message, 'danger');
          this.isSaving.set(false);
        },
      });
    } else {
      // Add new service
      const newService: Omit<NurseService, '_id'> = {
        name: form.name!.trim(),
        description: form.description || '',
        category: form.category as ServiceCategory,
        price: form.price!,
        currency: form.currency || 'PEN',
        durationMinutes: form.durationMinutes!,
        isActive: form.isActive ?? true,
      };

      this.nurseApi.addService(newService).subscribe({
        next: (nurse) => {
          this.nurse.set(nurse);
          this.closeModal();
          this.showToast('Servicio agregado', 'success');
          this.isSaving.set(false);
        },
        error: (err) => {
          console.error('Error adding service:', err);
          const message = err?.error?.message || 'Error al agregar servicio';
          this.showToast(Array.isArray(message) ? message[0] : message, 'danger');
          this.isSaving.set(false);
        },
      });
    }
  }

  // Toggle service active status
  toggleServiceStatus(service: NurseService) {
    if (!service._id) return;

    this.nurseApi.updateService(service._id, { isActive: !service.isActive }).subscribe({
      next: (nurse) => {
        this.nurse.set(nurse);
        this.showToast(
          service.isActive ? 'Servicio desactivado' : 'Servicio activado',
          'success'
        );
      },
      error: (err) => {
        console.error('Error toggling service:', err);
        this.showToast('Error al cambiar estado', 'danger');
      },
    });
  }

  // Delete service
  async confirmDeleteService(service: NurseService) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-danger',
      header: 'Eliminar servicio',
      message: `¿Estas seguro de eliminar "${service.name}"? Esta accion no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteService(service),
        },
      ],
    });
    await alert.present();
  }

  private deleteService(service: NurseService) {
    if (!service._id) return;

    this.nurseApi.removeService(service._id).subscribe({
      next: (nurse) => {
        this.nurse.set(nurse);
        this.showToast('Servicio eliminado', 'success');
      },
      error: (err) => {
        console.error('Error deleting service:', err);
        this.showToast('Error al eliminar servicio', 'danger');
      },
    });
  }

  // Helpers
  getCategoryLabel(category: ServiceCategory): string {
    const found = this.categories.find(c => c.value === category);
    return found?.label || category;
  }

  getCategoryIcon(category: ServiceCategory): string {
    const icons: Record<ServiceCategory, string> = {
      injection: 'medical-outline',
      wound_care: 'bandage-outline',
      catheter: 'water-outline',
      vital_signs: 'pulse-outline',
      iv_therapy: 'water-outline',
      blood_draw: 'flask-outline',
      medication: 'medkit-outline',
      elderly_care: 'heart-outline',
      post_surgery: 'fitness-outline',
      other: 'ellipsis-horizontal-outline',
    };
    return icons[category] || 'medical-outline';
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: color === 'danger' ? 4000 : 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
