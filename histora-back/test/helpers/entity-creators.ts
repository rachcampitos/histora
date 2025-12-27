import request from 'supertest';
import { INestApplication } from '@nestjs/common';

interface CreateDoctorData {
  firstName: string;
  lastName: string;
  specialty: string;
  email?: string;
  phone?: string;
}

interface CreatePatientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email?: string;
  phone?: string;
}

interface CreateClinicalHistoryData {
  patientId: string;
  doctorId: string;
  date: string;
  reasonForVisit: string;
  diagnosis?: string;
  treatment?: string;
}

export async function createDoctor(
  app: INestApplication,
  data: CreateDoctorData,
  authToken?: string,
): Promise<any> {
  const req = request(app.getHttpServer()).post('/doctors').send(data);
  if (authToken) {
    req.set('Authorization', `Bearer ${authToken}`);
  }
  const res = await req;
  return res.body;
}

export async function createPatient(
  app: INestApplication,
  data: CreatePatientData,
  authToken?: string,
): Promise<any> {
  const req = request(app.getHttpServer()).post('/patients').send(data);
  if (authToken) {
    req.set('Authorization', `Bearer ${authToken}`);
  }
  const res = await req;
  return res.body;
}

export async function createClinicalHistory(
  app: INestApplication,
  data: CreateClinicalHistoryData,
  authToken?: string,
): Promise<any> {
  const req = request(app.getHttpServer()).post('/clinical-history').send(data);
  if (authToken) {
    req.set('Authorization', `Bearer ${authToken}`);
  }
  const res = await req;
  return res.body;
}
