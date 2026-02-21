import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { NurseApiService } from '../../core/services/nurse.service';
import { Nurse, NurseReview } from '../../core/models';
import { calculateNurseTier, NurseTierInfo } from '../../core/utils/nurse-tier.util';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  standalone: false,
  styleUrls: ['./search.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private nurseService = inject(NurseApiService);

  nurse = signal<Nurse | null>(null);
  reviews = signal<NurseReview[]>([]);
  isLoading = signal(true);
  isLoadingReviews = signal(false);
  error = signal<string | null>(null);
  showAllReviews = signal(false);
  private origin = signal<string | null>(null);

  nurseTierInfo = computed<NurseTierInfo | null>(() => {
    const n = this.nurse();
    if (!n) return null;
    return calculateNurseTier({
      totalServicesCompleted: n.totalServicesCompleted || 0,
      averageRating: n.averageRating || 0,
      totalReviews: n.totalReviews || 0,
    });
  });

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const nurseId = params['nurseId'];
      const origin = params['origin'];
      if (origin) {
        this.origin.set(origin);
      }
      if (nurseId) {
        this.loadNurseProfile(nurseId);
      } else {
        this.error.set('No se especificó una enfermera');
        this.isLoading.set(false);
      }
    });
  }

  async loadNurseProfile(nurseId: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando perfil...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const nurse = await this.nurseService.getNurse(nurseId).toPromise();
      this.nurse.set(nurse || null);
      this.error.set(null);

      // Load reviews after nurse profile
      this.loadReviews(nurseId);
    } catch (err) {
      console.error('Error loading nurse:', err);
      this.error.set('No se pudo cargar el perfil de la enfermera');
      const toast = await this.toastCtrl.create({
        message: 'Error al cargar el perfil',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isLoading.set(false);
      await loading.dismiss();
    }
  }

  async loadReviews(nurseId: string) {
    this.isLoadingReviews.set(true);
    try {
      const response = await this.nurseService.getNurseReviews(nurseId, 1, 3).toPromise();
      this.reviews.set(response?.reviews || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
      this.reviews.set([]);
    } finally {
      this.isLoadingReviews.set(false);
    }
  }

  toggleShowAllReviews() {
    this.showAllReviews.set(!this.showAllReviews());
  }

  viewAllReviews() {
    const nurseData = this.nurse();
    if (nurseData) {
      this.router.navigate(['/nurse', nurseData._id, 'reviews']);
    }
  }

  getDisplayedReviews(): NurseReview[] {
    return this.reviews();
  }

  formatReviewDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `Hace ${diffDays} días`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
    } else {
      return d.toLocaleDateString('es-PE', { year: 'numeric', month: 'short' });
    }
  }

  goBack() {
    const originValue = this.origin();
    switch (originValue) {
      case 'map':
        this.router.navigate(['/patient/tabs/map']);
        break;
      case 'browse':
        this.router.navigate(['/browse']);
        break;
      case 'home':
      default:
        this.router.navigate(['/patient/tabs/home']);
        break;
    }
  }

  requestService() {
    const nurseData = this.nurse();
    if (nurseData) {
      this.router.navigate(['/patient/request'], {
        queryParams: { nurseId: nurseData._id }
      });
    }
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      injection: 'Inyecciones',
      wound_care: 'Curaciones',
      catheter: 'Catéter/Sonda',
      vital_signs: 'Signos Vitales',
      iv_therapy: 'Terapia IV',
      blood_draw: 'Toma de Sangre',
      medication: 'Medicación',
      elderly_care: 'Cuidado Adulto Mayor',
      post_surgery: 'Post-Operatorio',
      other: 'Otro'
    };
    return labels[category] || category;
  }

  formatPrice(price: number, currency: string = 'PEN'): string {
    return currency === 'PEN' ? `S/ ${price.toFixed(2)}` : `${currency} ${price.toFixed(2)}`;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  getStars(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i < Math.round(rating) ? 1 : 0);
  }

  async showCepExplanation() {
    const alert = await this.alertCtrl.create({
      header: 'CEP Verificado',
      subHeader: 'Garantia de profesionalismo',
      message: `
        <div class="cep-explanation">
          <div class="cep-icon-header">
            <div class="cep-icon-circle">
              <ion-icon name="shield-checkmark"></ion-icon>
            </div>
          </div>
          <p><strong>CEP</strong> = Colegio de Enfermeros del Peru</p>
          <p>Todas las enfermeras en NurseLite estan verificadas directamente con el CEP, garantizando:</p>
          <ul>
            <li><strong>Titulo profesional valido</strong> - Licenciatura en enfermeria</li>
            <li><strong>Colegiatura activa</strong> - Habilitada para ejercer</li>
            <li><strong>Estado HABIL</strong> - Sin sanciones ni inhabilitaciones</li>
          </ul>
          <p class="cep-trust">Tu seguridad es nuestra prioridad. Solo trabajamos con profesionales 100% verificados.</p>
        </div>
      `,
      buttons: ['Entendido'],
      cssClass: 'cep-alert'
    });
    await alert.present();
  }
}
