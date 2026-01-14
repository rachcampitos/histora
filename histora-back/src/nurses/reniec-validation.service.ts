import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ReniecPersonData {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  nombreCompleto: string;
  codVerifica?: string;
}

export interface ReniecValidationResult {
  success: boolean;
  data?: ReniecPersonData;
  error?: string;
}

@Injectable()
export class ReniecValidationService {
  private readonly logger = new Logger(ReniecValidationService.name);
  private readonly apiToken: string;
  private readonly apiProvider: string;

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get<string>('RENIEC_API_TOKEN') || '';
    this.apiProvider = this.configService.get<string>('RENIEC_API_PROVIDER') || 'decolecta';

    if (!this.apiToken) {
      this.logger.warn('RENIEC_API_TOKEN not configured - DNI name lookup will be disabled');
    } else {
      this.logger.log(`RENIEC API configured with provider: ${this.apiProvider}`);
    }
  }

  /**
   * Validate DNI and get person data from RENIEC
   * Supports multiple API providers
   */
  async validateDni(dni: string): Promise<ReniecValidationResult> {
    const cleanDni = dni.replace(/\D/g, '');

    if (!/^\d{8}$/.test(cleanDni)) {
      return {
        success: false,
        error: 'El DNI debe tener 8 dígitos',
      };
    }

    if (!this.apiToken) {
      return {
        success: false,
        error: 'RENIEC API no configurada',
      };
    }

    try {
      switch (this.apiProvider) {
        case 'decolecta':
          return await this.queryDecolecta(cleanDni);
        case 'apis.net.pe':
          return await this.queryApisNetPe(cleanDni);
        case 'apidni.com':
          return await this.queryApiDni(cleanDni);
        case 'dniruc.com':
          return await this.queryDniRuc(cleanDni);
        default:
          return await this.queryDecolecta(cleanDni);
      }
    } catch (error) {
      this.logger.error(`RENIEC validation error: ${error.message}`);
      return {
        success: false,
        error: `Error al consultar RENIEC: ${error.message}`,
      };
    }
  }

  /**
   * Query Decolecta API (100 free queries/month)
   * API Docs: https://decolecta.gitbook.io/docs
   */
  private async queryDecolecta(dni: string): Promise<ReniecValidationResult> {
    try {
      const response = await axios.get(
        `https://api.decolecta.com/v1/reniec/dni/${dni}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            dni: data.numero || dni,
            nombres: data.nombres,
            apellidoPaterno: data.apellido_paterno,
            apellidoMaterno: data.apellido_materno,
            nombreCompleto: data.nombre_completo || `${data.apellido_paterno} ${data.apellido_materno} ${data.nombres}`.trim(),
            codVerifica: data.codigo_verificacion,
          },
        };
      }

      return {
        success: false,
        error: response.data?.message || 'No se encontraron datos para este DNI',
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          return { success: false, error: 'Token de API inválido' };
        }
        if (status === 404) {
          return { success: false, error: 'DNI no encontrado en RENIEC' };
        }
        if (status === 429) {
          return { success: false, error: 'Límite de consultas excedido (100/mes)' };
        }
      }
      throw error;
    }
  }

  /**
   * Query apis.net.pe (free tier available)
   * API Docs: https://apis.net.pe/
   */
  private async queryApisNetPe(dni: string): Promise<ReniecValidationResult> {
    try {
      const response = await axios.get(
        `https://api.apis.net.pe/v2/reniec/dni`,
        {
          params: { numero: dni },
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.nombres) {
        const data = response.data;
        return {
          success: true,
          data: {
            dni: data.numeroDocumento || dni,
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            nombreCompleto: `${data.apellidoPaterno} ${data.apellidoMaterno} ${data.nombres}`.trim(),
            codVerifica: data.digitoVerificador,
          },
        };
      }

      return {
        success: false,
        error: 'No se encontraron datos para este DNI',
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401) {
          return { success: false, error: 'Token de API inválido' };
        }
        if (status === 404) {
          return { success: false, error: 'DNI no encontrado en RENIEC' };
        }
        if (status === 429) {
          return { success: false, error: 'Límite de consultas excedido' };
        }
      }
      throw error;
    }
  }

  /**
   * Query apidni.com
   * API Docs: https://apidni.com/docs/
   */
  private async queryApiDni(dni: string): Promise<ReniecValidationResult> {
    try {
      const response = await axios.get(
        `https://apidni.com/api/v1/dni/${dni}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.apiToken}`,
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        return {
          success: true,
          data: {
            dni: data.numero || dni,
            nombres: data.nombres,
            apellidoPaterno: data.apellido_paterno,
            apellidoMaterno: data.apellido_materno,
            nombreCompleto: data.nombre_completo || `${data.apellido_paterno} ${data.apellido_materno} ${data.nombres}`.trim(),
          },
        };
      }

      return {
        success: false,
        error: response.data?.message || 'No se encontraron datos para este DNI',
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.message || 'Error al consultar API',
        };
      }
      throw error;
    }
  }

  /**
   * Query dniruc.com
   * API Docs: https://dniruc.com/
   */
  private async queryDniRuc(dni: string): Promise<ReniecValidationResult> {
    try {
      const response = await axios.get(
        `https://dniruc.apisperu.com/api/v1/dni/${dni}`,
        {
          params: { token: this.apiToken },
          headers: {
            'Accept': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data && response.data.nombres) {
        const data = response.data;
        return {
          success: true,
          data: {
            dni: data.dni || dni,
            nombres: data.nombres,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            nombreCompleto: `${data.apellidoPaterno} ${data.apellidoMaterno} ${data.nombres}`.trim(),
            codVerifica: data.codVerifica,
          },
        };
      }

      return {
        success: false,
        error: 'No se encontraron datos para este DNI',
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data?.message || 'Error al consultar API',
        };
      }
      throw error;
    }
  }

  /**
   * Check if RENIEC API is configured
   */
  isConfigured(): boolean {
    return !!this.apiToken;
  }

  /**
   * Get the configured provider name
   */
  getProvider(): string {
    return this.apiProvider;
  }
}
