import { Component, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import * as L from 'leaflet';
import { GeolocationService } from '../../core/services/geolocation.service';
import { NurseApiService } from '../../core/services/nurse.service';
import { NurseSearchResult } from '../../core/models';

// Fix Leaflet default marker icon path issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/leaflet/marker-icon-2x.png',
  iconUrl: 'assets/leaflet/marker-icon.png',
  shadowUrl: 'assets/leaflet/marker-shadow.png',
});

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  standalone: false,
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private geolocationService = inject(GeolocationService);
  private nurseService = inject(NurseApiService);

  private map: L.Map | null = null;
  private userMarker: L.Marker | null = null;
  private nurseMarkers: L.Marker[] = [];

  // User location
  userLat = -12.0464; // Default: Lima, Peru
  userLng = -77.0428;
  searchRadius = 10; // km

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

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    // Initialize map centered on Lima
    this.map = L.map('map', {
      center: [this.userLat, this.userLng],
      zoom: 14,
      zoomControl: false
    });

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);
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
      this.map?.setView([this.userLat, this.userLng], 15);

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

      // Still search with default location
      await this.searchNearbyNurses();
    } finally {
      await loading.dismiss();
    }
  }

  private updateUserMarker() {
    if (!this.map) return;

    // Remove existing marker
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    // Create custom user icon
    const userIcon = L.divIcon({
      className: 'user-marker',
      html: '<div class="user-marker-inner"><ion-icon name="location"></ion-icon></div>',
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    this.userMarker = L.marker([this.userLat, this.userLng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('<strong>Tu ubicación</strong>');
  }

  async searchNearbyNurses() {
    this.isSearching = true;

    try {
      const results = await this.nurseService.searchNearby({
        latitude: this.userLat,
        longitude: this.userLng,
        radiusKm: this.searchRadius,
        category: (this.selectedCategory as any) || undefined,
        availableNow: true
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
      this.isSearching = false;
    }
  }

  private updateNurseMarkers() {
    if (!this.map) return;

    // Clear existing markers
    this.nurseMarkers.forEach(marker => this.map?.removeLayer(marker));
    this.nurseMarkers = [];

    // Add markers for each nurse
    this.nearbyNurses.forEach(result => {
      const nurse = result.nurse;
      if (!nurse.location?.coordinates) return;

      const [lng, lat] = nurse.location.coordinates;

      // Create custom nurse icon
      const nurseIcon = L.divIcon({
        className: 'nurse-marker',
        html: `<div class="nurse-marker-inner">
          <ion-icon name="medkit"></ion-icon>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });

      const marker = L.marker([lat, lng], { icon: nurseIcon })
        .addTo(this.map!)
        .on('click', () => this.selectNurse(result));

      // Add popup with nurse info
      const popupContent = `
        <div class="nurse-popup">
          <strong>${nurse.user?.firstName || 'Enfermera'} ${nurse.user?.lastName || ''}</strong>
          <p>${result.distance.toFixed(1)} km de distancia</p>
          <p>Rating: ${nurse.averageRating.toFixed(1)} (${nurse.totalReviews} reseñas)</p>
        </div>
      `;
      marker.bindPopup(popupContent);

      this.nurseMarkers.push(marker);
    });

    // Fit bounds to show all markers if there are any
    if (this.nurseMarkers.length > 0 && this.userMarker) {
      const group = L.featureGroup([this.userMarker, ...this.nurseMarkers]);
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  selectNurse(result: NurseSearchResult) {
    this.selectedNurse = result;
  }

  closeNurseCard() {
    this.selectedNurse = null;
  }

  viewNurseProfile(nurseId: string) {
    this.router.navigate(['/patient/search'], { queryParams: { nurseId } });
  }

  requestService(nurseId: string) {
    this.router.navigate(['/patient/request'], { queryParams: { nurseId } });
  }

  onCategoryChange() {
    this.searchNearbyNurses();
  }

  onRadiusChange() {
    this.searchNearbyNurses();
  }

  centerOnUser() {
    if (this.map && this.userLat && this.userLng) {
      this.map.setView([this.userLat, this.userLng], 15);
    }
  }

  refreshLocation() {
    this.getUserLocation();
  }
}
