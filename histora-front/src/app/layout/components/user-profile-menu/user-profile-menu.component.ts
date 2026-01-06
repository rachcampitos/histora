
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { FeatherIconsComponent } from '@shared/components/feather-icons/feather-icons.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-user-profile-menu',
  templateUrl: './user-profile-menu.component.html',
  styleUrls: ['./user-profile-menu.component.scss'],
  imports: [
    MatMenuModule,
    FeatherIconsComponent,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
})
export class UserProfileMenuComponent {
  @Input() userName: string = '';
  @Input() userImg?: string;

  @Output() accountClicked = new EventEmitter<void>();
  @Output() inboxClicked = new EventEmitter<void>();
  @Output() settingsClicked = new EventEmitter<void>();
  @Output() logoutClicked = new EventEmitter<void>();

  onAccountClick() {
    this.accountClicked.emit();
  }
  onInboxClick() {
    this.inboxClicked.emit();
  }
  onSettingsClick() {
    this.settingsClicked.emit();
  }
  onLogoutClick() {
    this.logoutClicked.emit();
  }
}
