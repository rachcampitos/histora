import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { IonicModule, ModalController } from '@ionic/angular';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NurseSearchResult } from '../../../core/models';

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
}
