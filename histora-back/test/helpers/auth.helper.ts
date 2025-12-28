import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  clinicName: string;
  clinicPhone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    clinicId?: string;
  };
}

/**
 * Registra un nuevo usuario (clinic owner) y retorna los tokens
 */
export async function registerUser(
  app: INestApplication,
  data: RegisterData,
): Promise<AuthTokens> {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send(data)
    .expect(201);

  return {
    accessToken: res.body.access_token,
    refreshToken: res.body.refresh_token,
    user: res.body.user,
  };
}

/**
 * Inicia sesión y retorna los tokens
 */
export async function loginUser(
  app: INestApplication,
  data: LoginData,
): Promise<AuthTokens> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send(data)
    .expect(200);

  return {
    accessToken: res.body.access_token,
    refreshToken: res.body.refresh_token,
    user: res.body.user,
  };
}

/**
 * Genera datos de registro únicos para evitar colisiones
 */
export function generateTestUser(prefix = 'test'): RegisterData {
  const timestamp = Date.now();
  return {
    email: `${prefix}.${timestamp}@test.com`,
    password: 'Test123456!',
    firstName: 'Test',
    lastName: 'User',
    phone: '+51999999999',
    clinicName: `Clínica ${prefix} ${timestamp}`,
    clinicPhone: '+51998888888',
  };
}

/**
 * Helper para hacer requests autenticados
 */
export function authRequest(app: INestApplication, token: string) {
  return {
    get: (url: string) =>
      request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(app.getHttpServer())
        .patch(url)
        .set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(app.getHttpServer())
        .delete(url)
        .set('Authorization', `Bearer ${token}`),
  };
}
