import { Injectable, signal } from '@angular/core';

export interface Departamento {
  id: string;
  nombre: string;
  activo: boolean;
}

export interface Provincia {
  id: string;
  nombre: string;
  departamentoId: string;
}

export interface Distrito {
  id: string;
  nombre: string;
  provinciaId: string;
  departamentoId: string;
  zona?: string; // Solo para Lima Metropolitana
  coordenadas?: { lat: number; lng: number };
  activo: boolean;
}

export interface ZonaLima {
  id: string;
  nombre: string;
  distritos: string[];
}

@Injectable({
  providedIn: 'root',
})
export class PeruLocationsService {
  // Departamentos de Peru (25)
  private readonly departamentos: Departamento[] = [
    { id: '15', nombre: 'Lima', activo: true },
    { id: '07', nombre: 'Callao', activo: true },
    { id: '04', nombre: 'Arequipa', activo: false },
    { id: '13', nombre: 'La Libertad', activo: false },
    { id: '14', nombre: 'Lambayeque', activo: false },
    { id: '20', nombre: 'Piura', activo: false },
    { id: '08', nombre: 'Cusco', activo: false },
    { id: '12', nombre: 'Junin', activo: false },
    { id: '02', nombre: 'Ancash', activo: false },
    { id: '06', nombre: 'Cajamarca', activo: false },
    { id: '21', nombre: 'Puno', activo: false },
    { id: '10', nombre: 'Huanuco', activo: false },
    { id: '16', nombre: 'Loreto', activo: false },
    { id: '11', nombre: 'Ica', activo: false },
    { id: '23', nombre: 'Tacna', activo: false },
    { id: '05', nombre: 'Ayacucho', activo: false },
    { id: '25', nombre: 'Ucayali', activo: false },
    { id: '03', nombre: 'Apurimac', activo: false },
    { id: '01', nombre: 'Amazonas', activo: false },
    { id: '09', nombre: 'Huancavelica', activo: false },
    { id: '17', nombre: 'Madre de Dios', activo: false },
    { id: '18', nombre: 'Moquegua', activo: false },
    { id: '19', nombre: 'Pasco', activo: false },
    { id: '22', nombre: 'San Martin', activo: false },
    { id: '24', nombre: 'Tumbes', activo: false },
  ];

  // Provincias principales
  private readonly provincias: Provincia[] = [
    // Lima
    { id: '1501', nombre: 'Lima', departamentoId: '15' },
    { id: '1502', nombre: 'Barranca', departamentoId: '15' },
    { id: '1503', nombre: 'Cajatambo', departamentoId: '15' },
    { id: '1504', nombre: 'Canta', departamentoId: '15' },
    { id: '1505', nombre: 'Canete', departamentoId: '15' },
    { id: '1506', nombre: 'Huaral', departamentoId: '15' },
    { id: '1507', nombre: 'Huarochiri', departamentoId: '15' },
    { id: '1508', nombre: 'Huaura', departamentoId: '15' },
    { id: '1509', nombre: 'Oyon', departamentoId: '15' },
    { id: '1510', nombre: 'Yauyos', departamentoId: '15' },
    // Callao
    { id: '0701', nombre: 'Callao', departamentoId: '07' },
    // Arequipa
    { id: '0401', nombre: 'Arequipa', departamentoId: '04' },
    // La Libertad
    { id: '1301', nombre: 'Trujillo', departamentoId: '13' },
    // Lambayeque
    { id: '1401', nombre: 'Chiclayo', departamentoId: '14' },
  ];

  // Zonas de Lima Metropolitana (para agrupar visualmente)
  readonly zonasLima: ZonaLima[] = [
    {
      id: 'lima-moderna',
      nombre: 'Lima Moderna',
      distritos: [
        'San Isidro',
        'Miraflores',
        'San Borja',
        'Surco',
        'La Molina',
        'Surquillo',
        'Barranco',
        'Magdalena del Mar',
        'Jesus Maria',
        'Pueblo Libre',
        'Lince',
        'San Miguel',
      ],
    },
    {
      id: 'lima-centro',
      nombre: 'Lima Centro',
      distritos: ['Cercado de Lima', 'Breña', 'La Victoria', 'Rimac'],
    },
    {
      id: 'lima-norte',
      nombre: 'Lima Norte',
      distritos: [
        'Independencia',
        'Los Olivos',
        'San Martin de Porres',
        'Comas',
        'Carabayllo',
        'Puente Piedra',
        'Ancon',
        'Santa Rosa',
      ],
    },
    {
      id: 'lima-sur',
      nombre: 'Lima Sur',
      distritos: [
        'Villa El Salvador',
        'San Juan de Miraflores',
        'Villa Maria del Triunfo',
        'Chorrillos',
        'Lurin',
        'Pachacamac',
        'Punta Negra',
        'Punta Hermosa',
        'San Bartolo',
        'Santa Maria del Mar',
        'Pucusana',
      ],
    },
    {
      id: 'lima-este',
      nombre: 'Lima Este',
      distritos: [
        'San Juan de Lurigancho',
        'Ate',
        'El Agustino',
        'Santa Anita',
        'La Victoria',
        'Lurigancho',
        'Chaclacayo',
        'Cieneguilla',
      ],
    },
  ];

  // Distritos de Lima Metropolitana (43 distritos)
  private readonly distritosLima: Distrito[] = [
    // Lima Moderna
    {
      id: '150131',
      nombre: 'San Isidro',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.0977, lng: -77.0365 },
      activo: true,
    },
    {
      id: '150122',
      nombre: 'Miraflores',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.1219, lng: -77.0299 },
      activo: true,
    },
    {
      id: '150130',
      nombre: 'San Borja',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.1067, lng: -76.9989 },
      activo: true,
    },
    {
      id: '150140',
      nombre: 'Surco',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.1464, lng: -76.9912 },
      activo: true,
    },
    {
      id: '150112',
      nombre: 'La Molina',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.0867, lng: -76.9353 },
      activo: true,
    },
    {
      id: '150141',
      nombre: 'Surquillo',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.1117, lng: -77.0089 },
      activo: true,
    },
    {
      id: '150104',
      nombre: 'Barranco',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.1500, lng: -77.0217 },
      activo: true,
    },
    {
      id: '150120',
      nombre: 'Magdalena del Mar',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.0900, lng: -77.0700 },
      activo: true,
    },
    {
      id: '150111',
      nombre: 'Jesus Maria',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.0700, lng: -77.0500 },
      activo: true,
    },
    {
      id: '150125',
      nombre: 'Pueblo Libre',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.0717, lng: -77.0633 },
      activo: true,
    },
    {
      id: '150116',
      nombre: 'Lince',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.0833, lng: -77.0333 },
      activo: true,
    },
    {
      id: '150136',
      nombre: 'San Miguel',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-moderna',
      coordenadas: { lat: -12.0767, lng: -77.0917 },
      activo: true,
    },

    // Lima Centro
    {
      id: '150101',
      nombre: 'Cercado de Lima',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-centro',
      coordenadas: { lat: -12.0464, lng: -77.0428 },
      activo: true,
    },
    {
      id: '150105',
      nombre: 'Breña',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-centro',
      coordenadas: { lat: -12.0583, lng: -77.0533 },
      activo: true,
    },
    {
      id: '150113',
      nombre: 'La Victoria',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-centro',
      coordenadas: { lat: -12.0667, lng: -77.0167 },
      activo: true,
    },
    {
      id: '150128',
      nombre: 'Rimac',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-centro',
      coordenadas: { lat: -12.0250, lng: -77.0333 },
      activo: true,
    },

    // Lima Norte
    {
      id: '150110',
      nombre: 'Independencia',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.9917, lng: -77.0417 },
      activo: true,
    },
    {
      id: '150117',
      nombre: 'Los Olivos',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.9667, lng: -77.0667 },
      activo: true,
    },
    {
      id: '150135',
      nombre: 'San Martin de Porres',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.9833, lng: -77.0833 },
      activo: true,
    },
    {
      id: '150108',
      nombre: 'Comas',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.9333, lng: -77.0167 },
      activo: true,
    },
    {
      id: '150106',
      nombre: 'Carabayllo',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.8500, lng: -77.0333 },
      activo: true,
    },
    {
      id: '150126',
      nombre: 'Puente Piedra',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.8667, lng: -77.0750 },
      activo: true,
    },
    {
      id: '150102',
      nombre: 'Ancon',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.7750, lng: -77.1583 },
      activo: true,
    },
    {
      id: '150142',
      nombre: 'Santa Rosa',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-norte',
      coordenadas: { lat: -11.8000, lng: -77.1667 },
      activo: true,
    },

    // Lima Sur
    {
      id: '150143',
      nombre: 'Villa El Salvador',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.2167, lng: -76.9333 },
      activo: true,
    },
    {
      id: '150133',
      nombre: 'San Juan de Miraflores',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.1583, lng: -76.9667 },
      activo: true,
    },
    {
      id: '150144',
      nombre: 'Villa Maria del Triunfo',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.1667, lng: -76.9500 },
      activo: true,
    },
    {
      id: '150107',
      nombre: 'Chorrillos',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.1667, lng: -77.0167 },
      activo: true,
    },
    {
      id: '150118',
      nombre: 'Lurin',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.2750, lng: -76.8667 },
      activo: true,
    },
    {
      id: '150123',
      nombre: 'Pachacamac',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.2250, lng: -76.8583 },
      activo: true,
    },
    {
      id: '150127',
      nombre: 'Punta Negra',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.3667, lng: -76.7833 },
      activo: true,
    },
    {
      id: '150124',
      nombre: 'Punta Hermosa',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.3333, lng: -76.8167 },
      activo: true,
    },
    {
      id: '150129',
      nombre: 'San Bartolo',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.3833, lng: -76.7833 },
      activo: true,
    },
    {
      id: '150139',
      nombre: 'Santa Maria del Mar',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.4083, lng: -76.7667 },
      activo: true,
    },
    {
      id: '150121',
      nombre: 'Pucusana',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-sur',
      coordenadas: { lat: -12.4750, lng: -76.7833 },
      activo: true,
    },

    // Lima Este
    {
      id: '150132',
      nombre: 'San Juan de Lurigancho',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-este',
      coordenadas: { lat: -12.0250, lng: -76.9833 },
      activo: true,
    },
    {
      id: '150103',
      nombre: 'Ate',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-este',
      coordenadas: { lat: -12.0250, lng: -76.9167 },
      activo: true,
    },
    {
      id: '150109',
      nombre: 'El Agustino',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-este',
      coordenadas: { lat: -12.0417, lng: -76.9917 },
      activo: true,
    },
    {
      id: '150137',
      nombre: 'Santa Anita',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-este',
      coordenadas: { lat: -12.0500, lng: -76.9667 },
      activo: true,
    },
    {
      id: '150119',
      nombre: 'Lurigancho',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-este',
      coordenadas: { lat: -11.9833, lng: -76.8833 },
      activo: true,
    },
    {
      id: '150138',
      nombre: 'Chaclacayo',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-este',
      coordenadas: { lat: -11.9750, lng: -76.7667 },
      activo: true,
    },
    {
      id: '150114',
      nombre: 'Cieneguilla',
      provinciaId: '1501',
      departamentoId: '15',
      zona: 'lima-este',
      coordenadas: { lat: -12.0833, lng: -76.8667 },
      activo: true,
    },
  ];

  // Distritos del Callao
  private readonly distritosCallao: Distrito[] = [
    {
      id: '070101',
      nombre: 'Callao',
      provinciaId: '0701',
      departamentoId: '07',
      coordenadas: { lat: -12.0567, lng: -77.1181 },
      activo: true,
    },
    {
      id: '070102',
      nombre: 'Bellavista',
      provinciaId: '0701',
      departamentoId: '07',
      coordenadas: { lat: -12.0583, lng: -77.1000 },
      activo: true,
    },
    {
      id: '070103',
      nombre: 'Carmen de la Legua Reynoso',
      provinciaId: '0701',
      departamentoId: '07',
      coordenadas: { lat: -12.0417, lng: -77.0917 },
      activo: true,
    },
    {
      id: '070104',
      nombre: 'La Perla',
      provinciaId: '0701',
      departamentoId: '07',
      coordenadas: { lat: -12.0667, lng: -77.1083 },
      activo: true,
    },
    {
      id: '070105',
      nombre: 'La Punta',
      provinciaId: '0701',
      departamentoId: '07',
      coordenadas: { lat: -12.0750, lng: -77.1583 },
      activo: true,
    },
    {
      id: '070106',
      nombre: 'Ventanilla',
      provinciaId: '0701',
      departamentoId: '07',
      coordenadas: { lat: -11.8750, lng: -77.1250 },
      activo: true,
    },
    {
      id: '070107',
      nombre: 'Mi Peru',
      provinciaId: '0701',
      departamentoId: '07',
      coordenadas: { lat: -11.8583, lng: -77.1083 },
      activo: true,
    },
  ];

  // Todos los distritos
  private readonly todosDistritos: Distrito[] = [...this.distritosLima, ...this.distritosCallao];

  // Signal para distritos filtrados
  private distritosFiltrados = signal<Distrito[]>([]);

  /**
   * Obtiene todos los departamentos
   * @param soloActivos Si true, retorna solo departamentos activos
   */
  getDepartamentos(soloActivos = true): Departamento[] {
    if (soloActivos) {
      return this.departamentos.filter((d) => d.activo);
    }
    return [...this.departamentos];
  }

  /**
   * Obtiene provincias por departamento
   */
  getProvincias(departamentoId: string): Provincia[] {
    return this.provincias.filter((p) => p.departamentoId === departamentoId);
  }

  /**
   * Obtiene distritos por provincia
   * @param provinciaId ID de la provincia
   * @param soloActivos Si true, retorna solo distritos activos
   */
  getDistritos(provinciaId: string, soloActivos = true): Distrito[] {
    let distritos = this.todosDistritos.filter((d) => d.provinciaId === provinciaId);

    if (soloActivos) {
      distritos = distritos.filter((d) => d.activo);
    }

    return distritos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  /**
   * Obtiene distritos agrupados por zona (solo para Lima Metropolitana)
   */
  getDistritosLimaPorZona(): Map<string, Distrito[]> {
    const porZona = new Map<string, Distrito[]>();

    for (const zona of this.zonasLima) {
      const distritos = this.distritosLima
        .filter((d) => d.zona === zona.id && d.activo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      if (distritos.length > 0) {
        porZona.set(zona.nombre, distritos);
      }
    }

    return porZona;
  }

  /**
   * Busca distritos por nombre
   */
  buscarDistritos(query: string, departamentoId?: string): Distrito[] {
    const queryLower = query.toLowerCase().trim();

    if (!queryLower) {
      return [];
    }

    let distritos = this.todosDistritos.filter((d) => d.activo);

    if (departamentoId) {
      distritos = distritos.filter((d) => d.departamentoId === departamentoId);
    }

    return distritos
      .filter((d) => d.nombre.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        // Priorizar coincidencias exactas
        const aStarts = a.nombre.toLowerCase().startsWith(queryLower);
        const bStarts = b.nombre.toLowerCase().startsWith(queryLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.nombre.localeCompare(b.nombre);
      })
      .slice(0, 10);
  }

  /**
   * Obtiene un distrito por ID
   */
  getDistritoById(id: string): Distrito | undefined {
    return this.todosDistritos.find((d) => d.id === id);
  }

  /**
   * Obtiene el nombre de zona por ID (solo Lima)
   */
  getZonaNombre(zonaId: string): string {
    return this.zonasLima.find((z) => z.id === zonaId)?.nombre ?? '';
  }

  /**
   * Verifica si un departamento es Lima Metropolitana
   */
  esLimaMetropolitana(departamentoId: string): boolean {
    return departamentoId === '15';
  }

  /**
   * Calcula distritos estimados en un radio dado
   * Basado en densidad promedio de distritos
   */
  estimarDistritosEnRadio(departamentoId: string, radioKm: number): number {
    // Lima tiene ~43 distritos en ~2800 km2
    // Otros departamentos tienen menor densidad
    const densidad = departamentoId === '15' || departamentoId === '07' ? 0.015 : 0.005;
    const area = Math.PI * radioKm * radioKm;
    return Math.max(1, Math.ceil(area * densidad));
  }

  /**
   * Obtiene radio sugerido basado en el distrito
   */
  getRadioSugerido(distrito: Distrito): number {
    // Lima Moderna: menos radio porque hay mas densidad
    if (distrito.zona === 'lima-moderna') {
      return 5;
    }
    // Lima y Callao en general
    if (distrito.departamentoId === '15' || distrito.departamentoId === '07') {
      return 10;
    }
    // Provincias
    return 15;
  }

  /**
   * Verifica si una zona esta activa para registro
   */
  isZonaActiva(departamentoId: string): boolean {
    const dept = this.departamentos.find((d) => d.id === departamentoId);
    return dept?.activo ?? false;
  }

  /**
   * Obtiene el nombre del departamento por ID
   */
  getDepartamentoNombre(departamentoId: string): string {
    return this.departamentos.find((d) => d.id === departamentoId)?.nombre ?? '';
  }

  /**
   * Obtiene la provincia por ID
   */
  getProvincia(provinciaId: string): Provincia | undefined {
    return this.provincias.find((p) => p.id === provinciaId);
  }
}
