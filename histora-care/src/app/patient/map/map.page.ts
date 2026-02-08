import { Component, OnInit, OnDestroy, inject, AfterViewInit, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import { GeolocationService } from '../../core/services/geolocation.service';
import { MapboxService } from '../../core/services/mapbox.service';
import { NurseApiService } from '../../core/services/nurse.service';
import { ThemeService } from '../../core/services/theme.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { NurseSearchResult } from '../../core/models';
import { NurseListModalComponent } from '../../shared/components/nurse-list-modal/nurse-list-modal.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  standalone: false,
  styleUrls: ['./map.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private geolocationService = inject(GeolocationService);
  private nurseService = inject(NurseApiService);
  private mapboxService = inject(MapboxService);
  private themeService = inject(ThemeService);
  private webSocketService = inject(WebSocketService);
  private authService = inject(AuthService);

  private mapInitialized = false;
  private isClosing = false; // Flag to prevent infinite close loops

  constructor() {
    // React to theme changes
    effect(() => {
      const isDark = this.themeService.isDarkMode();
      if (this.mapInitialized) {
        this.mapboxService.setStyle(isDark ? 'dark' : 'streets');
      }
    });

    // React to nurse availability changes - refresh map search
    effect(() => {
      const changed = this.webSocketService.nurseAvailabilityChanged();
      if (changed && this.mapInitialized) {
        this.searchNearbyNurses();
      }
    });
  }

  // User location [lng, lat] format for Mapbox
  userLng = -77.0428;
  userLat = -12.0464; // Default: Lima, Peru
  searchRadius = 10; // km

  // Search results
  nearbyNurses: NurseSearchResult[] = [];
  selectedNurse: NurseSearchResult | null = null;
  isSearching = signal(false);

  // Filter options
  selectedCategory = '';
  categories = [
    { value: '', label: 'Todos los servicios' },
    { value: 'injection', label: 'Inyecciones' },
    { value: 'wound_care', label: 'Curaciones' },
    { value: 'catheter', label: 'Catéter/Sonda' },
    { value: 'vital_signs', label: 'Signos Vitales' },
    { value: 'iv_therapy', label: 'Terapia IV' },
    { value: 'blood_draw', label: 'Toma de Sangre' },
    { value: 'medication', label: 'Medicación' },
    { value: 'elderly_care', label: 'Cuidado Adulto Mayor' },
    { value: 'post_surgery', label: 'Post-Operatorio' },
  ];

  ngOnInit() {}

  async ngAfterViewInit() {
    // Wait for view to be ready
    setTimeout(() => {
      this.initMap();
      this.getUserLocation();
    }, 100);
  }

  /**
   * Called every time the view enters (including when returning from other tabs)
   */
  async ionViewDidEnter() {
    const mapContainer = document.getElementById('map');
    const currentMap = this.mapboxService.getMap();

    // If the map was destroyed externally (e.g. tracking page), reset flag
    if (!currentMap && this.mapInitialized) {
      this.mapInitialized = false;
    }

    if (mapContainer && !this.mapInitialized) {
      setTimeout(() => {
        this.initMap();
        this.getUserLocation();
      }, 100);
    } else if (currentMap) {
      setTimeout(() => currentMap.resize(), 100);
    }

    // Connect to WebSocket and join map room for real-time updates
    if (!this.webSocketService.connected) {
      const token = await this.authService.getToken();
      if (token) {
        this.webSocketService.connect(token);
      }
    }
    this.webSocketService.joinMapRoom();
  }

  ionViewDidLeave() {
    this.webSocketService.leaveMapRoom();
  }

  ngOnDestroy() {
    this.mapInitialized = false;
    this.mapboxService.destroy();
  }

  private initMap() {
    if (this.mapInitialized) return;

    try {
      // Use ThemeService to determine initial map style
      const isDarkMode = this.themeService.isDarkMode();
      const mapStyle = isDarkMode
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12';

      this.mapboxService.initMap({
        container: 'map',
        center: [this.userLng, this.userLat],
        zoom: 14,
        style: mapStyle
      });
      this.mapInitialized = true;

      // Theme changes are handled by the effect in constructor
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  async getUserLocation() {
    const loading = await this.loadingCtrl.create({
      message: 'Obteniendo ubicación...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const position = await this.geolocationService.getCurrentPosition();
      this.userLat = position.latitude;
      this.userLng = position.longitude;

      // Update map view
      this.mapboxService.centerOn([this.userLng, this.userLat], 15);

      // Add/update user marker
      this.updateUserMarker();

      // Search for nearby nurses
      await this.searchNearbyNurses();
    } catch (error) {
      console.error('Error getting location:', error);
      const toast = await this.toastCtrl.create({
        message: 'No se pudo obtener tu ubicación. Usando ubicación por defecto.',
        duration: 3000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();

      // Add marker at default location
      this.updateUserMarker();

      // Still search with default location
      await this.searchNearbyNurses();
    } finally {
      await loading.dismiss();
    }
  }

  private updateUserMarker() {
    // Create custom user marker element
    const userElement = this.createUserMarkerElement();

    // User marker is 40px with pulse, anchor center and offset popup above
    this.mapboxService.addMarker('user', [this.userLng, this.userLat], {
      element: userElement,
      anchor: 'center',
      popup: '<strong>Tu ubicación</strong>',
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
    this.isSearching.set(true);

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
          message: 'No se encontraron enfermeras disponibles en tu zona.',
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
      this.isSearching.set(false);
    }
  }

  private previousNurseCount = 0;

  private updateNurseMarkers() {
    // Clear ALL existing nurse markers (use previous count)
    for (let i = 0; i < Math.max(this.previousNurseCount, 20); i++) {
      this.mapboxService.removeMarker(`nurse-${i}`);
    }
    this.previousNurseCount = this.nearbyNurses.length;

    const allCoordinates: [number, number][] = [[this.userLng, this.userLat]];

    // Add markers for each nurse
    this.nearbyNurses.forEach((result, index) => {
      const nurse = result.nurse;
      if (!nurse.location?.coordinates) return;

      const [lng, lat] = nurse.location.coordinates;
      allCoordinates.push([lng, lat]);

      // Create custom nurse marker element
      const nurseElement = this.createNurseMarkerElement(result);

      // Use anchor 'center' for circular avatar markers
      // Popup offset [0, -30] positions it above the 44px marker
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

    // Fit bounds to show all markers if there are any
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

    // Add click handler
    el.addEventListener('click', () => {
      this.selectNurse(result);
    });

    return el;
  }

  selectNurse(result: NurseSearchResult) {
    this.selectedNurse = result;

    // Center map on selected nurse
    if (result.nurse.location?.coordinates) {
      const [lng, lat] = result.nurse.location.coordinates;
      this.mapboxService.centerOn([lng, lat], 16);
    }
  }

  closeNurseCard() {
    if (this.isClosing) return;
    this.isClosing = true;

    this.selectedNurse = null;
    this.mapboxService.closeAllPopups(); // Close any open Mapbox popups
    this.zoomOutToShowAllNurses();

    // Reset flag after a short delay
    setTimeout(() => this.isClosing = false, 100);
  }

  /**
   * Handle Mapbox popup close - also close the nurse card
   */
  private onMapboxPopupClose() {
    if (this.isClosing) return;
    this.isClosing = true;

    this.selectedNurse = null; // Close nurse card
    this.zoomOutToShowAllNurses();

    // Reset flag after a short delay
    setTimeout(() => this.isClosing = false, 100);
  }

  /**
   * Zoom out to show all nurses on the map
   */
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

  viewNurseProfile(nurseId: string) {
    // Navigate outside tabs to the nurse profile view with origin tracking
    this.router.navigate(['/patient/search'], { queryParams: { nurseId, origin: 'map' } });
  }

  requestService(nurseId: string) {
    // Navigate outside tabs to the request form
    this.router.navigate(['/patient/request'], { queryParams: { nurseId } });
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

  async viewNurseList() {
    const modal = await this.modalCtrl.create({
      component: NurseListModalComponent,
      componentProps: {
        nurses: this.nearbyNurses
      },
      // Use card modal style for better scroll support
      presentingElement: await this.modalCtrl.getTop() || undefined,
      canDismiss: true
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data) {
      switch (data.action) {
        case 'select':
          this.selectNurse(data.nurse);
          break;
        case 'viewProfile':
          this.viewNurseProfile(data.nurseId);
          break;
        case 'requestService':
          this.requestService(data.nurseId);
          break;
      }
    }
  }
}
