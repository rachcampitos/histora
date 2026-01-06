import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-billing',
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.scss'],
    imports: [
        BreadcrumbComponent,
        MatButtonModule,
        MatIconModule,
        TranslateModule,
    ]
})
export class BillingComponent {
  constructor() {
    // constructor code
  }
}
