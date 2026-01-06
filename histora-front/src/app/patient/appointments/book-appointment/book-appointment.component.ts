import { Component } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { FileUploadComponent } from '@shared/components/file-upload/file-upload.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule } from '@ngx-translate/core';
@Component({
    selector: 'app-book-appointment',
    templateUrl: './book-appointment.component.html',
    styleUrls: ['./book-appointment.component.scss'],
    imports: [
        BreadcrumbComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        MatDatepickerModule,
        MatButtonToggleModule,
        FileUploadComponent,
        MatButtonModule,
        TranslateModule,
    ]
})
export class BookAppointmentComponent {
  bookingForm: UntypedFormGroup;
  hide3 = true;
  agree3 = false;
  isDisabled = true;
  constructor(private fb: UntypedFormBuilder) {
    this.bookingForm = this.fb.group({
      first: ['', [Validators.required, Validators.pattern('[a-zA-Z]+')]],
      last: [''],
      gender: ['', [Validators.required]],
      mobile: ['', [Validators.required]],
      address: [''],
      email: [
        '',
        [Validators.required, Validators.email, Validators.minLength(5)],
      ],
      dob: ['', [Validators.required]],
      doctor: ['', [Validators.required]],
      doa: ['', [Validators.required]],
      timeSlot: ['', [Validators.required]],
      injury: [''],
      note: [''],
      uploadFile: [''],
    });
  }
  onSubmit() {
    console.log('Form Value', this.bookingForm.value);
  }

  get f() {
    return this.bookingForm.controls;
  }
}
