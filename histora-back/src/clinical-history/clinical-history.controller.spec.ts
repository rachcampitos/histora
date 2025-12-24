import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalHistoryController } from './clinical-history.controller';
import { getModelToken } from '@nestjs/mongoose';
import { Doctor } from '../doctors/schema/doctor.schema';
import { Patient } from '../patients/schemas/patients.schema';
import { ClinicalHistoryService } from './clinical-history.service';
import { ClinicalHistory } from './schema/clinical-history.schema';

describe('ClinicalHistoryController', () => {
  let controller: ClinicalHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalHistoryController],
      providers: [
        ClinicalHistoryService,
        {
          provide: getModelToken(ClinicalHistory.name),
          useValue: {},
        },
        {
          provide: getModelToken(Patient.name),
          useValue: {},
        },
        {
          provide: getModelToken(Doctor.name),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ClinicalHistoryController>(
      ClinicalHistoryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
