import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalHistoryController } from './clinical-history.controller';

describe('ClinicalHistoryController', () => {
  let controller: ClinicalHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicalHistoryController],
    }).compile();

    controller = module.get<ClinicalHistoryController>(
      ClinicalHistoryController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
