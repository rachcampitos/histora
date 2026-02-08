import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NurseSearchResult } from '../../../core/models';
import { ThemeService } from '../../../core/services/theme.service';
import { getSpecialtyConfig, getSpecialtyColors } from '../../config/specialty-chips.config';

@Component({
  selector: 'app-nurse-list-modal',
  standalone: true,
  imports: [IonicModule, ScrollingModule],
  templateUrl: './nurse-list-modal.component.html',
  styleUrls: ['./nurse-list-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NurseListModalComponent {
  @Input() nurses: NurseSearchResult[] = [];

  private themeService = inject(ThemeService);

  constructor(private modalCtrl: ModalController) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  selectNurse(nurse: NurseSearchResult) {
    this.modalCtrl.dismiss({ action: 'select', nurse });
  }

  viewProfile(nurseId: string) {
    this.modalCtrl.dismiss({ action: 'viewProfile', nurseId });
  }

  requestService(nurseId: string) {
    this.modalCtrl.dismiss({ action: 'requestService', nurseId });
  }

  getRatingStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  getMinPrice(services: any[]): number {
    if (!services || services.length === 0) return 0;
    return Math.min(...services.map(s => s.price || 0));
  }

  getChipIcon(specialty: string): string {
    return getSpecialtyConfig(specialty).icon;
  }

  getChipStyle(specialty: string): Record<string, string> {
    const config = getSpecialtyConfig(specialty);
    const colors = getSpecialtyColors(config.family, this.themeService.isDarkMode());
    return {
      'background': colors.bg,
      'color': colors.text,
    };
  }
}
