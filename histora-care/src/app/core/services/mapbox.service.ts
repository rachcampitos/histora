import { Injectable, signal } from '@angular/core';
import mapboxgl, { Map as MapboxMap, Marker, LngLatLike, NavigationControl } from 'mapbox-gl';
import { environment } from '../../../environments/environment';

export interface MapConfig {
  container: string | HTMLElement;
  center?: [number, number];
  zoom?: number;
  style?: string;
}

export interface RouteInfo {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: GeoJSON.LineString;
}

@Injectable({
  providedIn: 'root'
})
export class MapboxService {
  private map: MapboxMap | null = null;
  private markersMap = new Map<string, Marker>();

  // Default to Lima, Peru
  private defaultCenter: [number, number] = [-77.042793, -12.046374];
  private defaultZoom = 14;

  // Map styles
  readonly styles = {
    streets: 'mapbox://styles/mapbox/streets-v12',
    light: 'mapbox://styles/mapbox/light-v11',
    dark: 'mapbox://styles/mapbox/dark-v11',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
    navigation: 'mapbox://styles/mapbox/navigation-day-v1',
    navigationNight: 'mapbox://styles/mapbox/navigation-night-v1'
  };

  constructor() {
    // Set access token
    mapboxgl.accessToken = (environment as any).mapboxToken || '';
  }

  /**
   * Initialize a new map instance
   */
  initMap(config: MapConfig): MapboxMap {
    if (this.map) {
      this.map.remove();
    }

    this.map = new mapboxgl.Map({
      container: config.container,
      style: config.style || this.styles.streets,
      center: config.center || this.defaultCenter,
      zoom: config.zoom || this.defaultZoom,
      attributionControl: false
    });

    // Add navigation controls
    this.map.addControl(new NavigationControl({ showCompass: true }), 'top-right');

    // Add attribution in a smaller format
    this.map.addControl(new mapboxgl.AttributionControl({ compact: true }));

    return this.map;
  }

  /**
   * Get the current map instance
   */
  getMap(): MapboxMap | null {
    return this.map;
  }

  /**
   * Add a marker to the map
   */
  addMarker(
    id: string,
    coordinates: [number, number],
    options?: {
      color?: string;
      element?: HTMLElement;
      anchor?: 'center' | 'top' | 'bottom' | 'left' | 'right';
      popup?: string;
      popupOffset?: number | [number, number];
      onPopupClose?: () => void;
    }
  ): Marker {
    // Remove existing marker with same id
    this.removeMarker(id);

    let marker: Marker;

    if (options?.element) {
      marker = new Marker({ element: options.element, anchor: options?.anchor || 'bottom' });
    } else {
      marker = new Marker({ color: options?.color || '#1e3a5f', anchor: options?.anchor || 'bottom' });
    }

    marker.setLngLat(coordinates);

    if (options?.popup) {
      // Use custom offset if provided, default to 25
      const popupOffset = options?.popupOffset ?? 25;
      const popup = new mapboxgl.Popup({
        offset: popupOffset,
        closeButton: true,
        closeOnClick: false
      }).setHTML(options.popup);

      // Add close event listener if callback provided
      if (options?.onPopupClose) {
        popup.on('close', options.onPopupClose);
      }

      marker.setPopup(popup);
    }

    if (this.map) {
      marker.addTo(this.map);
    }

    this.markersMap.set(id, marker);
    return marker;
  }

  /**
   * Update marker position (for real-time tracking)
   */
  updateMarkerPosition(id: string, coordinates: [number, number]): void {
    const marker = this.markersMap.get(id);
    if (marker) {
      marker.setLngLat(coordinates);
    }
  }

  /**
   * Remove a marker
   */
  removeMarker(id: string): void {
    const marker = this.markersMap.get(id);
    if (marker) {
      marker.remove();
      this.markersMap.delete(id);
    }
  }

  /**
   * Close all open popups
   */
  closeAllPopups(): void {
    this.markersMap.forEach((marker) => {
      const popup = marker.getPopup();
      if (popup && popup.isOpen()) {
        popup.remove();
      }
    });
  }

  /**
   * Close popup for a specific marker
   */
  closePopup(id: string): void {
    const marker = this.markersMap.get(id);
    if (marker) {
      const popup = marker.getPopup();
      if (popup && popup.isOpen()) {
        popup.remove();
      }
    }
  }

  /**
   * Remove all markers
   */
  clearMarkers(): void {
    this.markersMap.forEach((marker: Marker) => marker.remove());
    this.markersMap.clear();
  }

  /**
   * Center map on coordinates
   */
  centerOn(coordinates: [number, number], zoom?: number): void {
    if (this.map) {
      this.map.flyTo({
        center: coordinates,
        zoom: zoom || this.map.getZoom(),
        duration: 1000
      });
    }
  }

  /**
   * Fit map bounds to show multiple points
   */
  fitBounds(coordinates: [number, number][], padding = 50): void {
    if (!this.map || coordinates.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord as LngLatLike));

    this.map.fitBounds(bounds, { padding });
  }

  /**
   * Draw a route line on the map
   */
  drawRoute(coordinates: [number, number][], color = '#1e3a5f'): void {
    if (!this.map) return;

    // Remove existing route
    this.removeRoute();

    // Add source
    this.map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates
        }
      }
    });

    // Add line layer
    this.map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': color,
        'line-width': 5,
        'line-opacity': 0.8
      }
    });
  }

  /**
   * Remove route from map
   */
  removeRoute(): void {
    if (!this.map) return;

    if (this.map.getLayer('route')) {
      this.map.removeLayer('route');
    }
    if (this.map.getSource('route')) {
      this.map.removeSource('route');
    }
  }

  /**
   * Get directions between two points using Mapbox Directions API
   */
  async getDirections(
    origin: [number, number],
    destination: [number, number],
    profile: 'driving' | 'walking' | 'cycling' = 'driving'
  ): Promise<RouteInfo | null> {
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  /**
   * Create a custom marker element for nurse
   */
  createNurseMarkerElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'nurse-marker';
    el.innerHTML = `
      <div class="marker-pulse"></div>
      <div class="marker-icon">
        <ion-icon name="medkit"></ion-icon>
      </div>
    `;
    return el;
  }

  /**
   * Create a custom marker element for patient
   */
  createPatientMarkerElement(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'patient-marker';
    el.innerHTML = `
      <div class="marker-icon">
        <ion-icon name="location"></ion-icon>
      </div>
    `;
    return el;
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} seg`;
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Set map style (light/dark mode)
   */
  setStyle(style: keyof typeof this.styles): void {
    if (this.map) {
      this.map.setStyle(this.styles[style]);
    }
  }

  /**
   * Destroy map instance
   */
  destroy(): void {
    this.clearMarkers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }
}
