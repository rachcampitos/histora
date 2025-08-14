// clinical-history.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Put,
} from '@nestjs/common';
import { ClinicalHistoryService } from './clinical-history.service';
import { CreateClinicalHistoryDto } from './dto/create-clinical-history.dto';

@Controller('clinical-history')
export class ClinicalHistoryController {
  constructor(private readonly service: ClinicalHistoryService) {}

  @Post()
  create(@Body() dto: CreateClinicalHistoryDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateClinicalHistoryDto>,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Put('restore/:id')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }
}
