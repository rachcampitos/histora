import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schema/user.schema';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { RespondComplaintDto } from './dto/respond-complaint.dto';

@ApiTags('Complaints')
@Controller('complaints')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear reclamo o queja (Libro de Reclamaciones)' })
  @ApiResponse({ status: 201, description: 'Reclamo creado exitosamente' })
  async create(
    @Request() req: { user: { userId: string; role: string } },
    @Body() dto: CreateComplaintDto,
  ) {
    return this.complaintsService.create(req.user.userId, req.user.role, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Obtener mis reclamos' })
  @ApiResponse({ status: 200, description: 'Lista de reclamos del usuario' })
  async getMyComplaints(
    @Request() req: { user: { userId: string } },
  ) {
    return this.complaintsService.findByUser(req.user.userId);
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener todos los reclamos (Admin)' })
  @ApiResponse({ status: 200, description: 'Lista de todos los reclamos' })
  async findAll() {
    return this.complaintsService.findAll();
  }

  @Patch(':id/respond')
  @Roles(UserRole.PLATFORM_ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Responder a un reclamo (Admin)' })
  @ApiResponse({ status: 200, description: 'Respuesta registrada' })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondComplaintDto,
  ) {
    return this.complaintsService.respond(id, dto);
  }
}
