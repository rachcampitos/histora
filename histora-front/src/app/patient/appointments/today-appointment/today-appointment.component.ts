import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
    selector: 'app-today-appointment',
    templateUrl: './today-appointment.component.html',
    styleUrls: ['./today-appointment.component.scss'],
    imports: [
        BreadcrumbComponent,
        MatButtonModule,
        MatIconModule,
        TranslateModule,
    ]
})
export class TodayAppointmentComponent {
  constructor() {
    // constructor code
  }
}
