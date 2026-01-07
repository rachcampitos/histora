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
    // Demo users (matching login page buttons)
    {
      email: 'admin@histora.pe',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'Histora',
      phone: '+51 999 000 001',
      role: UserRole.PLATFORM_ADMIN,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    },
    {
      email: 'doctor@histora.pe',
      password: await bcrypt.hash('doctor123', 10),
      firstName: 'Dr. Carlos',
      lastName: 'Méndez',
      phone: '+51 999 000 002',
      role: UserRole.CLINIC_OWNER,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    },
    {
      email: 'patient@histora.pe',
      password: await bcrypt.hash('patient123', 10),
      firstName: 'María',
      lastName: 'García',
      phone: '+51 999 000 003',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    },
    // Additional test doctors
    {
      email: 'dr.rodriguez@histora.pe',
      password: await bcrypt.hash('Password123!', 10),
      firstName: 'Ana',
      lastName: 'Rodríguez López',
      phone: '+51 999 000 004',
      role: UserRole.CLINIC_DOCTOR,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    },
    // Additional test patients
    {
      email: 'juan.perez@gmail.com',
      password: await bcrypt.hash('Patient123!', 10),
      firstName: 'Juan',
      lastName: 'Pérez Sánchez',
      phone: '+51 999 000 005',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
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

  console.log('\n========================================');
  console.log('User seeding completed!');
  console.log('========================================\n');
  console.log('--- Demo Credentials (Login Page) ---');
  console.log('Admin:   admin@histora.pe / admin123');
  console.log('Doctor:  doctor@histora.pe / doctor123');
  console.log('Patient: patient@histora.pe / patient123');
  console.log('\n--- Additional Test Users ---');
  console.log('Doctor:  dr.rodriguez@histora.pe / Password123!');
  console.log('Patient: juan.perez@gmail.com / Patient123!');
  console.log('========================================\n');

  await app.close();
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding users:', error);
    process.exit(1);
  });
