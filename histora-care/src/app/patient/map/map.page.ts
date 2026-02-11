import { Component, OnInit, OnDestroy, inject, AfterViewInit, effect, ChangeDetectionStrategy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController, ModalController } from '@ionic/angular';
import { GeolocationService } from '../../core/services/geolocation.service';
import { MapboxService } from '../../core/services/mapbox.service';
import { NurseApiService } from '../../core/services/nurse.service';
import { ThemeService } from '../../core/services/theme.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import mapboxgl from 'mapbox-gl';
import { NurseSearchResult } from '../../core/models';
import { NurseListModalComponent } from '../../shared/components/nurse-list-modal/nurse-list-modal.component';
import { getSpecialtyConfig, getSpecialtyColors } from '../../shared/config/specialty-chips.config';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  standalone: false,
  styleUrls: ['./map.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
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
        // After style change, re-add cluster layers (style change removes all layers/sources)
        const map = this.mapboxService.getMap();
        if (map && this.usesClustering) {
          map.once('style.load', () => {
            this.updateNurseMarkers();
          });
        }
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
  isMapLoading = signal(true);
  hasSearched = signal(false);

  // Retry params from rejected tracking page
  private retryParams = signal<Record<string, string>>({});

  // Clustering
  private usesClustering = false;

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
    // Capture retry queryParams if navigated from rejected tracking
    this.route.queryParams.subscribe(params => {
      if (params['retryRequestId']) {
        const { retryRequestId, serviceCategory, address, district, city, date, timeSlot, notes } = params;
        this.retryParams.set({
          ...(retryRequestId && { retryRequestId }),
          ...(serviceCategory && { serviceCategory }),
          ...(address && { address }),
          ...(district && { district }),
          ...(city && { city }),
          ...(date && { date }),
          ...(timeSlot && { timeSlot }),
          ...(notes && { notes }),
        });
      }
    });

    const mapContainer = document.getElementById('map');
    const currentMap = this.mapboxService.getMap();

    // If the map was destroyed externally (e.g. tracking page), reset flag
    if (!currentMap && this.mapInitialized) {
      this.mapInitialized = false;
    }

    if (mapContainer && !this.mapInitialized) {
      this.isMapLoading.set(true);
      setTimeout(() => {
        this.initMap();
        this.getUserLocation();
      }, 100);
    } else if (currentMap) {
      this.isMapLoading.set(false);
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
    this.removeClusters();
    this.mapInitialized = false;
    this.usesClustering = false;
    this.mapboxService.destroy();
  }

  private initMap() {
    if (this.mapInitialized) return;

    try {
      this.isMapLoading.set(true);

      // Use ThemeService to determine initial map style
      const isDarkMode = this.themeService.isDarkMode();
      const mapStyle = isDarkMode
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/streets-v12';

      const map = this.mapboxService.initMap({
        container: 'map',
        center: [this.userLng, this.userLat],
        zoom: 14,
        style: mapStyle
      });
      this.mapInitialized = true;

      map.on('load', () => {
        this.isMapLoading.set(false);
      });

      // Fallback: hide loading after timeout in case 'load' never fires
      setTimeout(() => this.isMapLoading.set(false), 10000);

      // Theme changes are handled by the effect in constructor
    } catch (error) {
      console.error('Error initializing map:', error);
      this.isMapLoading.set(false);
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

      // Empty state overlay handles the "no results" case visually (A4)
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
      this.hasSearched.set(true);
    }
  }

  private previousNurseCount = 0;
  private static readonly CLUSTER_THRESHOLD = 5;
  private static readonly CLUSTER_SOURCE_ID = 'nurses-cluster-source';
  private static readonly CLUSTER_LAYER_ID = 'nurses-clusters';
  private static readonly CLUSTER_COUNT_LAYER_ID = 'nurses-cluster-count';
  private static readonly UNCLUSTERED_LAYER_ID = 'nurses-unclustered-point';

  private updateNurseMarkers() {
    const map = this.mapboxService.getMap();

    // Clean up previous state
    this.removeClusters();
    for (let i = 0; i < Math.max(this.previousNurseCount, 20); i++) {
      this.mapboxService.removeMarker(`nurse-${i}`);
    }
    this.previousNurseCount = this.nearbyNurses.length;
    this.usesClustering = false;

    const allCoordinates: [number, number][] = [[this.userLng, this.userLat]];

    // Collect valid nurse coordinates
    const validNurses = this.nearbyNurses.filter(r => r.nurse.location?.coordinates);
    validNurses.forEach(r => {
      const [lng, lat] = r.nurse.location!.coordinates;
      allCoordinates.push([lng, lat]);
    });

    // Use clustering for 5+ nurses, individual markers otherwise
    if (validNurses.length >= MapPage.CLUSTER_THRESHOLD && map) {
      this.addClusteredNurses(map, validNurses);
    } else {
      this.addIndividualNurseMarkers(validNurses);
    }

    // Fit bounds to show all markers if there are any
    if (allCoordinates.length > 1) {
      this.mapboxService.fitBounds(allCoordinates, 60);
    }
  }

  /**
   * Add nurses as individual Mapbox markers (for < 5 nurses)
   */
  private addIndividualNurseMarkers(nurses: NurseSearchResult[]) {
    nurses.forEach((result, index) => {
      const nurse = result.nurse;
      const [lng, lat] = nurse.location!.coordinates;

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
  }

  /**
   * Add nurses as a GeoJSON clustered source + layers (for 5+ nurses)
   */
  private addClusteredNurses(map: any, nurses: NurseSearchResult[]) {
    this.usesClustering = true;

    // Build GeoJSON FeatureCollection
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: nurses.map((result, index) => {
        const nurse = result.nurse;
        const [lng, lat] = nurse.location!.coordinates;
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [lng, lat]
          },
          properties: {
            index,
            nurseId: nurse._id,
            firstName: nurse.user?.firstName || 'Enfermera',
            lastName: nurse.user?.lastName || '',
            distance: result.distance.toFixed(1),
            rating: nurse.averageRating.toFixed(1),
            totalReviews: nurse.totalReviews,
            isAvailable: nurse.isAvailable,
            avatar: nurse.user?.avatar || 'assets/img/default-avatar.png'
          }
        };
      })
    };

    // Add the clustered source
    map.addSource(MapPage.CLUSTER_SOURCE_ID, {
      type: 'geojson',
      data: geojson,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Layer: cluster circles (sized by point_count)
    map.addLayer({
      id: MapPage.CLUSTER_LAYER_ID,
      type: 'circle',
      source: MapPage.CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#4a9d9a',   // < 10 points: teal
          10, '#1e3a5f', // 10+ points: navy
          25, '#7c3aed'  // 25+ points: purple
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          20,   // < 10 points: 20px
          10, 28, // 10+ points: 28px
          25, 36  // 25+ points: 36px
        ],
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Layer: cluster count labels
    map.addLayer({
      id: MapPage.CLUSTER_COUNT_LAYER_ID,
      type: 'symbol',
      source: MapPage.CLUSTER_SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 13
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Layer: unclustered individual points
    map.addLayer({
      id: MapPage.UNCLUSTERED_LAYER_ID,
      type: 'circle',
      source: MapPage.CLUSTER_SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'case',
          ['get', 'isAvailable'], '#16a34a',
          '#94a3b8'
        ],
        'circle-radius': 10,
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Click on cluster -> zoom in
    map.on('click', MapPage.CLUSTER_LAYER_ID, (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [MapPage.CLUSTER_LAYER_ID] });
      if (!features.length) return;
      const clusterId = features[0].properties.cluster_id;
      const source = map.getSource(MapPage.CLUSTER_SOURCE_ID) as any;
      source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom
        });
      });
    });

    // Click on unclustered point -> show popup / select nurse
    map.on('click', MapPage.UNCLUSTERED_LAYER_ID, (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [MapPage.UNCLUSTERED_LAYER_ID] });
      if (!features.length) return;
      const props = features[0].properties;
      const coords = features[0].geometry.coordinates.slice() as [number, number];
      const nurseIndex = props.index;

      // Select the nurse (triggers card display)
      if (nurseIndex !== undefined && this.nearbyNurses[nurseIndex]) {
        this.selectNurse(this.nearbyNurses[nurseIndex]);
      }

      // Also show a popup on the map
      const popupHtml = `
        <div class="nurse-popup">
          <strong>${props.firstName} ${props.lastName}</strong>
          <p>${props.distance} km de distancia</p>
          <p>Rating: ${props.rating} (${props.totalReviews} reseñas)</p>
        </div>
      `;

      new mapboxgl.Popup({ offset: 25, closeButton: true, closeOnClick: false })
        .setLngLat(coords)
        .setHTML(popupHtml)
        .addTo(map);
    });

    // Change cursor on hover over clusters and points
    map.on('mouseenter', MapPage.CLUSTER_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', MapPage.CLUSTER_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });
    map.on('mouseenter', MapPage.UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    map.on('mouseleave', MapPage.UNCLUSTERED_LAYER_ID, () => {
      map.getCanvas().style.cursor = '';
    });
  }

  /**
   * Remove clustering layers and source from the map
   */
  private removeClusters() {
    const map = this.mapboxService.getMap();
    if (!map) return;

    try {
      if (map.getLayer(MapPage.UNCLUSTERED_LAYER_ID)) map.removeLayer(MapPage.UNCLUSTERED_LAYER_ID);
      if (map.getLayer(MapPage.CLUSTER_COUNT_LAYER_ID)) map.removeLayer(MapPage.CLUSTER_COUNT_LAYER_ID);
      if (map.getLayer(MapPage.CLUSTER_LAYER_ID)) map.removeLayer(MapPage.CLUSTER_LAYER_ID);
      if (map.getSource(MapPage.CLUSTER_SOURCE_ID)) map.removeSource(MapPage.CLUSTER_SOURCE_ID);
    } catch (e) {
      // Layers/source may not exist yet
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
    // Navigate outside tabs to the request form, forwarding retry params if present
    this.router.navigate(['/patient/request'], {
      queryParams: { nurseId, ...this.retryParams() }
    });
  }

  getChipIcon(specialty: string): string {
    return getSpecialtyConfig(specialty).icon;
  }

  getChipStyle(specialty: string): Record<string, string> {
    const config = getSpecialtyConfig(specialty);
    const colors = getSpecialtyColors(config.family, this.themeService.isDarkMode());
    return {
      'background': colors.bg,
      'color': colors.text,
    };
  }

  expandRadius() {
    this.searchRadius = 20;
    this.searchNearbyNurses();
  }

  clearFilters() {
    this.selectedCategory = '';
    this.searchNearbyNurses();
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
