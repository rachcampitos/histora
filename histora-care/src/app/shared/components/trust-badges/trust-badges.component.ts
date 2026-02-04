import { Component, Input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

export interface TrustBadgeData {
  cepVerified?: boolean;
  cepHabil?: boolean;
  identityVerified?: boolean;
  totalServices?: number;
  averageRating?: number;
  verificationStatus?: string;
}

export interface Badge {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-trust-badges',
  templateUrl: './trust-badges.component.html',
  styleUrls: ['./trust-badges.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrustBadgesComponent {
  @Input() data: TrustBadgeData = {};
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() showLabels = true;
  @Input() maxBadges = 4;

  // All possible badges
  private readonly allBadges: Record<string, Badge> = {
    cep_habil: {
      id: 'cep_habil',
      label: 'CEP Habil',
      icon: 'shield-checkmark',
      color: '#22c55e', // Green
      description: 'Colegiatura verificada y HABIL en CEP',
    },
    identity_verified: {
      id: 'identity_verified',
      label: 'Verificada',
      icon: 'person-circle',
      color: '#3b82f6', // Blue
      description: 'Identidad verificada por NurseLite',
    },
    experienced: {
      id: 'experienced',
      label: 'Experta',
      icon: 'ribbon',
      color: '#f59e0b', // Yellow/Amber
      description: 'Mas de 10 servicios completados',
    },
    top_rated: {
      id: 'top_rated',
      label: 'Top Rated',
      icon: 'star',
      color: '#eab308', // Gold
      description: 'Calificacion promedio 4.5+',
    },
  };

  // Compute active badges based on data
  badges = computed(() => {
    const active: Badge[] = [];

    // CEP Habil - Highest priority
    if (this.data.cepHabil || this.data.cepVerified) {
      active.push(this.allBadges['cep_habil']);
    }

    // Identity Verified
    if (this.data.identityVerified || this.data.verificationStatus === 'approved') {
      active.push(this.allBadges['identity_verified']);
    }

    // Experienced (10+ services)
    if (this.data.totalServices && this.data.totalServices >= 10) {
      active.push(this.allBadges['experienced']);
    }

    // Top Rated (4.5+)
    if (this.data.averageRating && this.data.averageRating >= 4.5) {
      active.push(this.allBadges['top_rated']);
    }

    return active.slice(0, this.maxBadges);
  });

  get hasBadges(): boolean {
    return this.badges().length > 0;
  }

  getBadgeStyle(badge: Badge): Record<string, string> {
    return {
      '--badge-color': badge.color,
      '--badge-bg': `${badge.color}15`,
    };
  }
}
