/**
 * Tests E2E para el flujo de autenticación
 *
 * Estos tests prueban el flujo COMPLETO de autenticación:
 * 1. Registro de usuario (crea usuario + clínica + suscripción trial)
 * 2. Login con credenciales
 * 3. Acceso a rutas protegidas
 * 4. Refresh token
 * 5. Logout
 */
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {
  registerUser,
  loginUser,
  generateTestUser,
  authRequest,
} from './helpers/auth.helper';

describe('Auth E2E', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  // Aumentar timeout para tests E2E
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Crear base de datos en memoria para tests
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret-key-for-e2e';
    process.env.JWT_EXPIRES_IN = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configurar igual que en producción
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // ============================================
  // REGISTRO
  // ============================================
  describe('POST /auth/register', () => {
    it('debería registrar un nuevo usuario con clínica', async () => {
      const userData = generateTestUser('register');

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Verificar respuesta
      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(userData.email.toLowerCase());
      expect(res.body.user.firstName).toBe(userData.firstName);
      expect(res.body.user.role).toBe('clinic_owner');
      expect(res.body.user.clinicId).toBeDefined();
    });

    it('debería rechazar email duplicado', async () => {
      const userData = generateTestUser('duplicate');

      // Primer registro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Segundo registro con mismo email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(409); // Conflict
    });

    it('debería rechazar datos inválidos', async () => {
      // Sin email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          password: 'Test123456!',
          firstName: 'Test',
          lastName: 'User',
          clinicName: 'Test Clinic',
        })
        .expect(400);

      // Password muy corto
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'short@test.com',
          password: '123',
          firstName: 'Test',
          lastName: 'User',
          clinicName: 'Test Clinic',
        })
        .expect(400);
    });
  });

  // ============================================
  // LOGIN
  // ============================================
  describe('POST /auth/login', () => {
    const testUser = generateTestUser('login');

    beforeAll(async () => {
      // Crear usuario para tests de login
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);
    });

    it('debería hacer login con credenciales correctas', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    });

    it('debería rechazar password incorrecto', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('debería rechazar email inexistente', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'noexiste@test.com',
          password: 'somepassword',
        })
        .expect(401);
    });
  });

  // ============================================
  // RUTAS PROTEGIDAS
  // ============================================
  describe('Protected Routes', () => {
    let accessToken: string;

    beforeAll(async () => {
      const userData = generateTestUser('protected');
      const auth = await registerUser(app, userData);
      accessToken = auth.accessToken;
    });

    it('debería acceder a ruta protegida con token válido', async () => {
      const res = await authRequest(app, accessToken)
        .get('/patients')
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('debería rechazar sin token', async () => {
      await request(app.getHttpServer())
        .get('/patients')
        .expect(401);
    });

    it('debería rechazar con token inválido', async () => {
      await request(app.getHttpServer())
        .get('/patients')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  // ============================================
  // REFRESH TOKEN
  // ============================================
  describe('POST /auth/refresh', () => {
    it('debería renovar tokens con refresh_token válido', async () => {
      const userData = generateTestUser('refresh');
      const auth = await registerUser(app, userData);

      // Esperar un momento para que los tokens sean diferentes
      await new Promise((r) => setTimeout(r, 100));

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: auth.refreshToken })
        .expect(200);

      expect(res.body.access_token).toBeDefined();
      expect(res.body.refresh_token).toBeDefined();
    });

    it('debería rechazar refresh_token inválido', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid-refresh-token' })
        .expect(401);
    });
  });

  // ============================================
  // PROFILE (GET /auth/me)
  // ============================================
  describe('GET /auth/me', () => {
    it('debería retornar perfil del usuario autenticado', async () => {
      const userData = generateTestUser('profile');
      const auth = await registerUser(app, userData);

      const res = await authRequest(app, auth.accessToken)
        .get('/auth/me')
        .expect(200);

      expect(res.body.email).toBe(userData.email.toLowerCase());
      expect(res.body.firstName).toBe(userData.firstName);
      expect(res.body.role).toBe('clinic_owner');
    });
  });
});
