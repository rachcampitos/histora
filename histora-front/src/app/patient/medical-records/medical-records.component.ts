import { Component } from '@angular/core';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-medical-records',
    templateUrl: './medical-records.component.html',
    styleUrls: ['./medical-records.component.scss'],
    imports: [BreadcrumbComponent, TranslateModule]
})
export class MedicalRecordsComponent {
  constructor() {
    // constructor code
  }
}
