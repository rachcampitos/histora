export type NurseTier = 'certified' | 'outstanding' | 'experienced' | 'elite';

export interface NurseTierInfo {
  tier: NurseTier;
  label: string;
  color: string;
  darkColor: string;
  icon: string;
  glowColor: string;
}

export interface NurseTierStats {
  totalServicesCompleted: number;
  averageRating: number;
  totalReviews: number;
}

export interface NextTierInfo {
  label: string;
  servicesNeeded: number;
  ratingNeeded: number;
  reviewsNeeded: number;
}

const TIERS: Record<NurseTier, NurseTierInfo> = {
  elite: {
    tier: 'elite',
    label: 'Elite',
    color: '#FFD700',
    darkColor: '#FFD700',
    icon: 'trophy',
    glowColor: 'rgba(255, 215, 0, 0.4)',
  },
  experienced: {
    tier: 'experienced',
    label: 'Experimentada',
    color: '#7B68EE',
    darkColor: '#9B8AFE',
    icon: 'ribbon',
    glowColor: 'rgba(123, 104, 238, 0.3)',
  },
  outstanding: {
    tier: 'outstanding',
    label: 'Destacada',
    color: '#2d5f8a',
    darkColor: '#5a9fd4',
    icon: 'star',
    glowColor: 'rgba(45, 95, 138, 0.3)',
  },
  certified: {
    tier: 'certified',
    label: 'Certificada',
    color: '#94a3b8',
    darkColor: '#94a3b8',
    icon: 'checkmark-circle',
    glowColor: 'rgba(148, 163, 184, 0.2)',
  },
};

export function calculateNurseTier(stats: NurseTierStats): NurseTierInfo {
  const { totalServicesCompleted, averageRating, totalReviews } = stats;

  if (totalServicesCompleted >= 50 && averageRating >= 4.7 && totalReviews >= 20) {
    return TIERS.elite;
  }
  if (totalServicesCompleted >= 30 && averageRating >= 4.5 && totalReviews >= 10) {
    return TIERS.experienced;
  }
  if (totalServicesCompleted >= 10 && averageRating >= 4.0) {
    return TIERS.outstanding;
  }
  return TIERS.certified;
}

export function getNextTierInfo(currentTier: NurseTier, stats: NurseTierStats): NextTierInfo | null {
  switch (currentTier) {
    case 'elite':
      return null;
    case 'experienced':
      return {
        label: 'Elite',
        servicesNeeded: Math.max(0, 50 - stats.totalServicesCompleted),
        ratingNeeded: Math.max(0, +(4.7 - stats.averageRating).toFixed(1)),
        reviewsNeeded: Math.max(0, 20 - stats.totalReviews),
      };
    case 'outstanding':
      return {
        label: 'Experimentada',
        servicesNeeded: Math.max(0, 30 - stats.totalServicesCompleted),
        ratingNeeded: Math.max(0, +(4.5 - stats.averageRating).toFixed(1)),
        reviewsNeeded: Math.max(0, 10 - stats.totalReviews),
      };
    case 'certified':
      return {
        label: 'Destacada',
        servicesNeeded: Math.max(0, 10 - stats.totalServicesCompleted),
        ratingNeeded: Math.max(0, +(4.0 - stats.averageRating).toFixed(1)),
        reviewsNeeded: 0,
      };
    default:
      return null;
  }
}
