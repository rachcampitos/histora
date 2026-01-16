import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { AdminService } from './admin.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/admin-user.dto';
import { NurseQueryDto, UpdateNurseDto, PatientQueryDto } from './dto/admin-nurse.dto';
import {
  DashboardStatsDto,
  PanicAlertDto,
  ActivityItemDto,
  PendingVerificationDto,
  ServiceChartDataDto,
  LowRatedReviewDto,
  ExpiringVerificationDto,
} from './dto/dashboard.dto';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== DASHBOARD ENDPOINTS ====================

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Obtener estadísticas del dashboard de Histora Care' })
  @ApiResponse({ status: 200, description: 'Estadísticas consolidadas', type: DashboardStatsDto })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/activity')
  @ApiOperation({ summary: 'Obtener actividad reciente (últimas 24 horas)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite de resultados (default: 20)' })
  @ApiResponse({ status: 200, description: 'Lista de actividad reciente', type: [ActivityItemDto] })
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.adminService.getRecentActivity(limit || 20);
  }

  @Get('dashboard/alerts')
  @ApiOperation({ summary: 'Obtener alertas de pánico activas' })
  @ApiResponse({ status: 200, description: 'Lista de alertas activas', type: [PanicAlertDto] })
  async getActivePanicAlerts() {
    return this.adminService.getActivePanicAlerts();
  }

  @Get('dashboard/verifications/pending')
  @ApiOperation({ summary: 'Obtener verificaciones pendientes de enfermeras' })
  @ApiResponse({ status: 200, description: 'Lista de verificaciones pendientes', type: [PendingVerificationDto] })
  async getPendingVerifications() {
    return this.adminService.getPendingVerifications();
  }

  @Get('dashboard/services/chart')
  @ApiOperation({ summary: 'Obtener datos de servicios para gráfico (últimos 7 días)' })
  @ApiResponse({ status: 200, description: 'Datos para gráfico de servicios', type: [ServiceChartDataDto] })
  async getServiceChartData() {
    return this.adminService.getServiceChartData();
  }

  @Get('dashboard/reviews/low-rated')
  @ApiOperation({ summary: 'Obtener reseñas con baja calificación (1-2 estrellas)' })
  @ApiResponse({ status: 200, description: 'Lista de reseñas negativas', type: [LowRatedReviewDto] })
  async getLowRatedReviews() {
    return this.adminService.getLowRatedReviews();
  }

  @Get('dashboard/verifications/expiring')
  @ApiOperation({ summary: 'Obtener verificaciones próximas a vencer' })
  @ApiResponse({ status: 200, description: 'Lista de verificaciones por vencer', type: [ExpiringVerificationDto] })
  async getExpiringVerifications() {
    return this.adminService.getExpiringVerifications();
  }

  // ==================== USER MANAGEMENT ENDPOINTS ====================

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getUsers(@Query() query: UserQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Obtener detalle de un usuario' })
  @ApiResponse({ status: 200, description: 'Detalle del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Post('users')
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Patch('users/:id/toggle-status')
  @ApiOperation({ summary: 'Activar/Desactivar usuario' })
  @ApiResponse({ status: 200, description: 'Estado del usuario actualizado' })
  async toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  @Post('users/:id/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña de usuario' })
  @ApiResponse({ status: 200, description: 'Contraseña restablecida' })
  async resetUserPassword(@Param('id') id: string) {
    return this.adminService.resetUserPassword(id);
  }

  // ==================== NURSE MANAGEMENT ENDPOINTS ====================

  @Get('nurses')
  @ApiOperation({ summary: 'Listar todas las enfermeras con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de enfermeras' })
  async getNurses(@Query() query: NurseQueryDto) {
    return this.adminService.getNurses(query);
  }

  @Get('nurses/:id')
  @ApiOperation({ summary: 'Obtener detalle de una enfermera' })
  @ApiResponse({ status: 200, description: 'Detalle de la enfermera' })
  @ApiResponse({ status: 404, description: 'Enfermera no encontrada' })
  async getNurse(@Param('id') id: string) {
    return this.adminService.getNurse(id);
  }

  @Patch('nurses/:id')
  @ApiOperation({ summary: 'Actualizar perfil de enfermera' })
  @ApiResponse({ status: 200, description: 'Enfermera actualizada' })
  @ApiResponse({ status: 404, description: 'Enfermera no encontrada' })
  async updateNurse(@Param('id') id: string, @Body() updateNurseDto: UpdateNurseDto) {
    return this.adminService.updateNurse(id, updateNurseDto);
  }

  @Delete('nurses/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar enfermera (soft delete)' })
  @ApiResponse({ status: 200, description: 'Enfermera eliminada' })
  @ApiResponse({ status: 404, description: 'Enfermera no encontrada' })
  @ApiResponse({ status: 409, description: 'Tiene servicios activos' })
  async deleteNurse(@Param('id') id: string) {
    return this.adminService.deleteNurse(id);
  }

  @Patch('nurses/:id/toggle-status')
  @ApiOperation({ summary: 'Activar/Desactivar enfermera' })
  @ApiResponse({ status: 200, description: 'Estado de enfermera actualizado' })
  async toggleNurseStatus(@Param('id') id: string) {
    return this.adminService.toggleNurseStatus(id);
  }

  @Patch('nurses/:id/toggle-availability')
  @ApiOperation({ summary: 'Cambiar disponibilidad de enfermera' })
  @ApiResponse({ status: 200, description: 'Disponibilidad actualizada' })
  @ApiResponse({ status: 409, description: 'Enfermera inactiva' })
  async toggleNurseAvailability(@Param('id') id: string) {
    return this.adminService.toggleNurseAvailability(id);
  }

  // ==================== PATIENT MANAGEMENT ENDPOINTS ====================

  @Get('patients')
  @ApiOperation({ summary: 'Listar pacientes de Histora Care con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  async getPatients(@Query() query: PatientQueryDto) {
    return this.adminService.getPatients(query);
  }

  @Get('patients/:id')
  @ApiOperation({ summary: 'Obtener detalle de un paciente' })
  @ApiResponse({ status: 200, description: 'Detalle del paciente' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async getPatient(@Param('id') id: string) {
    return this.adminService.getPatient(id);
  }
}
