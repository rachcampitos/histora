import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-form-dialog:not(p)',
    templateUrl: './form-dialog.component.html',
    styleUrls: ['./form-dialog.component.scss'],
    standalone: true,
    imports: [
      CommonModule,
      MatDialogModule,
      MatButtonModule,
      MatIconModule,
    ]
})
export class FormDialogComponent {
  constructor() {
    // constructor code
  }
}
