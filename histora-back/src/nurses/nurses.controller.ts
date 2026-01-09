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
import { NursesService } from './nurses.service';
import {
  CreateNurseDto,
  UpdateNurseDto,
  SearchNurseDto,
  UpdateNurseLocationDto,
  UpdateNurseAvailabilityDto,
  AddNurseServiceDto,
  UpdateNurseServiceDto,
} from './dto';

@ApiTags('Nurses')
@Controller('nurses')
export class NursesController {
  constructor(private readonly nursesService: NursesService) {}

  // Public endpoint: Search nurses nearby
  @Get('search')
  @ApiOperation({ summary: 'Search nurses nearby by location' })
  @ApiResponse({ status: 200, description: 'List of nurses with distance' })
  async searchNearby(@Query() searchDto: SearchNurseDto) {
    return this.nursesService.searchNearby(searchDto);
  }

  // Protected: Get my nurse profile (MUST be before :id route)
  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my nurse profile' })
  @ApiResponse({ status: 200, description: 'My nurse profile' })
  async getMyProfile(@Request() req: { user: { userId: string } }) {
    return this.nursesService.findByUserId(req.user.userId);
  }

  // Public endpoint: Get nurse profile by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get nurse profile by ID' })
  @ApiResponse({ status: 200, description: 'Nurse profile' })
  @ApiResponse({ status: 404, description: 'Nurse not found' })
  async findById(@Param('id') id: string) {
    return this.nursesService.findById(id);
  }

  // Protected: Update my nurse profile
  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my nurse profile' })
  @ApiResponse({ status: 200, description: 'Updated nurse profile' })
  async updateMyProfile(
    @Request() req: { user: { userId: string } },
    @Body() updateNurseDto: UpdateNurseDto,
  ) {
    return this.nursesService.update(req.user.userId, updateNurseDto);
  }

  // Protected: Update my location
  @Patch('me/location')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my location' })
  @ApiResponse({ status: 200, description: 'Updated nurse profile' })
  async updateLocation(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateNurseLocationDto,
  ) {
    return this.nursesService.updateLocation(req.user.userId, dto.location);
  }

  // Protected: Set availability
  @Patch('me/availability')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set availability status' })
  @ApiResponse({ status: 200, description: 'Updated nurse profile' })
  async setAvailability(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateNurseAvailabilityDto,
  ) {
    return this.nursesService.setAvailability(req.user.userId, dto.isAvailable);
  }

  // Protected: Add a service
  @Post('me/services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new service' })
  @ApiResponse({ status: 201, description: 'Service added' })
  async addService(
    @Request() req: { user: { userId: string } },
    @Body() serviceDto: AddNurseServiceDto,
  ) {
    return this.nursesService.addService(req.user.userId, serviceDto);
  }

  // Protected: Update a service
  @Patch('me/services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service' })
  @ApiResponse({ status: 200, description: 'Service updated' })
  async updateService(
    @Request() req: { user: { userId: string } },
    @Param('serviceId') serviceId: string,
    @Body() serviceDto: UpdateNurseServiceDto,
  ) {
    return this.nursesService.updateService(req.user.userId, serviceId, serviceDto);
  }

  // Protected: Remove a service
  @Delete('me/services/:serviceId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a service' })
  @ApiResponse({ status: 200, description: 'Service removed' })
  async removeService(
    @Request() req: { user: { userId: string } },
    @Param('serviceId') serviceId: string,
  ) {
    return this.nursesService.removeService(req.user.userId, serviceId);
  }

  // Protected: Get earnings
  @Get('me/earnings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.NURSE)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my earnings' })
  @ApiResponse({ status: 200, description: 'Earnings summary' })
  async getEarnings(
    @Request() req: { user: { userId: string } },
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.nursesService.getEarnings(
      req.user.userId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
