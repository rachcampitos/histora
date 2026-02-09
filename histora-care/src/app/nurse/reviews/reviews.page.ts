import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { NurseApiService } from '../../core/services/nurse.service';
import { AuthService } from '../../core/services/auth.service';
import { Nurse, NurseReview } from '../../core/models';
import { calculateNurseTier, NurseTierInfo } from '../../core/utils/nurse-tier.util';

interface RatingBar {
  stars: number;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-reviews',
  templateUrl: './reviews.page.html',
  standalone: false,
  styleUrls: ['./reviews.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewsPage implements OnInit {
  private nurseApi = inject(NurseApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  nurse = signal<Nurse | null>(null);
  reviews = signal<NurseReview[]>([]);
  total = signal(0);
  page = signal(1);
  isLoading = signal(true);
  isLoadingMore = signal(false);
  selectedRating = signal<number | null>(null);

  private readonly LIMIT = 10;

  rating = computed(() => this.nurse()?.averageRating ?? 0);
  totalReviews = computed(() => this.nurse()?.totalReviews ?? 0);
  totalServices = computed(() => this.nurse()?.totalServicesCompleted ?? 0);

  nurseTier = computed<NurseTierInfo>(() => {
    return calculateNurseTier({
      averageRating: this.rating(),
      totalServicesCompleted: this.totalServices(),
      totalReviews: this.totalReviews(),
    });
  });

  ratingDistribution = computed<RatingBar[]>(() => {
    const allReviews = this.reviews();
    const total = this.total();
    return [5, 4, 3, 2, 1].map(stars => {
      const count = allReviews.filter(r => Math.round(r.rating) === stars).length;
      return {
        stars,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  });

  hasMore = computed(() => this.reviews().length < this.total());

  ngOnInit() {
    this.loadNurseProfile();
  }

  private loadNurseProfile() {
    this.nurseApi.getMyProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (nurse) => {
        this.nurse.set(nurse);
        this.loadReviews();
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  loadReviews() {
    const nurseId = this.nurse()?._id;
    if (!nurseId) return;

    this.isLoading.set(true);
    this.page.set(1);
    this.reviews.set([]);

    this.nurseApi.getNurseReviews(nurseId, 1, this.LIMIT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reviews.set(response.reviews);
          this.total.set(response.total);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  loadMore(event: any) {
    const nurseId = this.nurse()?._id;
    if (!nurseId || !this.hasMore()) {
      event.target.complete();
      return;
    }

    const nextPage = this.page() + 1;
    this.isLoadingMore.set(true);

    this.nurseApi.getNurseReviews(nurseId, nextPage, this.LIMIT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.reviews.update(current => [...current, ...response.reviews]);
          this.page.set(nextPage);
          this.total.set(response.total);
          this.isLoadingMore.set(false);
          event.target.complete();
          if (!this.hasMore()) {
            event.target.disabled = true;
          }
        },
        error: () => {
          this.isLoadingMore.set(false);
          event.target.complete();
        },
      });
  }

  filterByRating(rating: number | null) {
    this.selectedRating.set(rating);
  }

  get filteredReviews(): NurseReview[] {
    const selected = this.selectedRating();
    if (selected === null) return this.reviews();
    return this.reviews().filter(r => Math.round(r.rating) === selected);
  }

  getStarsArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= Math.round(rating));
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = ['#4A90E2', '#7B68EE', '#50C878', '#FF6B6B', '#4ECDC4', '#4a9d9a'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  goBack() {
    this.router.navigate(['/nurse/dashboard']);
  }
}
