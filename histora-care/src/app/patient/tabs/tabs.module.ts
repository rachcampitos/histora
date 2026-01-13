import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TabsRoutingModule } from './tabs-routing.module';
import { TabsPage } from './tabs.page';
import { AIAssistantComponent } from '../../shared/components/ai-assistant/ai-assistant.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    TabsRoutingModule,
    AIAssistantComponent, // Standalone component
  ],
  declarations: [TabsPage],
})
export class TabsPageModule {}
