import { Component, EventEmitter, Output, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { PatientVerificationService, EmergencyContact } from '../../../../core/services/patient-verification.service';

@Component({
  selector: 'app-emergency-contact-step',
  templateUrl: './emergency-contact-step.component.html',
  standalone: false,
  styleUrls: ['./emergency-contact-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmergencyContactStepComponent {
  @Output() completed = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private verificationService = inject(PatientVerificationService);
  private fb = inject(FormBuilder);

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Form
  form: FormGroup;

  // Relationship options
  relationships = [
    'Madre',
    'Padre',
    'Esposo/a',
    'Hijo/a',
    'Hermano/a',
    'Familiar',
    'Amigo/a',
    'Vecino/a',
    'Otro'
  ];

  constructor() {
    this.form = this.fb.group({
      contacts: this.fb.array([
        this.createContactGroup(),
        this.createContactGroup()
      ])
    });
  }

  get contacts(): FormArray {
    return this.form.get('contacts') as FormArray;
  }

  get canSubmit(): boolean {
    return this.form.valid && this.contacts.length >= 2;
  }

  get canAddMore(): boolean {
    return this.contacts.length < 5;
  }

  private createContactGroup(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^9\d{8}$/)]],
      relationship: ['', Validators.required]
    });
  }

  formatPhone(index: number, event: any) {
    const value = event.target.value.replace(/\D/g, '').slice(0, 9);
    this.contacts.at(index).get('phone')?.setValue(value);
  }

  addContact() {
    if (this.canAddMore) {
      this.contacts.push(this.createContactGroup());
    }
  }

  async removeContact(index: number) {
    if (this.contacts.length <= 2) {
      await this.showToast('Debes tener al menos 2 contactos de emergencia', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar contacto',
      message: '¿Estas seguro de eliminar este contacto?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.contacts.removeAt(index);
          }
        }
      ]
    });
    await alert.present();
  }

  async submitContacts() {
    if (!this.canSubmit) {
      this.markFormAsTouched();
      this.error.set('Por favor completa todos los campos requeridos');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    const loading = await this.loadingCtrl.create({
      message: 'Guardando contactos...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const contacts: EmergencyContact[] = this.contacts.value.map((c: any) => ({
        name: c.name.trim(),
        phone: this.verificationService.formatPhoneNumber(c.phone),
        relationship: c.relationship
      }));

      await this.verificationService.setEmergencyContacts({ contacts }).toPromise();

      await this.showToast('Contactos guardados correctamente', 'success');
      this.completed.emit();
    } catch (err: any) {
      console.error('Error saving contacts:', err);
      this.error.set(err?.error?.message || 'Error al guardar los contactos');
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  private markFormAsTouched() {
    this.contacts.controls.forEach(group => {
      Object.keys((group as FormGroup).controls).forEach(key => {
        (group as FormGroup).get(key)?.markAsTouched();
      });
    });
  }

  getFieldError(index: number, field: string): string | null {
    const control = this.contacts.at(index).get(field);
    if (!control?.touched || !control?.errors) return null;

    if (control.errors['required']) return 'Campo requerido';
    if (control.errors['minlength']) return 'Nombre muy corto';
    if (control.errors['pattern']) return 'Numero invalido (9 digitos)';

    return null;
  }

  goBack() {
    this.back.emit();
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
