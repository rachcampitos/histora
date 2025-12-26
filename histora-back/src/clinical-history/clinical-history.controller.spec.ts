import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalHistoryController } from './clinical-history.controller';
import { getModelToken } from '@nestjs/mongoose';
import { ClinicalHistoryService } from './clinical-history.service';
import { ClinicalHistory } from './schema/clinical-history.schema';
import { createMockModel } from '../../test/mocks/mongoose-model.mock';

describe('ClinicalHistoryController', () => {
  let controller: ClinicalHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalHistoryController],
      providers: [
        ClinicalHistoryService,
        {
          provide: getModelToken(ClinicalHistory.name),
          useValue: createMockModel(),
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
