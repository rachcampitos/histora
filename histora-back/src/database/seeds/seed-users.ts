import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../../users/schema/user.schema';
import * as bcrypt from 'bcrypt';

async function seedUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));

  const testUsers = [
    {
      email: 'dr.carlos.mendez@histora.com',
      password: await bcrypt.hash('Password123!', 10),
      firstName: 'Carlos',
      lastName: 'Méndez García',
      phone: '+52 55 1234 5678',
      role: UserRole.CLINIC_DOCTOR,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'dr.maria.rodriguez@histora.com',
      password: await bcrypt.hash('Password123!', 10),
      firstName: 'María',
      lastName: 'Rodríguez López',
      phone: '+52 55 2345 6789',
      role: UserRole.CLINIC_DOCTOR,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'admin@histora.com',
      password: await bcrypt.hash('Admin123!', 10),
      firstName: 'Administrador',
      lastName: 'Sistema',
      phone: '+52 55 0000 0001',
      role: UserRole.PLATFORM_ADMIN,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'paciente.juan@gmail.com',
      password: await bcrypt.hash('Patient123!', 10),
      firstName: 'Juan',
      lastName: 'Pérez Sánchez',
      phone: '+52 55 3456 7890',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'paciente.ana@gmail.com',
      password: await bcrypt.hash('Patient123!', 10),
      firstName: 'Ana',
      lastName: 'García Hernández',
      phone: '+52 55 4567 8901',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
    },
    {
      email: 'paciente.roberto@gmail.com',
      password: await bcrypt.hash('Patient123!', 10),
      firstName: 'Roberto',
      lastName: 'Martínez Flores',
      phone: '+52 55 5678 9012',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
    },
  ];

  console.log('Starting user seeding...');

  for (const userData of testUsers) {
    const existingUser = await userModel.findOne({ email: userData.email });

    if (existingUser) {
      console.log(`User ${userData.email} already exists, skipping...`);
      continue;
    }

    await userModel.create(userData);
    console.log(`Created user: ${userData.firstName} ${userData.lastName} (${userData.email})`);
  }

  console.log('User seeding completed!');
  console.log('\n--- Test Credentials ---');
  console.log('Doctor: dr.carlos.mendez@histora.com / Password123!');
  console.log('Doctor: dr.maria.rodriguez@histora.com / Password123!');
  console.log('Admin: admin@histora.com / Admin123!');
  console.log('Patient: paciente.juan@gmail.com / Patient123!');
  console.log('Patient: paciente.ana@gmail.com / Patient123!');
  console.log('Patient: paciente.roberto@gmail.com / Patient123!');

  await app.close();
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding users:', error);
    process.exit(1);
  });
