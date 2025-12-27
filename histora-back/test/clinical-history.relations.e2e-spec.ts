import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import {
  createDoctor,
  createPatient,
  createClinicalHistory,
} from './helpers/entity-creators';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

jest.setTimeout(30000);

// These tests require authentication - skipping until auth is mocked
describe.skip('ClinicalHistory Relations (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create doctor, patient and link them in a clinical-history', async () => {
    // Setup: crear doctor y paciente
    const doctor = await createDoctor(app, {
      firstName: 'Stephen',
      lastName: 'Strange',
      specialty: 'Neurología',
    });
    const patient = await createPatient(app, {
      firstName: 'Tony',
      lastName: 'Stark',
      dateOfBirth: '1970-05-29',
      gender: 'male',
    });

    // Acción: crear historia clínica
    const history = await createClinicalHistory(app, {
      doctorId: doctor._id,
      patientId: patient._id,
      date: new Date().toISOString(),
      reasonForVisit: 'Consulta general',
      diagnosis: 'Estrés post-Endgame',
    });

    // Validación
    expect(history.doctorId).toBe(doctor._id);
    expect(history.patientId).toBe(patient._id);
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  });
});
