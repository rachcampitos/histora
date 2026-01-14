import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  standalone: false,
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage {
  // Disable AI assistant in production for now
  showAIAssistant = !environment.production;
}
