import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { Patient } from './schemas/patients.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ClinicAccessGuard } from '../auth/guards/clinic-access.guard';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Patients')
@ApiBearerAuth('JWT-auth')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard, ClinicAccessGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Crear nuevo paciente' })
  @ApiResponse({ status: 201, description: 'Paciente creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  create(
    @Body() createPatientDto: CreatePatientDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Patient> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.patientsService.create(user.clinicId, createPatientDto);
  }

  @Get()
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Listar pacientes de la clínica' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nombre o email' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados (default: 20)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset para paginación' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes paginada' })
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ data: Patient[]; total: number; limit: number; offset: number }> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    const [data, total] = await Promise.all([
      this.patientsService.findAllPaginated(user.clinicId, search, limitNum, offsetNum),
      this.patientsService.countByClinic(user.clinicId, search),
    ]);

    return { data, total, limit: limitNum, offset: offsetNum };
  }

  @Get('search')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Buscar pacientes' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  @ApiResponse({ status: 200, description: 'Resultados de búsqueda' })
  async search(
    @Query('q') query: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Patient[]> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.patientsService.search(user.clinicId, query || '');
  }

  @Get('count')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Contar pacientes de la clínica' })
  @ApiResponse({ status: 200, description: 'Número total de pacientes' })
  async count(@CurrentUser() user: CurrentUserData): Promise<{ count: number }> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    const count = await this.patientsService.countByClinic(user.clinicId);
    return { count };
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  @ApiParam({ name: 'id', description: 'ID del paciente' })
  @ApiResponse({ status: 200, description: 'Datos del paciente' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Patient> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.patientsService.findOne(id, user.clinicId);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Actualizar paciente' })
  @ApiParam({ name: 'id', description: 'ID del paciente' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  update(
    @Param('id') id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Patient | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.patientsService.update(id, user.clinicId, updatePatientDto);
  }

  @Delete(':id')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR, UserRole.CLINIC_STAFF)
  @ApiOperation({ summary: 'Eliminar paciente (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del paciente' })
  @ApiResponse({ status: 200, description: 'Paciente eliminado' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string }> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    await this.patientsService.remove(id, user.clinicId);
    return { message: `Patient with ID ${id} deleted successfully` };
  }

  @Patch(':id/restore')
  @Roles(UserRole.CLINIC_OWNER, UserRole.CLINIC_DOCTOR)
  @ApiOperation({ summary: 'Restaurar paciente eliminado' })
  @ApiParam({ name: 'id', description: 'ID del paciente' })
  @ApiResponse({ status: 200, description: 'Paciente restaurado' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async restore(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<Patient | null> {
    if (!user.clinicId) {
      throw new ForbiddenException('User must be associated with a clinic');
    }
    return this.patientsService.restore(id, user.clinicId);
  }
}
