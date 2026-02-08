import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
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
import { ServiceRequestsService } from './service-requests.service';
import {
  CreateServiceRequestDto,
  UpdateServiceRequestStatusDto,
  CancelServiceRequestDto,
  RejectServiceRequestDto,
  RateServiceRequestDto,
  VerifySecurityCodeDto,
} from './dto';

@ApiTags('Service Requests')
@Controller('service-requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  // Patient: Create a new service request
  @Post()
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Create a new service request (Patient)' })
  @ApiResponse({ status: 201, description: 'Service request created' })
  async create(
    @Request() req: { user: { userId: string } },
    @Body() createDto: CreateServiceRequestDto,
  ) {
    return this.serviceRequestsService.create(req.user.userId, createDto);
  }

  // Get a specific request
  @Get(':id')
  @ApiOperation({ summary: 'Get service request by ID' })
  @ApiResponse({ status: 200, description: 'Service request details' })
  async findById(@Param('id') id: string) {
    return this.serviceRequestsService.findById(id);
  }

  // Patient: Get my requests
  @Get('patient/me')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get my service requests (Patient)' })
  @ApiResponse({ status: 200, description: 'List of patient requests' })
  async getMyRequests(
    @Request() req: { user: { userId: string } },
    @Query('status') status?: string,
  ) {
    return this.serviceRequestsService.findByPatient(req.user.userId, status);
  }

  // Nurse: Get requests assigned to me
  @Get('nurse/me')
  @Roles(UserRole.NURSE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get requests assigned to me (Nurse)' })
  @ApiResponse({ status: 200, description: 'List of nurse requests' })
  async getNurseRequests(
    @Request() req: { user: { nurseId: string } },
    @Query('status') status?: string,
  ) {
    return this.serviceRequestsService.findByNurse(req.user.nurseId, status);
  }

  // Nurse: Get pending requests nearby
  @Get('pending/nearby')
  @Roles(UserRole.NURSE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Get pending requests nearby (Nurse)' })
  @ApiResponse({ status: 200, description: 'List of nearby pending requests' })
  async getPendingNearby(
    @Request() req: { user: { nurseId?: string } },
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 10,
  ) {
    return this.serviceRequestsService.findPendingNearby(
      lat,
      lng,
      radius,
      req.user.nurseId,
    );
  }

  // Nurse: Accept a request
  @Patch(':id/accept')
  @Roles(UserRole.NURSE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Accept a service request (Nurse)' })
  @ApiResponse({ status: 200, description: 'Request accepted' })
  async accept(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.serviceRequestsService.accept(id, req.user.userId);
  }

  // Nurse: Verify security code
  @Patch(':id/verify-code')
  @Roles(UserRole.NURSE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Verify patient security code (Nurse)' })
  @ApiResponse({ status: 200, description: 'Code verified successfully' })
  async verifySecurityCode(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() dto: VerifySecurityCodeDto,
  ) {
    return this.serviceRequestsService.verifySecurityCode(id, req.user.userId, dto.code);
  }

  // Nurse: Reject a request
  @Patch(':id/reject')
  @Roles(UserRole.NURSE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Reject a service request (Nurse)' })
  @ApiResponse({ status: 200, description: 'Request rejected' })
  async reject(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() rejectDto: RejectServiceRequestDto,
  ) {
    return this.serviceRequestsService.reject(id, req.user.userId, rejectDto.reason);
  }

  // Nurse: Update status
  @Patch(':id/status')
  @Roles(UserRole.NURSE)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update request status (Nurse)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() statusDto: UpdateServiceRequestStatusDto,
  ) {
    return this.serviceRequestsService.updateStatus(
      id,
      req.user.userId,
      statusDto.status,
      statusDto.note,
    );
  }

  // Patient/Nurse: Cancel a request
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a service request' })
  @ApiResponse({ status: 200, description: 'Request cancelled' })
  async cancel(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() cancelDto: CancelServiceRequestDto,
  ) {
    return this.serviceRequestsService.cancel(id, req.user.userId, cancelDto.reason);
  }

  // Patient: Rate and review
  @Patch(':id/rate')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Rate a completed service (Patient)' })
  @ApiResponse({ status: 200, description: 'Rating submitted' })
  async rate(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
    @Body() rateDto: RateServiceRequestDto,
  ) {
    return this.serviceRequestsService.rate(id, req.user.userId, rateDto);
  }
}
