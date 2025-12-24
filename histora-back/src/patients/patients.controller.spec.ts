import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { getModelToken } from '@nestjs/mongoose';
import { PatientsService } from './patients.service';
import { Patient } from './schemas/patients.schema';

describe('PatientsController', () => {
  let controller: PatientsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [
        PatientsService,
        {
          provide: getModelToken(Patient.name),
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PatientsController>(PatientsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
