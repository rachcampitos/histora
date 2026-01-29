import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, AdminUser, CreateUserDto, UpdateUserDto } from '@core/service/admin.service';

export interface UserFormDialogData {
  mode: 'create' | 'edit' | 'view';
  user?: AdminUser;
  roleOptions: { value: string; label: string }[];
}

@Component({
  standalone: true,
  selector: 'app-user-form-dialog',
  template: `
    <h2 mat-dialog-title>
      @switch (data.mode) {
        @case ('create') { Crear Usuario }
        @case ('edit') { Editar Usuario }
        @case ('view') { Detalle de Usuario }
      }
    </h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="user-form">
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="firstName" [readonly]="data.mode === 'view'">
            @if (form.get('firstName')?.hasError('required') && form.get('firstName')?.touched) {
              <mat-error>El nombre es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="lastName" [readonly]="data.mode === 'view'">
            @if (form.get('lastName')?.hasError('required') && form.get('lastName')?.touched) {
              <mat-error>El apellido es requerido</mat-error>
            }
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" [readonly]="data.mode === 'view'">
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>El email es requerido</mat-error>
          }
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <mat-error>Email no válido</mat-error>
          }
        </mat-form-field>

        @if (data.mode === 'create') {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input matInput formControlName="password" type="password">
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
            }
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>Mínimo 8 caracteres</mat-error>
            }
          </mat-form-field>
        }

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="phone" [readonly]="data.mode === 'view'">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Rol</mat-label>
            <mat-select formControlName="role" [disabled]="data.mode === 'view'">
              @for (role of data.roleOptions; track role.value) {
                <mat-option [value]="role.value">{{ role.label }}</mat-option>
              }
            </mat-select>
            @if (form.get('role')?.hasError('required') && form.get('role')?.touched) {
              <mat-error>El rol es requerido</mat-error>
            }
          </mat-form-field>
        </div>

        @if (data.mode === 'view' && data.user) {
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Estado:</span>
              <span class="badge" [class.badge-solid-green]="data.user.status === 'active'"
                    [class.badge-solid-gray]="data.user.status !== 'active'">
                {{ data.user.status === 'active' ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
            <div class="info-row">
              <span class="info-label">Proveedor:</span>
              <span>{{ data.user.authProvider === 'google' ? 'Google' : 'Local' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email verificado:</span>
              <span>{{ data.user.isEmailVerified ? 'Sí' : 'No' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Clínica:</span>
              <span>{{ data.user.clinic || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha registro:</span>
              <span>{{ data.user.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Último acceso:</span>
              <span>{{ data.user.lastLoginAt ? (data.user.lastLoginAt | date: 'dd/MM/yyyy HH:mm') : 'Nunca' }}</span>
            </div>
          </div>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button class="dialog-btn cancel-btn" (click)="onCancel()">
        {{ data.mode === 'view' ? 'Cerrar' : 'Cancelar' }}
      </button>
      @if (data.mode !== 'view') {
        <button class="dialog-btn primary-btn" (click)="onSubmit()" [disabled]="isSubmitting || form.invalid">
          @if (isSubmitting) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            {{ data.mode === 'create' ? 'Crear' : 'Guardar' }}
          }
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
      text-align: center;
      margin-bottom: 8px;
    }
    .user-form {
      min-width: 400px;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .form-row mat-form-field {
      flex: 1;
    }
    .full-width {
      width: 100%;
    }
    mat-form-field {
      margin-bottom: 8px;
    }
    mat-dialog-actions {
      padding: 16px 8px 8px !important;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }
    .dialog-btn {
      min-height: 44px;
      padding: 0 24px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 15px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .cancel-btn {
      background: #f1f5f9;
      color: #475569;
    }
    .cancel-btn:hover {
      background: #e2e8f0;
    }
    .primary-btn {
      background: linear-gradient(135deg, #4a9d9a 0%, #2d5f8a 100%);
      color: #ffffff;
    }
    .primary-btn:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(74, 157, 154, 0.4);
    }
    .primary-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .info-section {
      background: var(--bg-secondary, #f5f5f5);
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 500;
      color: var(--text-secondary, #666);
    }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }
    .badge-solid-green {
      background-color: #4caf50;
      color: white;
    }
    .badge-solid-gray {
      background-color: #9e9e9e;
      color: white;
    }

    /* Dark mode */
    :host-context(body.dark) {
      h2[mat-dialog-title] {
        color: #f1f5f9;
      }
      .cancel-btn {
        background: #334155;
        color: #f1f5f9;
      }
      .cancel-btn:hover {
        background: #475569;
      }
      .info-section {
        background: #334155;
      }
      .info-row {
        border-color: #475569;
      }
      .info-label {
        color: #94a3b8;
      }
    }
  `],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
  ],
})
export class UserFormDialogComponent implements OnInit {
  data = inject<UserFormDialogData>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<UserFormDialogComponent>);
  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);

  form!: FormGroup;
  isSubmitting = false;

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    const user = this.data.user;

    this.form = this.fb.group({
      firstName: [user?.firstName || '', Validators.required],
      lastName: [user?.lastName || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
      phone: [user?.phone || ''],
      role: [user?.role || '', Validators.required],
      password: [''],
    });

    if (this.data.mode === 'create') {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    if (this.data.mode === 'create') {
      const createDto: CreateUserDto = {
        email: this.form.value.email,
        password: this.form.value.password,
        firstName: this.form.value.firstName,
        lastName: this.form.value.lastName,
        phone: this.form.value.phone || undefined,
        role: this.form.value.role,
      };

      this.adminService.createUser(createDto).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error creating user:', err);
          this.isSubmitting = false;
        },
      });
    } else if (this.data.mode === 'edit' && this.data.user) {
      const updateDto: UpdateUserDto = {
        firstName: this.form.value.firstName,
        lastName: this.form.value.lastName,
        email: this.form.value.email,
        phone: this.form.value.phone || undefined,
        role: this.form.value.role,
      };

      this.adminService.updateUser(this.data.user.id, updateDto).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error updating user:', err);
          this.isSubmitting = false;
        },
      });
    }
  }
}
