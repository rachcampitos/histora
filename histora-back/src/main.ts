import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Helmet for HTTP headers protection
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          scriptSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow embedding for OAuth
    }),
  );

  // Increase body size limit for file uploads (base64 images)
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Enable graceful shutdown
  app.enableShutdownHooks();

  // Enable CORS for frontend - configurable via environment
  const defaultOrigins = [
    'http://localhost:4200',
    'http://localhost:8100',
    'https://app.historahealth.com',
    'https://historahealth.com',
  ];

  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : defaultOrigins;

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger Configuration - only enable in non-production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const config = new DocumentBuilder()
    .setTitle('Histora API')
    .setDescription('API para gestión de consultorios médicos - Histora SaaS')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticación y registro de usuarios')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Clinics', 'Gestión de consultorios/clínicas')
    .addTag('Patients', 'Gestión de pacientes')
    .addTag('Doctors', 'Gestión de doctores')
    .addTag('Appointments', 'Gestión de citas')
    .addTag('Consultations', 'Gestión de consultas médicas')
    .addTag('Clinical History', 'Historiales clínicos')
    .addTag('Vitals', 'Signos vitales')
    .addTag('Subscriptions', 'Planes y suscripciones')
    .addTag('Reviews', 'Reseñas de pacientes')
    .addTag('Public Directory', 'Directorio público de médicos')
    .addTag('Patient Portal', 'Portal del paciente')
    .addTag('Notifications', 'Notificaciones y preferencias')
    .addTag('Payments', 'Pagos y transacciones (Yape, Plin, tarjetas)')
    .addTag('Uploads', 'Subida de archivos e imágenes (Cloudinary)')
    .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
      customSiteTitle: 'Histora API Documentation',
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend running on http://localhost:${port}`);
  if (!isProduction) {
    console.log(`Swagger docs available at http://localhost:${port}/docs`);
  }
}
bootstrap();
