import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../../users/schema/user.schema';
import { Clinic } from '../../clinics/schema/clinic.schema';
import * as bcrypt from 'bcrypt';

async function seedUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const clinicModel = app.get<Model<Clinic>>(getModelToken(Clinic.name));

  console.log('Starting user and clinic seeding...');

  // 1. Create or get admin user
  let adminUser = await userModel.findOne({ email: 'admin@historahealth.com' });
  if (!adminUser) {
    adminUser = await userModel.create({
      email: 'admin@historahealth.com',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'Histora',
      phone: '+51 999 000 001',
      role: UserRole.PLATFORM_ADMIN,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    });
    console.log('Created admin user: admin@historahealth.com');
  } else {
    console.log('Admin user already exists, skipping...');
  }

  // 2. Create or get doctor user (clinic owner)
  let doctorUser = await userModel.findOne({ email: 'doctor@historahealth.com' });
  if (!doctorUser) {
    doctorUser = await userModel.create({
      email: 'doctor@historahealth.com',
      password: await bcrypt.hash('doctor123', 10),
      firstName: 'Carlos',
      lastName: 'Méndez',
      phone: '+51 999 000 002',
      role: UserRole.CLINIC_OWNER,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    });
    console.log('Created doctor user: doctor@historahealth.com');
  } else {
    console.log('Doctor user already exists');
  }

  // 3. Create clinic for the doctor if doesn't exist
  let clinic = await clinicModel.findOne({ ownerId: doctorUser._id });
  if (!clinic) {
    clinic = await clinicModel.create({
      name: 'Consultorio Dr. Méndez',
      slug: 'consultorio-dr-mendez',
      ownerId: doctorUser._id,
      phone: '+51 999 000 002',
      email: 'doctor@historahealth.com',
      specialties: ['Medicina General'],
      address: {
        street: 'Av. Ejemplo 123',
        city: 'Lima',
        state: 'Lima',
        country: 'Perú',
      },
      isActive: true,
    });
    console.log('Created clinic: Consultorio Dr. Méndez');
  } else {
    console.log('Clinic already exists for doctor');
  }

  // 4. Update doctor user with clinicId if not set
  if (!doctorUser.clinicId) {
    await userModel.updateOne(
      { _id: doctorUser._id },
      { $set: { clinicId: clinic._id } }
    );
    console.log('Updated doctor with clinicId');
  }

  // 5. Create patient user
  let patientUser = await userModel.findOne({ email: 'patient@historahealth.com' });
  if (!patientUser) {
    patientUser = await userModel.create({
      email: 'patient@historahealth.com',
      password: await bcrypt.hash('patient123', 10),
      firstName: 'María',
      lastName: 'García',
      phone: '+51 999 000 003',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    });
    console.log('Created patient user: patient@historahealth.com');
  } else {
    console.log('Patient user already exists, skipping...');
  }

  // 6. Create additional test doctor (associated with same clinic)
  let drRodriguez = await userModel.findOne({ email: 'dr.rodriguez@historahealth.com' });
  if (!drRodriguez) {
    drRodriguez = await userModel.create({
      email: 'dr.rodriguez@historahealth.com',
      password: await bcrypt.hash('Password123!', 10),
      firstName: 'Ana',
      lastName: 'Rodríguez López',
      phone: '+51 999 000 004',
      role: UserRole.CLINIC_DOCTOR,
      clinicId: clinic._id,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    });
    console.log('Created doctor: dr.rodriguez@historahealth.com');
  } else {
    console.log('Dr. Rodriguez already exists, skipping...');
  }

  // 7. Create additional test patient
  let juanPerez = await userModel.findOne({ email: 'juan.perez@gmail.com' });
  if (!juanPerez) {
    juanPerez = await userModel.create({
      email: 'juan.perez@gmail.com',
      password: await bcrypt.hash('Patient123!', 10),
      firstName: 'Juan',
      lastName: 'Pérez Sánchez',
      phone: '+51 999 000 005',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
    });
    console.log('Created patient: juan.perez@gmail.com');
  } else {
    console.log('Juan Perez already exists, skipping...');
  }

  console.log('\n========================================');
  console.log('Seeding completed!');
  console.log('========================================\n');
  console.log('--- Demo Credentials (Login Page) ---');
  console.log('Admin:   admin@historahealth.com / admin123');
  console.log('Doctor:  doctor@historahealth.com / doctor123');
  console.log('Patient: patient@historahealth.com / patient123');
  console.log('\n--- Additional Test Users ---');
  console.log('Doctor:  dr.rodriguez@historahealth.com / Password123!');
  console.log('Patient: juan.perez@gmail.com / Patient123!');
  console.log('\n--- Clinic ---');
  console.log(`Clinic ID: ${clinic._id}`);
  console.log('========================================\n');

  await app.close();
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding:', error);
    process.exit(1);
  });
