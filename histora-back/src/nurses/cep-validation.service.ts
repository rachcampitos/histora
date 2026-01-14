import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as https from 'https';

export interface CepValidationResult {
  isValid: boolean;
  data?: {
    cepNumber: string;
    fullName?: string;
    dni?: string;
    photoUrl?: string;
    isPhotoVerified?: boolean;
    isNameVerified?: boolean;
  };
  error?: string;
}

export interface NurseSearchResult {
  cep: string;
  nombre: string;
}

@Injectable()
export class CepValidationService {
  private readonly logger = new Logger(CepValidationService.name);
  private readonly BASE_URL = 'https://www.cep.org.pe';

  // Agent to handle self-signed certificates (CEP site has SSL issues)
  private readonly httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  /**
   * Validates a nurse using multiple verification methods:
   * 1. Check if photo exists for the DNI (strong verification)
   * 2. Search by name to verify CEP number exists
   * 3. Cross-reference CEP number with name
   */
  async validateNurse(params: {
    cepNumber: string;
    dni: string;
    fullName?: string;
  }): Promise<CepValidationResult> {
    const { cepNumber, dni, fullName } = params;

    try {
      this.logger.log(`Validating nurse: CEP=${cepNumber}, DNI=${dni}`);

      const cleanCep = cepNumber.replace(/\D/g, '');
      const cleanDni = dni.replace(/\D/g, '');

      // Validation 1: Check if photo exists for this DNI
      const photoCheck = await this.checkPhotoByDni(cleanDni);

      // Validation 2: Search by name to find CEP number
      let nameCheck: { found: boolean; cepMatches: boolean; foundCep?: string } = {
        found: false,
        cepMatches: false,
      };

      if (fullName && fullName.length >= 3) {
        const lastName = fullName.split(' ')[0]; // First word usually is last name
        const searchResults = await this.searchByName(lastName);

        // Look for matching CEP in results
        const match = searchResults.find(
          (r) => r.cep === cleanCep || r.nombre.toLowerCase().includes(fullName.toLowerCase().split(' ')[0])
        );

        if (match) {
          nameCheck = {
            found: true,
            cepMatches: match.cep === cleanCep,
            foundCep: match.cep,
          };
        }
      }

      // Determine overall validity
      const isValid = photoCheck.exists || nameCheck.cepMatches;

      if (!isValid) {
        return {
          isValid: false,
          error: photoCheck.exists
            ? 'El número de CEP no coincide con el registro'
            : 'No se encontró registro de enfermera(o) con este DNI',
        };
      }

      return {
        isValid: true,
        data: {
          cepNumber: cleanCep,
          dni: cleanDni,
          fullName: fullName || undefined,
          photoUrl: photoCheck.url,
          isPhotoVerified: photoCheck.exists,
          isNameVerified: nameCheck.cepMatches,
        },
      };
    } catch (error) {
      this.logger.error(`Validation error: ${error.message}`);
      return {
        isValid: false,
        error: `Error al validar: ${error.message}`,
      };
    }
  }

  /**
   * Simple validation: Just check if photo exists for DNI
   * This is the most reliable method as photos are only stored for registered nurses
   */
  async validateByDni(dni: string): Promise<CepValidationResult> {
    const cleanDni = dni.replace(/\D/g, '');

    if (!/^\d{8}$/.test(cleanDni)) {
      return {
        isValid: false,
        error: 'DNI debe tener 8 dígitos',
      };
    }

    const photoCheck = await this.checkPhotoByDni(cleanDni);

    if (!photoCheck.exists) {
      return {
        isValid: false,
        error: 'No se encontró registro de enfermera(o) con este DNI',
      };
    }

    return {
      isValid: true,
      data: {
        cepNumber: '', // Unknown without name search
        dni: cleanDni,
        photoUrl: photoCheck.url,
        isPhotoVerified: true,
      },
    };
  }

  /**
   * Check if photo exists for a given DNI
   * Photos are stored at /fotos/{DNI}.jpg for registered nurses
   *
   * This is the most reliable validation method because:
   * - Photos are only uploaded when nurse is registered
   * - The URL pattern is consistent
   * - The server returns 200 only if photo exists
   */
  async checkPhotoByDni(dni: string): Promise<{ exists: boolean; url?: string }> {
    try {
      const cleanDni = dni.replace(/\D/g, '');

      if (!/^\d{8}$/.test(cleanDni)) {
        return { exists: false };
      }

      const url = `${this.BASE_URL}/fotos/${cleanDni}.jpg`;

      const response = await axios.head(url, {
        httpsAgent: this.httpsAgent,
        timeout: 5000,
        validateStatus: (status) => status < 500, // Don't throw on 404
      });

      const exists = response.status === 200;

      this.logger.log(`Photo check for DNI ${cleanDni}: ${exists ? 'EXISTS' : 'NOT FOUND'}`);

      return {
        exists,
        url: exists ? url : undefined,
      };
    } catch (error) {
      this.logger.error(`Photo check failed: ${error.message}`);
      return { exists: false };
    }
  }

  /**
   * Search nurses by name using the CEP typeahead API
   * Returns list of matching nurses with their CEP numbers
   *
   * The API returns results in format:
   * [{"c_cmp":"108887","nombre":"[108887 ] APELLIDO NOMBRE SEGUNDO"}]
   */
  async searchByName(query: string): Promise<NurseSearchResult[]> {
    try {
      if (!query || query.length < 3) {
        return [];
      }

      const response = await axios.get(`${this.BASE_URL}/validar/comun/json_personas.php`, {
        params: { query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json',
          Referer: `${this.BASE_URL}/validar/`,
        },
        httpsAgent: this.httpsAgent,
        timeout: 10000,
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .filter((item: { c_cmp?: string; nombre?: string }) => item.c_cmp && item.nombre)
        .map((item: { c_cmp: string; nombre: string }) => ({
          cep: item.c_cmp,
          // Clean name: remove "[CEP_NUMBER ]" prefix
          nombre: item.nombre.replace(/^\[\d+\s*\]\s*/, '').trim(),
        }));
    } catch (error) {
      this.logger.error(`Name search failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Get the photo URL for a DNI (doesn't verify if it exists)
   */
  getPhotoUrl(dni: string): string {
    const cleanDni = dni.replace(/\D/g, '');
    return `${this.BASE_URL}/fotos/${cleanDni}.jpg`;
  }

  /**
   * Validate CEP by searching for the number in the database
   * Less reliable than photo check but useful for cross-validation
   */
  async validateByCep(cepNumber: string): Promise<CepValidationResult> {
    const cleanCep = cepNumber.replace(/\D/g, '');

    if (!cleanCep || cleanCep.length < 4) {
      return {
        isValid: false,
        error: 'Número de CEP inválido',
      };
    }

    // Search using the CEP number as query (it appears in the name field)
    const results = await this.searchByName(cleanCep);

    // Find exact match
    const match = results.find((r) => r.cep === cleanCep);

    if (!match) {
      return {
        isValid: false,
        error: 'No se encontró enfermera(o) con este número de CEP',
      };
    }

    return {
      isValid: true,
      data: {
        cepNumber: match.cep,
        fullName: match.nombre,
        isNameVerified: true,
      },
    };
  }
}
