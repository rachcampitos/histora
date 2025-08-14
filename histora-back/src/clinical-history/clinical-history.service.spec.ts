import { Test, TestingModule } from '@nestjs/testing';
import { ClinicalHistoryService } from './clinical-history.service';

describe('ClinicalHistoryService', () => {
  let service: ClinicalHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicalHistoryService],
    }).compile();

    service = module.get<ClinicalHistoryService>(ClinicalHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
