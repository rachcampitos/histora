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
    // New fields from view.php endpoint
    region?: string;
    isHabil?: boolean;
    status?: 'HABIL' | 'INHABILITADO' | 'UNKNOWN';
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
   * Uses bracket pattern search since CEP appears as [NNNNNN ] in names
   */
  async validateByCep(cepNumber: string): Promise<CepValidationResult> {
    const cleanCep = cepNumber.replace(/\D/g, '');

    if (!cleanCep || cleanCep.length < 4) {
      return {
        isValid: false,
        error: 'Número de CEP inválido',
      };
    }

    // Search using bracket pattern [CEP_NUMBER to find in the database
    // The API returns names like "[108887 ] CHAVEZ TORRES MARIA CLAUDIA"
    const searchQuery = `[${cleanCep}`;
    const results = await this.searchByName(searchQuery);

    // Find exact match by CEP number
    const match = results.find((r) => r.cep === cleanCep);

    if (!match) {
      // Fallback: try searching with just the number (some cases work)
      const fallbackResults = await this.searchByName(cleanCep);
      const fallbackMatch = fallbackResults.find((r) => r.cep === cleanCep);

      if (!fallbackMatch) {
        return {
          isValid: false,
          error: 'No se encontró enfermera(o) con este número de CEP',
        };
      }

      return {
        isValid: true,
        data: {
          cepNumber: fallbackMatch.cep,
          fullName: fallbackMatch.nombre,
          isNameVerified: true,
        },
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

  /**
   * Complete CEP validation using the official view.php endpoint
   * This is the most reliable method as it returns:
   * - Full name from official registry
   * - Photo URL
   * - DNI (extracted from photo URL)
   * - Regional council
   * - HABIL/INHABILITADO status
   *
   * @see docs/CEP-API.md for documentation
   */
  async validateCepComplete(cepNumber: string): Promise<CepValidationResult> {
    const cleanCep = cepNumber.replace(/\D/g, '');

    if (!cleanCep || cleanCep.length < 4 || cleanCep.length > 6) {
      return {
        isValid: false,
        error: 'Número de CEP inválido (debe tener 4-6 dígitos)',
      };
    }

    try {
      this.logger.log(`Validating CEP complete: ${cleanCep}`);

      // Step 1: Get session token from main page
      const pageResponse = await axios.get(`${this.BASE_URL}/validar/`, {
        httpsAgent: this.httpsAgent,
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      const tokenMatch = pageResponse.data.match(/name="token" value="([^"]+)"/);
      const token = tokenMatch ? tokenMatch[1] : '';

      if (!token) {
        this.logger.warn('Could not extract token from CEP page');
        // Fall back to simple validation
        return this.validateByCep(cleanCep);
      }

      // Step 2: Call view.php with CEP and token
      const response = await axios.post(
        `${this.BASE_URL}/validar/pagina/view.php`,
        `cep=${cleanCep}&token=${encodeURIComponent(token)}`,
        {
          httpsAgent: this.httpsAgent,
          timeout: 10000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': `${this.BASE_URL}/validar/`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        },
      );

      const html = response.data;

      // Check for error response - if view.php fails, try alternative method
      if (html.includes('Error 504') || (html.includes('alert-danger') && !html.includes('fotos/'))) {
        this.logger.warn(`view.php returned error for CEP ${cleanCep}, trying alternative search`);

        // Fallback: Use bracket search to find nurse in database
        const searchResults = await this.searchByName(`[${cleanCep}`);
        const match = searchResults.find((r) => r.cep === cleanCep);

        if (match) {
          // Found via search, now try to get photo
          // Extract last name and search for photo by common pattern
          const nameParts = match.nombre.split(' ');
          return {
            isValid: true,
            data: {
              cepNumber: cleanCep,
              fullName: match.nombre,
              isNameVerified: true,
              isPhotoVerified: false, // We don't have DNI to check photo
              status: 'UNKNOWN',
            },
          };
        }

        return {
          isValid: false,
          error: 'No se encontró enfermera(o) con este número de CEP',
        };
      }

      // Step 3: Parse HTML response
      const photoMatch = html.match(/src="(https:\/\/www\.cep\.org\.pe\/fotos\/(\d+)\.jpg)"/);
      const nameMatch = html.match(/<h4 class="card-title[^"]*"><strong>([^<]+)<\/strong>/);
      const regionMatch = html.match(/<h6 class="card-subtitle">([^<]+)<\/h6>/);

      // Check HABIL status - look for success alert with HABIL text
      const isHabil = html.includes('alert-success') && html.includes('HABIL');
      const isInhabilitado = html.includes('alert-danger') && html.includes('INHABILITADO');

      if (!photoMatch && !nameMatch) {
        return {
          isValid: false,
          error: 'No se encontraron datos para este número de CEP',
        };
      }

      const dni = photoMatch?.[2];
      const fullName = nameMatch?.[1]?.trim().replace(/\s+/g, ' ');
      const region = regionMatch?.[1]?.trim();
      const photoUrl = photoMatch?.[1];

      // Determine status
      let status: 'HABIL' | 'INHABILITADO' | 'UNKNOWN' = 'UNKNOWN';
      if (isHabil) status = 'HABIL';
      else if (isInhabilitado) status = 'INHABILITADO';

      this.logger.log(
        `CEP ${cleanCep} validation: Name=${fullName}, DNI=${dni}, Status=${status}`,
      );

      return {
        isValid: true,
        data: {
          cepNumber: cleanCep,
          fullName,
          dni,
          photoUrl,
          isPhotoVerified: !!photoUrl,
          isNameVerified: !!fullName,
          region,
          isHabil,
          status,
        },
      };
    } catch (error) {
      this.logger.error(`CEP complete validation error: ${error.message}`);

      // Fall back to simple validation
      try {
        return this.validateByCep(cleanCep);
      } catch {
        return {
          isValid: false,
          error: `Error al validar CEP: ${error.message}`,
        };
      }
    }
  }

  /**
   * Full validation combining CEP lookup and DNI verification
   * Use this when you have both CEP and DNI to cross-reference
   */
  async validateWithDni(cepNumber: string, dni: string): Promise<CepValidationResult> {
    const cleanCep = cepNumber.replace(/\D/g, '');
    const cleanDni = dni.replace(/\D/g, '');

    if (!/^\d{8}$/.test(cleanDni)) {
      return {
        isValid: false,
        error: 'DNI debe tener 8 dígitos',
      };
    }

    // First, try the complete CEP validation via view.php
    const cepResult = await this.validateCepComplete(cleanCep);

    // If view.php succeeded, cross-reference DNI
    if (cepResult.isValid && cepResult.data) {
      // Cross-reference: DNI from CEP photo should match provided DNI
      if (cepResult.data.dni && cepResult.data.dni !== cleanDni) {
        return {
          isValid: false,
          error: 'El DNI ingresado no coincide con el registrado en el CEP. Por favor verifica el número e intenta nuevamente.',
        };
      }

      // If CEP didn't return DNI, verify photo exists for the provided DNI
      if (!cepResult.data.dni) {
        const photoCheck = await this.checkPhotoByDni(cleanDni);
        if (photoCheck.exists) {
          cepResult.data.dni = cleanDni;
          cepResult.data.photoUrl = photoCheck.url;
          cepResult.data.isPhotoVerified = true;
        }
      }

      // Check if nurse is HABIL
      if (cepResult.data.status === 'INHABILITADO') {
        return {
          isValid: false,
          error: 'La enfermera(o) se encuentra INHABILITADA para ejercer',
          data: cepResult.data,
        };
      }

      return cepResult;
    }

    // Fallback: view.php failed, use photo check + search by name
    this.logger.warn(`view.php failed for CEP ${cleanCep}, using photo check fallback`);

    // Step 1: Check if photo exists for this DNI (confirms registration)
    const photoCheck = await this.checkPhotoByDni(cleanDni);

    if (!photoCheck.exists) {
      return {
        isValid: false,
        error: 'No se encontró registro de enfermera(o) con este DNI en el CEP',
      };
    }

    // Step 2: Photo exists, so the person is registered. Now verify CEP number.
    // We need to find their name to search and confirm CEP matches
    // Since we can't get the name from view.php, we'll trust the photo as primary validation
    // and return success with available data

    this.logger.log(`Photo found for DNI ${cleanDni}, CEP validation via photo fallback`);

    return {
      isValid: true,
      data: {
        cepNumber: cleanCep,
        dni: cleanDni,
        photoUrl: photoCheck.url,
        isPhotoVerified: true,
        isNameVerified: false, // We couldn't verify name via view.php
        status: 'UNKNOWN', // Can't determine HABIL status without view.php
      },
    };
  }
}
