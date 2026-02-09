import { Component, OnInit, inject, signal, computed, input, Output, EventEmitter, effect, ChangeDetectionStrategy } from '@angular/core';

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
  section?: string;
}

@Component({
  selector: 'app-profile-checklist',
  templateUrl: './profile-checklist.component.html',
  styleUrls: ['./profile-checklist.component.scss'],
  standalone: true,
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileChecklistComponent implements OnInit {
  private static readonly DISMISSED_KEY = 'nurselite-checklist-dismissed';

  // Use signal-based input for reactivity with computed()
  nurse = input<Nurse | null>(null);
  @Output() dismissed = new EventEmitter<void>();

  private router = inject(Router);
  private onboardingService = inject(NurseOnboardingService);

  isMinimized = signal(false);
  isVisible = signal(false); // Start hidden to prevent flickering
  private hasInitialized = signal(false);

  // Note: paymentMethods is configured during onboarding, so not included here
  checklistItems = computed<ChecklistItem[]>(() => {
    const nurse = this.nurse();
    return [
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
        section: 'availability',
      },
      {
        id: 'bio',
        label: 'Completa tu biografia',
        completed: !!(nurse?.bio && nurse.bio.trim().length > 0),
        route: '/nurse/profile',
        icon: 'document-text-outline',
        section: 'bio',
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

  // Verification status computed values
  verificationStatus = computed(() => {
    return this.nurse()?.verificationStatus || 'pending';
  });

  isVerified = computed(() => {
    return this.verificationStatus() === 'approved';
  });

  // Dynamic completion message based on verification status
  completionTitle = computed(() => {
    const status = this.verificationStatus();
    if (status === 'approved') {
      return 'Perfil completado';
    } else if (status === 'under_review') {
      return 'Perfil listo';
    } else {
      return 'Casi lista';
    }
  });

  completionMessage = computed(() => {
    const status = this.verificationStatus();
    if (status === 'approved') {
      return 'Estas lista para recibir solicitudes';
    } else if (status === 'under_review') {
      return 'Tu verificacion esta en proceso (24-48 hrs)';
    } else if (status === 'rejected') {
      return 'Revisa tu verificacion para recibir solicitudes';
    } else {
      return 'Completa tu verificacion para activarte';
    }
  });

  completionIcon = computed(() => {
    const status = this.verificationStatus();
    if (status === 'approved') {
      return 'checkmark-circle';
    } else if (status === 'under_review') {
      return 'time';
    } else {
      return 'alert-circle';
    }
  });

  completionIconColor = computed(() => {
    const status = this.verificationStatus();
    if (status === 'approved') {
      return 'success';
    } else if (status === 'under_review') {
      return 'primary';
    } else {
      return 'warning';
    }
  });

  constructor() {
    // Effect to handle visibility when nurse data changes
    effect(() => {
      const nurse = this.nurse();
      const allCompleted = this.isAllCompleted();
      const verified = this.isVerified();

      // Only show once we have nurse data
      if (nurse && !this.hasInitialized()) {
        this.hasInitialized.set(true);

        // If already completed + verified + previously dismissed, stay hidden
        if (allCompleted && verified && this.wasDismissed()) {
          return;
        }

        // Show the checklist after a brief delay to prevent flickering
        setTimeout(() => {
          this.isVisible.set(true);
        }, 100);
      }

      // Auto-hide completed state after delay and persist dismissal
      if (nurse && allCompleted && verified && this.hasInitialized()) {
        setTimeout(() => {
          this.isVisible.set(false);
          this.persistDismissed();
        }, 5000);
      }
    });
  }

  ngOnInit() {
    this.onboardingService.init();
  }

  toggleMinimize() {
    this.isMinimized.set(!this.isMinimized());
  }

  goToItem(item: ChecklistItem) {
    const queryParams = item.section ? { section: item.section } : undefined;
    this.router.navigate([item.route], { queryParams });
  }

  dismiss() {
    this.isVisible.set(false);
    if (this.isAllCompleted() && this.isVerified()) {
      this.persistDismissed();
    }
    this.dismissed.emit();
  }

  private wasDismissed(): boolean {
    try {
      return localStorage.getItem(ProfileChecklistComponent.DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private persistDismissed(): void {
    try {
      localStorage.setItem(ProfileChecklistComponent.DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  }
}
