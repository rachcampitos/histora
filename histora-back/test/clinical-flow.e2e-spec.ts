import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DoctorResponse, PatientResponse } from './types/models';
import { cleanDatabase } from './utils/clean-db';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

jest.setTimeout(30000);

describe('Registro Doctor y Paciente (e2e)', () => {
  let app: INestApplication;
  let doctorId: string;
  let patientId: string;

  function getTypedBody<T>(res: request.Response): T {
    return res.body as T;
  }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await cleanDatabase(['patients', 'doctors']);
  });

  beforeEach(async () => {
    await cleanDatabase(['patients', 'doctors']);
  });

  it('Crea un doctor', async () => {
    const res = await request(app.getHttpServer()).post('/doctors').send({
      name: 'Dr. Carla Rivas',
      specialty: 'Dermatología',
    });

    const doctor = getTypedBody<DoctorResponse>(res);
    expect(res.status).toBe(201);
    expect(doctor._id).toBeDefined();
    doctorId = doctor._id;
  });

  it('Crea un paciente', async () => {
    const res = await request(app.getHttpServer())
      .post('/patients')
      .send({
        firstName: 'Jorge',
        lastName: 'Salazar',
        birthDate: '1990-03-22',
        gender: 'masculino',
        email: `jorge.salazar+${Date.now()}@example.com`,
        phone: '+51987654321',
      });

    const patient = getTypedBody<PatientResponse>(res);
    expect(res.status).toBe(201);
    expect(patient._id).toBeDefined();
    patientId = patient._id;
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  });
});
