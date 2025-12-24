import { request } from 'http';

export async function createDoctor(app, data) {
  const res = await request(app.getHttpServer()).post('/doctors').send(data);
  return res.body;
}

export async function createPatient(app, data) {
  const res = await request(app.getHttpServer()).post('/patients').send(data);
  return res.body;
}

export async function createClinicalHistory(app, data) {
  const res = await request(app.getHttpServer())
    .post('/clinical-history')
    .send(data);
  return res.body;
}
