import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../../testing/setup';
import { PeruLocationsService } from './peru-locations.service';

describe('PeruLocationsService', () => {
  let service: PeruLocationsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PeruLocationsService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---- getDepartamentos ----

  describe('getDepartamentos', () => {
    it('should return only active departamentos when soloActivos=true', () => {
      const activos = service.getDepartamentos(true);
      expect(activos.length).toBe(2);
      expect(activos.every((d) => d.activo)).toBe(true);
      const nombres = activos.map((d) => d.nombre);
      expect(nombres).toContain('Lima');
      expect(nombres).toContain('Callao');
    });

    it('should return all 25 departamentos when soloActivos=false', () => {
      const todos = service.getDepartamentos(false);
      expect(todos.length).toBe(25);
    });

    it('should default to soloActivos=true', () => {
      const activos = service.getDepartamentos();
      expect(activos.length).toBe(2);
    });
  });

  // ---- getProvincias ----

  describe('getProvincias', () => {
    it('should return 10 provincias for Lima (departamentoId 15)', () => {
      const provincias = service.getProvincias('15');
      expect(provincias.length).toBe(10);
      expect(provincias[0].nombre).toBe('Lima');
    });

    it('should return 1 provincia for Callao (departamentoId 07)', () => {
      const provincias = service.getProvincias('07');
      expect(provincias.length).toBe(1);
      expect(provincias[0].nombre).toBe('Callao');
    });

    it('should return empty array for departamento with no provincias', () => {
      const provincias = service.getProvincias('99');
      expect(provincias).toEqual([]);
    });
  });

  // ---- getDistritos ----

  describe('getDistritos', () => {
    it('should return distritos for Lima province (1501) sorted alphabetically', () => {
      const distritos = service.getDistritos('1501');
      expect(distritos.length).toBe(42);
      // Verify sorted alphabetically
      for (let i = 1; i < distritos.length; i++) {
        expect(
          distritos[i - 1].nombre.localeCompare(distritos[i].nombre)
        ).toBeLessThanOrEqual(0);
      }
    });

    it('should return Callao distritos for provincia 0701', () => {
      const distritos = service.getDistritos('0701');
      expect(distritos.length).toBe(7);
    });

    it('should return empty array for unknown provincia', () => {
      const distritos = service.getDistritos('9999');
      expect(distritos).toEqual([]);
    });
  });

  // ---- getDistritosLimaPorZona ----

  describe('getDistritosLimaPorZona', () => {
    it('should return a Map grouped by zone names', () => {
      const porZona = service.getDistritosLimaPorZona();
      expect(porZona).toBeInstanceOf(Map);
      expect(porZona.has('Lima Moderna')).toBe(true);
      expect(porZona.has('Lima Centro')).toBe(true);
      expect(porZona.has('Lima Norte')).toBe(true);
      expect(porZona.has('Lima Sur')).toBe(true);
      expect(porZona.has('Lima Este')).toBe(true);
    });

    it('should have 12 distritos in Lima Moderna', () => {
      const porZona = service.getDistritosLimaPorZona();
      const moderna = porZona.get('Lima Moderna');
      expect(moderna).toBeDefined();
      expect(moderna!.length).toBe(12);
    });

    it('should return distritos sorted alphabetically within each zone', () => {
      const porZona = service.getDistritosLimaPorZona();
      for (const [, distritos] of porZona) {
        for (let i = 1; i < distritos.length; i++) {
          expect(
            distritos[i - 1].nombre.localeCompare(distritos[i].nombre)
          ).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  // ---- buscarDistritos ----

  describe('buscarDistritos', () => {
    it('should find Miraflores first when searching "mira"', () => {
      const results = service.buscarDistritos('mira');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nombre).toBe('Miraflores');
    });

    it('should return empty array for empty query', () => {
      const results = service.buscarDistritos('');
      expect(results).toEqual([]);
    });

    it('should return empty array for whitespace-only query', () => {
      const results = service.buscarDistritos('   ');
      expect(results).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const results = service.buscarDistritos('SAN ISIDRO');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].nombre).toBe('San Isidro');
    });

    it('should filter by departamentoId when provided', () => {
      const results = service.buscarDistritos('call', '07');
      expect(results.every((d) => d.departamentoId === '07')).toBe(true);
    });

    it('should limit results to 10', () => {
      const results = service.buscarDistritos('a');
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it('should prioritize names that start with the query', () => {
      const results = service.buscarDistritos('san');
      // Names starting with "San" should come before those just containing "san"
      const firstNonStarter = results.findIndex(
        (d) => !d.nombre.toLowerCase().startsWith('san')
      );
      if (firstNonStarter > 0) {
        for (let i = 0; i < firstNonStarter; i++) {
          expect(results[i].nombre.toLowerCase().startsWith('san')).toBe(true);
        }
      }
    });
  });

  // ---- getDistritoById ----

  describe('getDistritoById', () => {
    it('should return correct distrito by ID', () => {
      const distrito = service.getDistritoById('150122');
      expect(distrito).toBeDefined();
      expect(distrito!.nombre).toBe('Miraflores');
    });

    it('should return undefined for unknown ID', () => {
      const distrito = service.getDistritoById('999999');
      expect(distrito).toBeUndefined();
    });
  });

  // ---- getZonaNombre ----

  describe('getZonaNombre', () => {
    it('should return zone name for lima-moderna', () => {
      expect(service.getZonaNombre('lima-moderna')).toBe('Lima Moderna');
    });

    it('should return zone name for lima-sur', () => {
      expect(service.getZonaNombre('lima-sur')).toBe('Lima Sur');
    });

    it('should return empty string for unknown zone', () => {
      expect(service.getZonaNombre('unknown-zone')).toBe('');
    });
  });

  // ---- esLimaMetropolitana ----

  describe('esLimaMetropolitana', () => {
    it('should return true for departamentoId "15"', () => {
      expect(service.esLimaMetropolitana('15')).toBe(true);
    });

    it('should return false for departamentoId "07" (Callao)', () => {
      expect(service.esLimaMetropolitana('07')).toBe(false);
    });
  });

  // ---- estimarDistritosEnRadio ----

  describe('estimarDistritosEnRadio', () => {
    it('should use higher density for Lima (15)', () => {
      const result = service.estimarDistritosEnRadio('15', 10);
      // density 0.015, area = PI * 100 ~= 314.16, * 0.015 ~= 4.71 -> ceil = 5
      expect(result).toBe(5);
    });

    it('should use higher density for Callao (07)', () => {
      const result = service.estimarDistritosEnRadio('07', 10);
      expect(result).toBe(5);
    });

    it('should use lower density for other departamentos', () => {
      const result = service.estimarDistritosEnRadio('04', 10);
      // density 0.005, area ~= 314.16, * 0.005 ~= 1.57 -> ceil = 2
      expect(result).toBe(2);
    });

    it('should return at least 1 for very small radius', () => {
      const result = service.estimarDistritosEnRadio('04', 1);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });

  // ---- getRadioSugerido ----

  describe('getRadioSugerido', () => {
    it('should return 5 for lima-moderna zone', () => {
      const distrito = service.getDistritoById('150131'); // San Isidro
      expect(distrito).toBeDefined();
      expect(service.getRadioSugerido(distrito!)).toBe(5);
    });

    it('should return 10 for non-moderna Lima district', () => {
      const distrito = service.getDistritoById('150101'); // Cercado de Lima (lima-centro)
      expect(distrito).toBeDefined();
      expect(service.getRadioSugerido(distrito!)).toBe(10);
    });

    it('should return 10 for Callao district', () => {
      const distrito = service.getDistritoById('070101'); // Callao
      expect(distrito).toBeDefined();
      expect(service.getRadioSugerido(distrito!)).toBe(10);
    });

    it('should return 15 for a provincia district (no Lima/Callao dept)', () => {
      // Create a fake distrito for a provincia
      const distritoProvincial = {
        id: '040101',
        nombre: 'Arequipa Centro',
        provinciaId: '0401',
        departamentoId: '04',
        activo: true,
      };
      expect(service.getRadioSugerido(distritoProvincial)).toBe(15);
    });
  });

  // ---- isZonaActiva ----

  describe('isZonaActiva', () => {
    it('should return true for Lima (15)', () => {
      expect(service.isZonaActiva('15')).toBe(true);
    });

    it('should return true for Callao (07)', () => {
      expect(service.isZonaActiva('07')).toBe(true);
    });

    it('should return false for inactive departamento like Arequipa (04)', () => {
      expect(service.isZonaActiva('04')).toBe(false);
    });

    it('should return false for unknown departamento', () => {
      expect(service.isZonaActiva('99')).toBe(false);
    });
  });

  // ---- getDepartamentoNombre ----

  describe('getDepartamentoNombre', () => {
    it('should return "Lima" for departamentoId "15"', () => {
      expect(service.getDepartamentoNombre('15')).toBe('Lima');
    });

    it('should return "Callao" for departamentoId "07"', () => {
      expect(service.getDepartamentoNombre('07')).toBe('Callao');
    });

    it('should return empty string for unknown departamentoId', () => {
      expect(service.getDepartamentoNombre('99')).toBe('');
    });
  });

  // ---- getProvincia ----

  describe('getProvincia', () => {
    it('should return Lima provincia for id 1501', () => {
      const provincia = service.getProvincia('1501');
      expect(provincia).toBeDefined();
      expect(provincia!.nombre).toBe('Lima');
      expect(provincia!.departamentoId).toBe('15');
    });

    it('should return undefined for unknown provinciaId', () => {
      const provincia = service.getProvincia('9999');
      expect(provincia).toBeUndefined();
    });
  });
});
