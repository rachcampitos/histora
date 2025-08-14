import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina propiedades no declaradas en DTO
      forbidNonWhitelisted: true, // error si vienen propiedades no declaradas
      transform: true, // convierte automáticamente tipos (string -> Date, etc)
    }),
  );

  await app.listen(3000);
}
bootstrap();
