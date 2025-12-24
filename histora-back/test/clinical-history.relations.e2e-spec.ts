/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import {
  createDoctor,
  createPatient,
  createClinicalHistory,
} from './helpers/entity-creators';

describe('ClinicalHistory Relations (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule], // o el módulo que incluya tus entidades
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create doctor, patient and link them in a clinical-history', async () => {
    // Setup: crear doctor y paciente
    const doctor = await createDoctor(app, { name: 'Dr. Strange' });
    const patient = await createPatient(app, { name: 'Tony Stark' });

    // Acción: crear historia clínica
    const history = await createClinicalHistory(app, {
      doctorId: doctor._id,
      patientId: patient._id,
      diagnosis: 'Estrés post-Endgame',
      notes: 'Requiere seguimiento psicológico',
      date: new Date().toISOString(),
    });

    // Validación
    expect(history.doctorId).toBe(doctor._id);
    expect(history.patientId).toBe(patient._id);
  });

  afterAll(async () => {
    await app.close();
  });
});
