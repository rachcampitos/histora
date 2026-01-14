import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  standalone: false,
  styleUrls: ['./tabs.page.scss'],
})
export class TabsPage {
  // AI assistant disabled until ready for release
  showAIAssistant = false;
}
