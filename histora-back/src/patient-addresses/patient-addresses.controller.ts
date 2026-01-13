import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PatientAddressesService } from './patient-addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/schema/user.schema';

@ApiTags('Patient Addresses')
@Controller('patient-addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class PatientAddressesController {
  constructor(private readonly addressService: PatientAddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all addresses for current patient' })
  @ApiResponse({ status: 200, description: 'List of addresses' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.addressService.findAllByPatient(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get address by ID' })
  @ApiResponse({ status: 200, description: 'Address details' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.addressService.findById(user.userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new address' })
  @ApiResponse({ status: 201, description: 'Address created' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAddressDto,
  ) {
    return this.addressService.create(user.userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update address' })
  @ApiResponse({ status: 200, description: 'Address updated' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressService.update(user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete address' })
  @ApiResponse({ status: 200, description: 'Address deleted' })
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    await this.addressService.delete(user.userId, id);
    return { message: 'Dirección eliminada' };
  }

  @Post(':id/set-primary')
  @ApiOperation({ summary: 'Set address as primary' })
  @ApiResponse({ status: 200, description: 'Address set as primary' })
  async setPrimary(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.addressService.setPrimary(user.userId, id);
  }

  // ==================== Admin/Nurse Access ====================

  @Get('patient/:patientId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.NURSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Get patient addresses (for nurses)' })
  @ApiResponse({ status: 200, description: 'Patient addresses' })
  async getPatientAddresses(@Param('patientId') patientId: string) {
    return this.addressService.findAllByPatient(patientId);
  }

  @Post(':id/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Verify address (admin only)' })
  @ApiResponse({ status: 200, description: 'Address verified' })
  async verifyAddress(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.addressService.verifyAddress(id, user.userId);
  }

  @Patch(':id/safety-zone')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update safety zone (admin only)' })
  @ApiResponse({ status: 200, description: 'Safety zone updated' })
  async updateSafetyZone(
    @Param('id') id: string,
    @Body() body: { safetyZone: 'green' | 'yellow' | 'red' },
  ) {
    return this.addressService.updateSafetyZone(id, body.safetyZone);
  }
}
