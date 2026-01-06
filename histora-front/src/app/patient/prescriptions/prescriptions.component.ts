import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-prescriptions',
    templateUrl: './prescriptions.component.html',
    styleUrls: ['./prescriptions.component.scss'],
    imports: [
        BreadcrumbComponent,
        MatButtonModule,
        MatIconModule,
        TranslateModule,
    ]
})
export class PrescriptionsComponent {
  constructor() {
    // constructor code
  }
}
