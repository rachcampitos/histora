import { Component, OnInit, OnDestroy, inject, AfterViewInit, effect, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { GeolocationService } from '../core/services/geolocation.service';
import { MapboxService } from '../core/services/mapbox.service';
import { NurseApiService } from '../core/services/nurse.service';
import { ThemeService } from '../core/services/theme.service';
import { AuthService } from '../core/services/auth.service';
import { NurseSearchResult, Nurse } from '../core/models';
import { calculateNurseTier, NurseTierInfo } from '../core/utils/nurse-tier.util';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  standalone: false,
  styleUrls: ['./browse.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrowsePage implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private geolocationService = inject(GeolocationService);
  private nurseService = inject(NurseApiService);
  private mapboxService = inject(MapboxService);
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);

  private mapInitialized = false;
  private isClosing = false;

  constructor() {
    effect(() => {
      const isDark = this.themeService.isDarkMode();
      if (this.mapInitialized) {
        this.mapboxService.setStyle(isDark ? 'dark' : 'streets');
      }
    });
  }

  // User location
  userLng = -77.0428;
  userLat = -12.0464; // Default: Lima, Peru
  searchRadius = 10;

  // Search results
  nearbyNurses: NurseSearchResult[] = [];
  selectedNurse: NurseSearchResult | null = null;
  isSearching = false;

  // Filter options
  selectedCategory = '';
  categories = [
    { value: '', label: 'Todos los servicios' },
    { value: 'injection', label: 'Inyecciones' },
    { value: 'wound_care', label: 'Curaciones' },
    { value: 'catheter', label: 'Sonda/Cateter' },
    { value: 'vital_signs', label: 'Signos Vitales' },
    { value: 'iv_therapy', label: 'Terapia IV' },
    { value: 'blood_draw', label: 'Toma de Sangre' },
    { value: 'medication', label: 'Medicacion' },
    { value: 'elderly_care', label: 'Cuidado Adulto Mayor' },
    { value: 'post_surgery', label: 'Post-Operatorio' },
  ];

  ngOnInit() {}

  async ngAfterViewInit() {
    setTimeout(() => {
      this.initMap();
      this.getUserLocation();
    }, 100);
  }

  ngOnDestroy() {
    this.mapboxService.destroy();
  }

  private initMap() {
    if (this.mapInitialized) return;

    try {
      const isDarkMode = this.themeService.isDarkMode();
      const mapStyle = isDarkMode
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12';

      this.mapboxService.initMap({
        container: 'browse-map',
        center: [this.userLng, this.userLat],
        zoom: 14,
        style: mapStyle
      });
      this.mapInitialized = true;
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  async getUserLocation() {
    const loading = await this.loadingCtrl.create({
      message: 'Obteniendo ubicacion...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const position = await this.geolocationService.getCurrentPosition();
      this.userLat = position.latitude;
      this.userLng = position.longitude;

      this.mapboxService.centerOn([this.userLng, this.userLat], 15);
      this.updateUserMarker();
      await this.searchNearbyNurses();
    } catch (error) {
      console.error('Error getting location:', error);
      const toast = await this.toastCtrl.create({
        message: 'No se pudo obtener tu ubicacion. Usando ubicacion por defecto.',
        duration: 3000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      this.updateUserMarker();
      await this.searchNearbyNurses();
    } finally {
      await loading.dismiss();
    }
  }

  private updateUserMarker() {
    const userElement = this.createUserMarkerElement();
    this.mapboxService.addMarker('user', [this.userLng, this.userLat], {
      element: userElement,
      anchor: 'center',
      popup: '<strong>Tu ubicacion</strong>',
      popupOffset: [0, -28]
    });
  }

  private createUserMarkerElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.innerHTML = `
      <div class="user-marker-pulse"></div>
      <div class="user-marker-icon">
        <ion-icon name="location"></ion-icon>
      </div>
    `;
    return el;
  }

  async searchNearbyNurses() {
    this.isSearching = true;

    try {
      const results = await this.nurseService.searchNearby({
        latitude: this.userLat,
        longitude: this.userLng,
        radiusKm: this.searchRadius,
        category: (this.selectedCategory as any) || undefined,
        availableNow: true // Only show nurses available right now (day + time)
      }).toPromise();

      this.nearbyNurses = results || [];
      this.updateNurseMarkers();

      if (this.nearbyNurses.length === 0) {
        const toast = await this.toastCtrl.create({
          message: 'No se encontraron enfermeras en tu zona.',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error searching nurses:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al buscar enfermeras cercanas.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isSearching = false;
    }
  }

  private previousNurseCount = 0;

  private updateNurseMarkers() {
    for (let i = 0; i < Math.max(this.previousNurseCount, 20); i++) {
      this.mapboxService.removeMarker(`nurse-${i}`);
    }
    this.previousNurseCount = this.nearbyNurses.length;

    const allCoordinates: [number, number][] = [[this.userLng, this.userLat]];

    this.nearbyNurses.forEach((result, index) => {
      const nurse = result.nurse;
      if (!nurse.location?.coordinates) return;

      const [lng, lat] = nurse.location.coordinates;
      allCoordinates.push([lng, lat]);

      const nurseElement = this.createNurseMarkerElement(result);

      this.mapboxService.addMarker(`nurse-${index}`, [lng, lat], {
        element: nurseElement,
        anchor: 'center',
        popup: `
          <div class="nurse-popup">
            <strong>${nurse.user?.firstName || 'Enfermera'} ${nurse.user?.lastName || ''}</strong>
            <p>${result.distance.toFixed(1)} km de distancia</p>
            <p>Rating: ${nurse.averageRating.toFixed(1)} (${nurse.totalReviews} reseñas)</p>
          </div>
        `,
        popupOffset: [0, -30],
        onPopupClose: () => this.onMapboxPopupClose()
      });
    });

    if (allCoordinates.length > 1) {
      this.mapboxService.fitBounds(allCoordinates, 60);
    }
  }

  private createNurseMarkerElement(result: NurseSearchResult): HTMLElement {
    const el = document.createElement('div');
    el.className = 'nurse-map-marker';

    const avatarUrl = result.nurse.user?.avatar || 'assets/img/default-avatar.png';
    const isAvailable = result.nurse.isAvailable;

    el.innerHTML = `
      <div class="nurse-marker-avatar ${isAvailable ? 'available' : ''}">
        <img src="${avatarUrl}" alt="${result.nurse.user?.firstName || 'Enfermera'}" onerror="this.src='assets/img/default-avatar.png'">
        ${isAvailable ? '<span class="availability-dot"></span>' : ''}
      </div>
    `;

    el.addEventListener('click', () => {
      this.selectNurse(result);
    });

    return el;
  }

  selectNurse(result: NurseSearchResult) {
    this.selectedNurse = result;

    if (result.nurse.location?.coordinates) {
      const [lng, lat] = result.nurse.location.coordinates;
      this.mapboxService.centerOn([lng, lat], 16);
    }
  }

  closeNurseCard() {
    if (this.isClosing) return;
    this.isClosing = true;

    this.selectedNurse = null;
    this.mapboxService.closeAllPopups();
    this.zoomOutToShowAllNurses();

    setTimeout(() => this.isClosing = false, 100);
  }

  private onMapboxPopupClose() {
    if (this.isClosing) return;
    this.isClosing = true;

    this.selectedNurse = null;
    this.zoomOutToShowAllNurses();

    setTimeout(() => this.isClosing = false, 100);
  }

  private zoomOutToShowAllNurses() {
    if (this.nearbyNurses.length > 0) {
      const allCoordinates: [number, number][] = [[this.userLng, this.userLat]];
      this.nearbyNurses.forEach(result => {
        if (result.nurse.location?.coordinates) {
          const [lng, lat] = result.nurse.location.coordinates;
          allCoordinates.push([lng, lat]);
        }
      });
      this.mapboxService.fitBounds(allCoordinates, 60);
    }
  }

  async viewNurseProfile(nurseId: string) {
    // Check if user is authenticated
    const isAuth = this.authService.isAuthenticated();
    if (isAuth) {
      this.router.navigate(['/patient/search'], { queryParams: { nurseId, origin: 'browse' } });
    } else {
      await this.promptRegistration('ver el perfil completo');
    }
  }

  async requestService(nurseId: string) {
    const isAuth = this.authService.isAuthenticated();
    if (isAuth) {
      this.router.navigate(['/patient/request'], { queryParams: { nurseId } });
    } else {
      await this.promptRegistration('solicitar un servicio');
    }
  }

  private async promptRegistration(action: string) {
    const alert = await this.alertCtrl.create({
      cssClass: 'histora-alert histora-alert-primary',
      header: 'Crea tu cuenta',
      message: `Para ${action}, necesitas una cuenta. El registro es rapido y gratuito.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Registrarme',
          handler: () => {
            this.router.navigate(['/auth/register'], { queryParams: { type: 'patient' } });
          }
        },
        {
          text: 'Ya tengo cuenta',
          handler: () => {
            this.router.navigate(['/auth/login']);
          }
        }
      ]
    });
    await alert.present();
  }

  onCategoryChange() {
    this.searchNearbyNurses();
  }

  onRadiusChange() {
    this.searchNearbyNurses();
  }

  centerOnUser() {
    this.mapboxService.centerOn([this.userLng, this.userLat], 15);
  }

  refreshLocation() {
    this.getUserLocation();
  }

  goToLanding() {
    this.router.navigate(['/onboarding/landing']);
  }

  goToRegister() {
    this.router.navigate(['/auth/register'], { queryParams: { type: 'patient' } });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  getNurseTier(nurse: Nurse): NurseTierInfo {
    return calculateNurseTier({
      totalServicesCompleted: nurse.totalServicesCompleted || 0,
      averageRating: nurse.averageRating || 0,
      totalReviews: nurse.totalReviews || 0,
    });
  }
}
