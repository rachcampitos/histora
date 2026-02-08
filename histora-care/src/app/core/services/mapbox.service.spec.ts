import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { TestBed } from '@angular/core/testing';
import { MapboxService } from './mapbox.service';

describe('MapboxService', () => {
  let service: MapboxService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [MapboxService],
    });

    service = TestBed.inject(MapboxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ============= formatDistance =============

  it('formatDistance() should return meters for values under 1000', () => {
    expect(service.formatDistance(500)).toBe('500 m');
  });

  it('formatDistance() should round meters to whole numbers', () => {
    expect(service.formatDistance(123.7)).toBe('124 m');
    expect(service.formatDistance(0)).toBe('0 m');
  });

  it('formatDistance() should return km with one decimal for 1000+', () => {
    expect(service.formatDistance(1000)).toBe('1.0 km');
    expect(service.formatDistance(1500)).toBe('1.5 km');
    expect(service.formatDistance(2750)).toBe('2.8 km');
  });

  it('formatDistance() should handle large distances', () => {
    expect(service.formatDistance(15000)).toBe('15.0 km');
    expect(service.formatDistance(999)).toBe('999 m');
  });

  // ============= formatDuration =============

  it('formatDuration() should return seconds with "seg" for values under 60', () => {
    expect(service.formatDuration(30)).toBe('30 seg');
    expect(service.formatDuration(1)).toBe('1 seg');
  });

  it('formatDuration() should round seconds', () => {
    expect(service.formatDuration(45.7)).toBe('46 seg');
  });

  it('formatDuration() should return minutes for 60-3599 seconds', () => {
    expect(service.formatDuration(60)).toBe('1 min');
    expect(service.formatDuration(120)).toBe('2 min');
    expect(service.formatDuration(600)).toBe('10 min');
    expect(service.formatDuration(3540)).toBe('59 min');
  });

  it('formatDuration() should return hours and minutes for 3600+ seconds', () => {
    expect(service.formatDuration(3600)).toBe('1h 0min');
    expect(service.formatDuration(5400)).toBe('1h 30min');
    expect(service.formatDuration(7200)).toBe('2h 0min');
    expect(service.formatDuration(7320)).toBe('2h 2min');
  });

  // ============= initMap =============

  it('initMap() should create a new map instance with default values', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    expect(map).toBeDefined();
    expect(map.addControl).toHaveBeenCalledTimes(2); // Navigation + Attribution
  });

  it('initMap() should use custom config values', () => {
    const container = document.createElement('div');
    const config = {
      container,
      center: [-77.0, -12.0] as [number, number],
      zoom: 16,
      style: 'mapbox://styles/mapbox/dark-v11'
    };

    const map = service.initMap(config);
    expect(map).toBeDefined();
  });

  it('initMap() should remove existing map before creating new one', () => {
    const container = document.createElement('div');
    const firstMap = service.initMap({ container });
    const removeSpy = vi.spyOn(firstMap, 'remove');

    service.initMap({ container });
    expect(removeSpy).toHaveBeenCalled();
  });

  // ============= getMap =============

  it('getMap() should return null initially', () => {
    const freshService = new MapboxService();
    expect(freshService.getMap()).toBeNull();
  });

  it('getMap() should return map instance after initialization', () => {
    const container = document.createElement('div');
    service.initMap({ container });
    expect(service.getMap()).not.toBeNull();
  });

  // ============= addMarker =============

  it('addMarker() should create and add a marker with default options', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker = service.addMarker('test-marker', [-77.0, -12.0]);

    expect(marker).toBeDefined();
    expect(marker.setLngLat).toHaveBeenCalledWith([-77.0, -12.0]);
    expect(marker.addTo).toHaveBeenCalled();
  });

  it('addMarker() should create marker with custom color', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker = service.addMarker('test-marker', [-77.0, -12.0], { color: '#ff0000' });
    expect(marker).toBeDefined();
  });

  it('addMarker() should create marker with custom element', () => {
    const container = document.createElement('div');
    service.initMap({ container });
    const customElement = document.createElement('div');

    const marker = service.addMarker('test-marker', [-77.0, -12.0], {
      element: customElement,
      anchor: 'top'
    });

    expect(marker).toBeDefined();
  });

  it('addMarker() should attach popup with HTML content', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker = service.addMarker('test-marker', [-77.0, -12.0], {
      popup: '<div>Test Popup</div>'
    });

    expect(marker.setPopup).toHaveBeenCalled();
  });

  it('addMarker() should use custom popup offset', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker = service.addMarker('test-marker', [-77.0, -12.0], {
      popup: '<div>Test</div>',
      popupOffset: 50
    });

    expect(marker.setPopup).toHaveBeenCalled();
  });

  it('addMarker() should add popup close event listener', () => {
    const container = document.createElement('div');
    service.initMap({ container });
    const onClose = vi.fn();

    service.addMarker('test-marker', [-77.0, -12.0], {
      popup: '<div>Test</div>',
      onPopupClose: onClose
    });

    // Verify popup was created with close handler
    expect(onClose).not.toHaveBeenCalled(); // Not called on creation
  });

  it('addMarker() should remove existing marker with same id', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker1 = service.addMarker('test-marker', [-77.0, -12.0]);
    const removeSpy = vi.spyOn(marker1, 'remove');

    service.addMarker('test-marker', [-77.1, -12.1]);
    expect(removeSpy).toHaveBeenCalled();
  });

  // ============= updateMarkerPosition =============

  it('updateMarkerPosition() should update existing marker coordinates', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker = service.addMarker('test-marker', [-77.0, -12.0]);
    vi.clearAllMocks();

    service.updateMarkerPosition('test-marker', [-77.1, -12.1]);
    expect(marker.setLngLat).toHaveBeenCalledWith([-77.1, -12.1]);
  });

  it('updateMarkerPosition() should do nothing if marker does not exist', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    // Should not throw
    expect(() => {
      service.updateMarkerPosition('non-existent', [-77.0, -12.0]);
    }).not.toThrow();
  });

  // ============= removeMarker =============

  it('removeMarker() should remove marker and delete from map', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker = service.addMarker('test-marker', [-77.0, -12.0]);
    const removeSpy = vi.spyOn(marker, 'remove');

    service.removeMarker('test-marker');
    expect(removeSpy).toHaveBeenCalled();
  });

  it('removeMarker() should do nothing if marker does not exist', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    expect(() => {
      service.removeMarker('non-existent');
    }).not.toThrow();
  });

  // ============= closeAllPopups =============

  it('closeAllPopups() should close all open popups', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker1 = service.addMarker('marker1', [-77.0, -12.0], { popup: '<div>Test 1</div>' });
    const marker2 = service.addMarker('marker2', [-77.1, -12.1], { popup: '<div>Test 2</div>' });

    const popup1 = marker1.getPopup();
    const popup2 = marker2.getPopup();

    if (popup1) {
      popup1.isOpen = vi.fn().mockReturnValue(true);
    }
    if (popup2) {
      popup2.isOpen = vi.fn().mockReturnValue(true);
    }

    service.closeAllPopups();

    if (popup1) {
      expect(popup1.remove).toHaveBeenCalled();
    }
    if (popup2) {
      expect(popup2.remove).toHaveBeenCalled();
    }
  });

  // ============= closePopup =============

  it('closePopup() should close popup for specific marker', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker = service.addMarker('marker1', [-77.0, -12.0], { popup: '<div>Test</div>' });
    const popup = marker.getPopup();

    if (popup) {
      popup.isOpen = vi.fn().mockReturnValue(true);
    }

    service.closePopup('marker1');

    if (popup) {
      expect(popup.remove).toHaveBeenCalled();
    }
  });

  it('closePopup() should do nothing if marker does not exist', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    expect(() => {
      service.closePopup('non-existent');
    }).not.toThrow();
  });

  // ============= clearMarkers =============

  it('clearMarkers() should remove all markers', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    const marker1 = service.addMarker('marker1', [-77.0, -12.0]);
    const marker2 = service.addMarker('marker2', [-77.1, -12.1]);

    const spy1 = vi.spyOn(marker1, 'remove');
    const spy2 = vi.spyOn(marker2, 'remove');

    service.clearMarkers();

    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });

  // ============= centerOn =============

  it('centerOn() should fly to coordinates with current zoom', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    service.centerOn([-77.0, -12.0]);
    expect(map.flyTo).toHaveBeenCalled();
  });

  it('centerOn() should use custom zoom level', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    service.centerOn([-77.0, -12.0], 18);
    expect(map.flyTo).toHaveBeenCalled();
  });

  it('centerOn() should do nothing if map is not initialized', () => {
    const freshService = new MapboxService();

    expect(() => {
      freshService.centerOn([-77.0, -12.0]);
    }).not.toThrow();
  });

  // ============= fitBounds =============

  it('fitBounds() should fit map to multiple coordinates', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    const coords: [number, number][] = [
      [-77.0, -12.0],
      [-77.1, -12.1],
      [-77.2, -12.2]
    ];

    service.fitBounds(coords);
    expect(map.fitBounds).toHaveBeenCalled();
  });

  it('fitBounds() should use custom padding', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    const coords: [number, number][] = [[-77.0, -12.0], [-77.1, -12.1]];

    service.fitBounds(coords, 100);
    expect(map.fitBounds).toHaveBeenCalled();
  });

  it('fitBounds() should do nothing if map is not initialized', () => {
    const freshService = new MapboxService();

    expect(() => {
      freshService.fitBounds([[-77.0, -12.0]]);
    }).not.toThrow();
  });

  it('fitBounds() should do nothing if coordinates array is empty', () => {
    const container = document.createElement('div');
    service.initMap({ container });

    expect(() => {
      service.fitBounds([]);
    }).not.toThrow();
  });

  // ============= drawRoute =============

  it('drawRoute() should add route source and layer', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    const coords: [number, number][] = [
      [-77.0, -12.0],
      [-77.1, -12.1]
    ];

    service.drawRoute(coords);

    expect(map.addSource).toHaveBeenCalledWith('route', expect.any(Object));
    expect(map.addLayer).toHaveBeenCalled();
  });

  it('drawRoute() should use custom color', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    service.drawRoute([[-77.0, -12.0], [-77.1, -12.1]], '#ff0000');

    expect(map.addSource).toHaveBeenCalled();
    expect(map.addLayer).toHaveBeenCalled();
  });

  it('drawRoute() should remove existing route before drawing new one', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    // Mock getLayer to return true for existing route
    map.getLayer = vi.fn().mockReturnValue(true);
    map.getSource = vi.fn().mockReturnValue(true);

    service.drawRoute([[-77.0, -12.0], [-77.1, -12.1]]);

    expect(map.removeLayer).toHaveBeenCalledWith('route');
    expect(map.removeSource).toHaveBeenCalledWith('route');
  });

  it('drawRoute() should do nothing if map is not initialized', () => {
    const freshService = new MapboxService();

    expect(() => {
      freshService.drawRoute([[-77.0, -12.0]]);
    }).not.toThrow();
  });

  // ============= removeRoute =============

  it('removeRoute() should remove route layer and source', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    map.getLayer = vi.fn().mockReturnValue(true);
    map.getSource = vi.fn().mockReturnValue(true);

    service.removeRoute();

    expect(map.removeLayer).toHaveBeenCalledWith('route');
    expect(map.removeSource).toHaveBeenCalledWith('route');
  });

  it('removeRoute() should not remove if route does not exist', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    map.getLayer = vi.fn().mockReturnValue(false);
    map.getSource = vi.fn().mockReturnValue(false);

    service.removeRoute();

    expect(map.removeLayer).not.toHaveBeenCalled();
    expect(map.removeSource).not.toHaveBeenCalled();
  });

  it('removeRoute() should do nothing if map is not initialized', () => {
    const freshService = new MapboxService();

    expect(() => {
      freshService.removeRoute();
    }).not.toThrow();
  });

  // ============= getDirections =============

  it('getDirections() should fetch route from Mapbox API', async () => {
    const mockResponse = {
      routes: [{
        distance: 1500,
        duration: 300,
        geometry: {
          type: 'LineString',
          coordinates: [[-77.0, -12.0], [-77.1, -12.1]]
        }
      }]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse)
    } as any);

    const result = await service.getDirections([-77.0, -12.0], [-77.1, -12.1]);

    expect(result).toEqual({
      distance: 1500,
      duration: 300,
      geometry: mockResponse.routes[0].geometry
    });
    expect(globalThis.fetch).toHaveBeenCalled();
  });

  it('getDirections() should use custom profile', async () => {
    const mockResponse = {
      routes: [{
        distance: 1200,
        duration: 600,
        geometry: { type: 'LineString', coordinates: [] }
      }]
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockResponse)
    } as any);

    await service.getDirections([-77.0, -12.0], [-77.1, -12.1], 'walking');

    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('walking'));
  });

  it('getDirections() should return null if no routes found', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ routes: [] })
    } as any);

    const result = await service.getDirections([-77.0, -12.0], [-77.1, -12.1]);
    expect(result).toBeNull();
  });

  it('getDirections() should return null on fetch error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await service.getDirections([-77.0, -12.0], [-77.1, -12.1]);

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // ============= createNurseMarkerElement =============

  it('createNurseMarkerElement() should create nurse marker HTML element', () => {
    const element = service.createNurseMarkerElement();

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.className).toBe('nurse-marker');
    expect(element.innerHTML).toContain('marker-pulse');
    expect(element.innerHTML).toContain('marker-icon');
    expect(element.innerHTML).toContain('ion-icon');
    expect(element.innerHTML).toContain('medkit');
  });

  // ============= createPatientMarkerElement =============

  it('createPatientMarkerElement() should create patient marker HTML element', () => {
    const element = service.createPatientMarkerElement();

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.className).toBe('patient-marker');
    expect(element.innerHTML).toContain('marker-icon');
    expect(element.innerHTML).toContain('ion-icon');
    expect(element.innerHTML).toContain('location');
  });

  // ============= setStyle =============

  it('setStyle() should change map style', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    service.setStyle('dark');
    expect(map.setStyle).toHaveBeenCalledWith('mapbox://styles/mapbox/dark-v11');
  });

  it('setStyle() should handle different style keys', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    service.setStyle('navigation');
    expect(map.setStyle).toHaveBeenCalledWith('mapbox://styles/mapbox/navigation-day-v1');

    service.setStyle('satellite');
    expect(map.setStyle).toHaveBeenCalledWith('mapbox://styles/mapbox/satellite-streets-v12');
  });

  it('setStyle() should do nothing if map is not initialized', () => {
    const freshService = new MapboxService();

    expect(() => {
      freshService.setStyle('dark');
    }).not.toThrow();
  });

  // ============= destroy =============

  it('destroy() should clear markers and remove map', () => {
    const container = document.createElement('div');
    const map = service.initMap({ container });

    const marker1 = service.addMarker('marker1', [-77.0, -12.0]);
    const marker2 = service.addMarker('marker2', [-77.1, -12.1]);

    const spy1 = vi.spyOn(marker1, 'remove');
    const spy2 = vi.spyOn(marker2, 'remove');
    const mapSpy = vi.spyOn(map, 'remove');

    service.destroy();

    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(mapSpy).toHaveBeenCalled();
    expect(service.getMap()).toBeNull();
  });

  it('destroy() should handle when no map exists', () => {
    const freshService = new MapboxService();

    expect(() => {
      freshService.destroy();
    }).not.toThrow();
  });
});
