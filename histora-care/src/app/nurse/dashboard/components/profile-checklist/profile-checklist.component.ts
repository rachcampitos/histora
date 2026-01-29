import { Component, OnInit, inject, signal, computed, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { NurseOnboardingService } from '../../../../core/services/nurse-onboarding.service';
import { Nurse } from '../../../../core/models';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-profile-checklist',
  templateUrl: './profile-checklist.component.html',
  styleUrls: ['./profile-checklist.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class ProfileChecklistComponent implements OnInit {
  @Input() nurse: Nurse | null = null;
  @Output() dismissed = new EventEmitter<void>();

  private router = inject(Router);
  private onboardingService = inject(NurseOnboardingService);

  isMinimized = signal(false);
  isVisible = signal(true);

  checklistItems = computed<ChecklistItem[]>(() => {
    const nurse = this.nurse;
    return [
      {
        id: 'paymentMethods',
        label: 'Configura metodos de pago',
        completed: !!(nurse?.yapeNumber || nurse?.plinNumber),
        route: '/nurse/profile',
        icon: 'wallet-outline',
      },
      {
        id: 'services',
        label: 'Agrega tus servicios',
        completed: (nurse?.services?.length ?? 0) > 0,
        route: '/nurse/services',
        icon: 'medical-outline',
      },
      {
        id: 'availability',
        label: 'Define tu disponibilidad',
        completed: !!(nurse?.availableFrom && nurse?.availableTo),
        route: '/nurse/profile',
        icon: 'calendar-outline',
      },
      {
        id: 'bio',
        label: 'Completa tu biografia',
        completed: !!(nurse?.bio && nurse.bio.length > 20),
        route: '/nurse/profile',
        icon: 'document-text-outline',
      },
    ];
  });

  completedCount = computed(() => {
    return this.checklistItems().filter(item => item.completed).length;
  });

  totalCount = computed(() => {
    return this.checklistItems().length;
  });

  progress = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  isAllCompleted = computed(() => {
    return this.completedCount() === this.totalCount();
  });

  ngOnInit() {
    this.onboardingService.init();

    // Check if all items are completed, hide checklist after a delay
    if (this.isAllCompleted()) {
      setTimeout(() => {
        this.isVisible.set(false);
      }, 3000);
    }
  }

  toggleMinimize() {
    this.isMinimized.set(!this.isMinimized());
  }

  goToItem(item: ChecklistItem) {
    this.router.navigate([item.route]);
  }

  dismiss() {
    this.isVisible.set(false);
    this.dismissed.emit();
  }
}
