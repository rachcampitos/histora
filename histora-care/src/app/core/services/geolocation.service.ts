import { Injectable, signal } from '@angular/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private locationSignal = signal<LocationCoordinates | null>(null);
  private watchId: string | null = null;

  location = this.locationSignal.asReadonly();

  async checkPermissions(): Promise<PermissionStatus> {
    return Geolocation.checkPermissions();
  }

  async requestPermissions(): Promise<PermissionStatus> {
    return Geolocation.requestPermissions();
  }

  async getCurrentPosition(): Promise<LocationCoordinates> {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });

    const coords: LocationCoordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading,
      speed: position.coords.speed
    };

    this.locationSignal.set(coords);
    return coords;
  }

  async startWatching(): Promise<void> {
    if (this.watchId) {
      return; // Already watching
    }

    this.watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      },
      (position: Position | null, err?: unknown) => {
        if (err) {
          console.error('Geolocation watch error:', err);
          return;
        }

        if (position) {
          this.locationSignal.set({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
        }
      }
    );
  }

  async stopWatching(): Promise<void> {
    if (this.watchId) {
      await Geolocation.clearWatch({ id: this.watchId });
      this.watchId = null;
    }
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Haversine formula to calculate distance in km
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
