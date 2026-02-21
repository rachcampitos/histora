import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NursesService } from '../../nurses/nurses.service';
import { ServiceRequestsService } from '../../service-requests/service-requests.service';
import { User } from '../../users/schema/user.schema';

// District coordinates for Lima (approximate centers)
const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  miraflores: { lat: -12.1191, lng: -77.0300 },
  'san isidro': { lat: -12.0978, lng: -77.0367 },
  'san borja': { lat: -12.1050, lng: -77.0087 },
  surco: { lat: -12.1467, lng: -76.9922 },
  'santiago de surco': { lat: -12.1467, lng: -76.9922 },
  'la molina': { lat: -12.0833, lng: -76.9333 },
  barranco: { lat: -12.1478, lng: -77.0217 },
  chorrillos: { lat: -12.1711, lng: -77.0156 },
  'jesus maria': { lat: -12.0711, lng: -77.0456 },
  lince: { lat: -12.0833, lng: -77.0333 },
  magdalena: { lat: -12.0917, lng: -77.0694 },
  'pueblo libre': { lat: -12.0756, lng: -77.0633 },
  'san miguel': { lat: -12.0778, lng: -77.0889 },
  ate: { lat: -12.0258, lng: -76.9183 },
  'santa anita': { lat: -12.0433, lng: -76.9700 },
  'la victoria': { lat: -12.0667, lng: -77.0167 },
  lima: { lat: -12.0464, lng: -77.0428 },
};

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class ToolHandlerService {
  private readonly logger = new Logger(ToolHandlerService.name);

  constructor(
    private readonly nursesService: NursesService,
    private readonly serviceRequestsService: ServiceRequestsService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  /**
   * Execute a tool call and return the result
   */
  async executeTool(toolName: string, toolInput: Record<string, any>): Promise<ToolResult> {
    this.logger.log(`Executing tool: ${toolName} with input: ${JSON.stringify(toolInput)}`);

    switch (toolName) {
      case 'buscar_enfermeras':
        return this.buscarEnfermeras(toolInput);
      case 'ver_servicios':
        return this.verServicios();
      case 'crear_solicitud':
        return this.crearSolicitud(toolInput);
      case 'ver_estado_solicitud':
        return this.verEstadoSolicitud(toolInput);
      default:
        return { success: false, error: `Tool desconocido: ${toolName}` };
    }
  }

  /**
   * Search available nurses by service type and district
   */
  private async buscarEnfermeras(input: Record<string, any>): Promise<ToolResult> {
    try {
      const distrito = (input.distrito || '').toLowerCase();
      const coords = DISTRICT_COORDS[distrito];

      if (!coords) {
        return {
          success: true,
          data: {
            message: `No tenemos cobertura confirmada en "${input.distrito}". Distritos disponibles: ${Object.keys(DISTRICT_COORDS).join(', ')}`,
            nurses: [],
          },
        };
      }

      const results = await this.nursesService.searchNearby({
        lat: coords.lat,
        lng: coords.lng,
        radius: 10,
        category: input.categoria || undefined,
        availableNow: true,
      });

      const nurseSummaries = results.slice(0, 5).map((r) => {
        const nurse = r.nurse as any;
        const minPrice = nurse.services?.length
          ? Math.min(...nurse.services.filter((s: any) => s.isActive).map((s: any) => s.price))
          : 0;
        return {
          id: nurse._id?.toString(),
          nombre: `${nurse.user?.firstName || ''} ${nurse.user?.lastName || ''}`.trim(),
          rating: nurse.averageRating?.toFixed(1) || '0.0',
          totalReviews: nurse.totalReviews || 0,
          cepVerified: nurse.cepVerified || false,
          precioDesde: minPrice,
          distanciaKm: r.distance.toFixed(1),
          servicios: nurse.services
            ?.filter((s: any) => s.isActive)
            .slice(0, 3)
            .map((s: any) => `${s.name} (S/${s.price})`) || [],
        };
      });

      return {
        success: true,
        data: {
          total: results.length,
          distrito: input.distrito,
          nurses: nurseSummaries,
        },
      };
    } catch (error) {
      this.logger.error(`Error searching nurses: ${error.message}`);
      return { success: false, error: 'Error buscando enfermeras' };
    }
  }

  /**
   * List available service categories with prices
   */
  private async verServicios(): Promise<ToolResult> {
    return {
      success: true,
      data: {
        servicios: [
          { categoria: 'elderly_care', nombre: 'Cuidado Adulto Mayor', precioDesde: 120, duracion: '2-12h' },
          { categoria: 'injection', nombre: 'Inyecciones a Domicilio', precioDesde: 30, duracion: '10-30min' },
          { categoria: 'vital_signs', nombre: 'Control de Signos Vitales', precioDesde: 35, duracion: '15-30min' },
          { categoria: 'wound_care', nombre: 'Curacion de Heridas', precioDesde: 60, duracion: '30-45min' },
          { categoria: 'catheter', nombre: 'Sonda/Cateter', precioDesde: 80, duracion: '30-60min' },
          { categoria: 'iv_therapy', nombre: 'Terapia IV', precioDesde: 70, duracion: '30-60min' },
          { categoria: 'blood_draw', nombre: 'Toma de Sangre', precioDesde: 40, duracion: '15-30min' },
          { categoria: 'medication', nombre: 'Medicacion', precioDesde: 40, duracion: '15-30min' },
          { categoria: 'post_surgery', nombre: 'Cuidado Post-Operatorio', precioDesde: 100, duracion: '2-8h' },
        ],
      },
    };
  }

  /**
   * Create a service request on behalf of a WhatsApp user
   */
  private async crearSolicitud(input: Record<string, any>): Promise<ToolResult> {
    try {
      const phoneNumber = input.telefono_usuario;
      if (!phoneNumber) {
        return { success: false, error: 'Se necesita el numero de telefono del usuario' };
      }

      // Find user by phone number
      const phone = phoneNumber.replace(/\D/g, '');
      const user = await this.userModel.findOne({
        $or: [
          { phone },
          { phone: `+${phone}` },
          { phone: `+51${phone}` },
          { phone: phone.replace(/^51/, '') },
        ],
        isDeleted: false,
      });

      if (!user) {
        return {
          success: false,
          error: 'NO_ACCOUNT',
          data: {
            message: 'Este numero no esta registrado en NurseLite. El usuario debe registrarse primero.',
            registroUrl: 'https://app.nurse-lite.com/auth/register?type=patient',
          },
        };
      }

      if (!input.nurse_id || !input.service_id) {
        return {
          success: false,
          error: 'Se necesita nurse_id y service_id para crear la solicitud',
        };
      }

      const distrito = (input.distrito || '').toLowerCase();
      const coords = DISTRICT_COORDS[distrito] || DISTRICT_COORDS.lima;

      const request = await this.serviceRequestsService.create(
        (user as any)._id.toString(),
        {
          nurseId: input.nurse_id,
          serviceId: input.service_id,
          location: {
            coordinates: [coords.lng, coords.lat],
            address: input.direccion || `${input.distrito || 'Lima'}, Lima`,
            district: input.distrito || 'Lima',
            city: 'Lima',
          },
          requestedDate: input.fecha || new Date().toISOString().split('T')[0],
          requestedTimeSlot: input.horario || 'asap',
          patientNotes: input.notas || 'Solicitud creada via WhatsApp',
        },
      );

      return {
        success: true,
        data: {
          requestId: (request as any)._id?.toString(),
          status: 'pending',
          message: 'Solicitud creada exitosamente. La enfermera sera notificada.',
        },
      };
    } catch (error) {
      this.logger.error(`Error creating service request: ${error.message}`);
      return { success: false, error: `Error creando solicitud: ${error.message}` };
    }
  }

  /**
   * Check status of an existing service request
   */
  private async verEstadoSolicitud(input: Record<string, any>): Promise<ToolResult> {
    try {
      const phoneNumber = input.telefono_usuario;
      if (!phoneNumber) {
        return { success: false, error: 'Se necesita el numero de telefono del usuario' };
      }

      const phone = phoneNumber.replace(/\D/g, '');
      const user = await this.userModel.findOne({
        $or: [
          { phone },
          { phone: `+${phone}` },
          { phone: `+51${phone}` },
          { phone: phone.replace(/^51/, '') },
        ],
        isDeleted: false,
      });

      if (!user) {
        return {
          success: false,
          error: 'NO_ACCOUNT',
          data: {
            message: 'Este numero no esta registrado en NurseLite.',
            registroUrl: 'https://app.nurse-lite.com/auth/register?type=patient',
          },
        };
      }

      const requests = await this.serviceRequestsService.findByPatient(
        (user as any)._id.toString(),
      );

      const activeStatuses = ['pending', 'accepted', 'on_the_way', 'arrived', 'in_progress'];
      const activeRequests = (requests as any[])
        .filter((r) => activeStatuses.includes(r.status))
        .slice(0, 3);

      if (activeRequests.length === 0) {
        return {
          success: true,
          data: { message: 'No tienes solicitudes activas en este momento.', requests: [] },
        };
      }

      const statusLabels: Record<string, string> = {
        pending: 'Pendiente',
        accepted: 'Aceptado',
        on_the_way: 'En camino',
        arrived: 'Llego',
        in_progress: 'En progreso',
      };

      return {
        success: true,
        data: {
          requests: activeRequests.map((r: any) => ({
            id: r._id?.toString(),
            servicio: r.service?.name,
            estado: statusLabels[r.status] || r.status,
            fecha: r.requestedDate,
            distrito: r.location?.district,
          })),
        },
      };
    } catch (error) {
      this.logger.error(`Error checking request status: ${error.message}`);
      return { success: false, error: 'Error consultando estado' };
    }
  }
}
