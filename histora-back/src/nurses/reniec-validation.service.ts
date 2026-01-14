import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ReniecUsage } from './schema/reniec-usage.schema';

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
  usage?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface ReniecUsageStats {
  year: number;
  month: number;
  used: number;
  limit: number;
  remaining: number;
  recentQueries: Array<{ dni: string; timestamp: Date; success: boolean }>;
}

@Injectable()
export class ReniecValidationService {
  private readonly logger = new Logger(ReniecValidationService.name);
  private readonly apiToken: string;
  private readonly apiProvider: string;
  private readonly queryLimit: number;

  constructor(
    private configService: ConfigService,
    @InjectModel(ReniecUsage.name) private reniecUsageModel: Model<ReniecUsage>,
  ) {
    this.apiToken = this.configService.get<string>('RENIEC_API_TOKEN') || '';
    this.apiProvider = this.configService.get<string>('RENIEC_API_PROVIDER') || 'decolecta';
    this.queryLimit = this.configService.get<number>('RENIEC_QUERY_LIMIT') || 100;

    if (!this.apiToken) {
      this.logger.warn('RENIEC_API_TOKEN not configured - DNI name lookup will be disabled');
    } else {
      this.logger.log(`RENIEC API configured with provider: ${this.apiProvider}, limit: ${this.queryLimit}/month`);
    }
  }

  /**
   * Get current month's usage statistics
   */
  async getUsageStats(): Promise<ReniecUsageStats> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    let usage = await this.reniecUsageModel.findOne({ year, month });

    if (!usage) {
      usage = await this.reniecUsageModel.create({
        year,
        month,
        queryCount: 0,
        queryLimit: this.queryLimit,
        queries: [],
      });
    }

    return {
      year,
      month,
      used: usage.queryCount,
      limit: usage.queryLimit,
      remaining: Math.max(0, usage.queryLimit - usage.queryCount),
      recentQueries: usage.queries.slice(-10).reverse(),
    };
  }

  /**
   * Track a RENIEC query
   */
  private async trackQuery(dni: string, success: boolean): Promise<{ used: number; limit: number; remaining: number }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const usage = await this.reniecUsageModel.findOneAndUpdate(
      { year, month },
      {
        $inc: { queryCount: 1 },
        $push: {
          queries: {
            $each: [{ dni, timestamp: now, success }],
            $slice: -100, // Keep only last 100 queries
          },
        },
        $setOnInsert: { queryLimit: this.queryLimit },
      },
      { upsert: true, new: true },
    );

    const stats = {
      used: usage.queryCount,
      limit: usage.queryLimit,
      remaining: Math.max(0, usage.queryLimit - usage.queryCount),
    };

    this.logger.log(`RENIEC query tracked: ${dni} (${success ? 'success' : 'failed'}) - Used: ${stats.used}/${stats.limit}`);

    return stats;
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

    // Check if we've exceeded the limit
    const currentStats = await this.getUsageStats();
    if (currentStats.remaining <= 0) {
      this.logger.warn(`RENIEC query limit exceeded: ${currentStats.used}/${currentStats.limit}`);
      return {
        success: false,
        error: `Límite de consultas RENIEC excedido (${currentStats.used}/${currentStats.limit}). Se renueva el próximo mes.`,
        usage: {
          used: currentStats.used,
          limit: currentStats.limit,
          remaining: 0,
        },
      };
    }

    try {
      let result: ReniecValidationResult;

      switch (this.apiProvider) {
        case 'decolecta':
          result = await this.queryDecolecta(cleanDni);
          break;
        case 'apis.net.pe':
          result = await this.queryApisNetPe(cleanDni);
          break;
        case 'apidni.com':
          result = await this.queryApiDni(cleanDni);
          break;
        case 'dniruc.com':
          result = await this.queryDniRuc(cleanDni);
          break;
        default:
          result = await this.queryDecolecta(cleanDni);
      }

      // Track the query
      const usage = await this.trackQuery(cleanDni, result.success);
      result.usage = usage;

      return result;
    } catch (error) {
      // Track failed query
      const usage = await this.trackQuery(cleanDni, false);

      this.logger.error(`RENIEC validation error: ${error.message}`);
      return {
        success: false,
        error: `Error al consultar RENIEC: ${error.message}`,
        usage,
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
          return { success: false, error: 'Límite de consultas excedido en el proveedor' };
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
