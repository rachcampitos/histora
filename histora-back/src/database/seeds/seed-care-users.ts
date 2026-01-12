import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../../users/schema/user.schema';
import { Nurse } from '../../nurses/schema/nurse.schema';
import * as bcrypt from 'bcrypt';

// Ubicaciones en Lima, Perú (diferentes distritos)
const LOCATIONS = {
  miraflores: { lat: -12.1191, lng: -77.0311, district: 'Miraflores', address: 'Av. Larco 123' },
  sanIsidro: { lat: -12.0977, lng: -77.0365, district: 'San Isidro', address: 'Av. Javier Prado 456' },
  surco: { lat: -12.1469, lng: -76.9917, district: 'Santiago de Surco', address: 'Av. Primavera 789' },
};

async function seedCareUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const nurseModel = app.get<Model<Nurse>>(getModelToken(Nurse.name));

  console.log('Starting Histora Care users seeding...');

  // =========================================
  // CREAR PACIENTE DE PRUEBA
  // =========================================
  const patientEmail = 'paciente@care.test';
  let patientUser = await userModel.findOne({ email: patientEmail });

  if (!patientUser) {
    patientUser = await userModel.create({
      email: patientEmail,
      password: await bcrypt.hash('test1234', 10),
      firstName: 'Carlos',
      lastName: 'Mendoza',
      phone: '+51987654321',
      role: UserRole.PATIENT,
      isActive: true,
      isEmailVerified: true,
      authProvider: 'local',
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
    });
    console.log(`Created patient: ${patientEmail}`);
  } else {
    console.log(`Patient ${patientEmail} already exists`);
  }

  // =========================================
  // CREAR ENFERMERAS DE PRUEBA
  // =========================================
  const nurses = [
    {
      email: 'enfermera1@care.test',
      firstName: 'María',
      lastName: 'García',
      phone: '+51912345001',
      cepNumber: 'CEP-12345',
      specialties: ['Cuidado General', 'Inyecciones', 'Control de Signos Vitales'],
      location: LOCATIONS.miraflores,
      bio: 'Enfermera con 5 años de experiencia en cuidados a domicilio.',
      yearsOfExperience: 5,
      services: [
        { name: 'Inyección Intramuscular', category: 'injection', price: 30, durationMinutes: 15 },
        { name: 'Control de Presión', category: 'vital_signs', price: 25, durationMinutes: 20 },
        { name: 'Curación Simple', category: 'wound_care', price: 40, durationMinutes: 30 },
      ],
    },
    {
      email: 'enfermera2@care.test',
      firstName: 'Ana',
      lastName: 'López',
      phone: '+51912345002',
      cepNumber: 'CEP-23456',
      specialties: ['Cuidado de Adulto Mayor', 'Terapia IV', 'Curaciones'],
      location: LOCATIONS.sanIsidro,
      bio: 'Especialista en cuidados geriátricos y terapia intravenosa.',
      yearsOfExperience: 8,
      services: [
        { name: 'Terapia Intravenosa', category: 'iv_therapy', price: 80, durationMinutes: 60 },
        { name: 'Cuidado de Adulto Mayor (4h)', category: 'elderly_care', price: 150, durationMinutes: 240 },
        { name: 'Curación Avanzada', category: 'wound_care', price: 60, durationMinutes: 45 },
      ],
    },
    {
      email: 'enfermera3@care.test',
      firstName: 'Rosa',
      lastName: 'Martínez',
      phone: '+51912345003',
      cepNumber: 'CEP-34567',
      specialties: ['Post-Operatorio', 'Sondas', 'Emergencias'],
      location: LOCATIONS.surco,
      bio: 'Enfermera de emergencias con experiencia en cuidados post-quirúrgicos.',
      yearsOfExperience: 10,
      services: [
        { name: 'Cuidado Post-Operatorio', category: 'post_surgery', price: 100, durationMinutes: 120 },
        { name: 'Colocación de Sonda', category: 'catheter', price: 70, durationMinutes: 30 },
        { name: 'Toma de Muestras', category: 'blood_draw', price: 35, durationMinutes: 20 },
      ],
    },
  ];

  for (const nurseData of nurses) {
    let nurseUser = await userModel.findOne({ email: nurseData.email });

    if (!nurseUser) {
      // Create user
      nurseUser = await userModel.create({
        email: nurseData.email,
        password: await bcrypt.hash('test1234', 10),
        firstName: nurseData.firstName,
        lastName: nurseData.lastName,
        phone: nurseData.phone,
        role: UserRole.NURSE,
        isActive: true,
        isEmailVerified: true,
        authProvider: 'local',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        professionalDisclaimerAccepted: true,
        professionalDisclaimerAcceptedAt: new Date(),
      });

      // Create nurse profile
      const nurseProfile = await nurseModel.create({
        userId: nurseUser._id,
        cepNumber: nurseData.cepNumber,
        cepVerified: true,
        cepVerifiedAt: new Date(),
        verificationStatus: 'approved',
        specialties: nurseData.specialties,
        bio: nurseData.bio,
        yearsOfExperience: nurseData.yearsOfExperience,
        services: nurseData.services.map(s => ({
          _id: new Types.ObjectId(),
          name: s.name,
          category: s.category,
          price: s.price,
          currency: 'PEN',
          durationMinutes: s.durationMinutes,
          isActive: true,
        })),
        location: {
          type: 'Point',
          coordinates: [nurseData.location.lng, nurseData.location.lat], // GeoJSON: [lng, lat]
          address: nurseData.location.address,
          city: 'Lima',
          district: nurseData.location.district,
        },
        serviceRadius: 10,
        extraChargePerKm: 2,
        minimumServiceFee: 20,
        isAvailable: true,
        availableFrom: '08:00',
        availableTo: '20:00',
        availableDays: [1, 2, 3, 4, 5, 6],
        averageRating: 4.5 + Math.random() * 0.5,
        totalReviews: Math.floor(Math.random() * 50) + 10,
        totalServicesCompleted: Math.floor(Math.random() * 100) + 20,
        isActive: true,
      });

      // Update user with nurseProfileId
      await userModel.updateOne(
        { _id: nurseUser._id },
        { $set: { nurseProfileId: nurseProfile._id } }
      );

      console.log(`Created nurse: ${nurseData.firstName} ${nurseData.lastName} (${nurseData.location.district})`);
    } else {
      console.log(`Nurse ${nurseData.email} already exists`);
    }
  }

  console.log('\n========================================');
  console.log('Histora Care Seeding completed!');
  console.log('========================================\n');
  console.log('👤 PACIENTE:');
  console.log('   Email: paciente@care.test');
  console.log('   Password: test1234');
  console.log('\n👩‍⚕️ ENFERMERAS:');
  console.log('   Email: enfermera1@care.test (Miraflores)');
  console.log('   Email: enfermera2@care.test (San Isidro)');
  console.log('   Email: enfermera3@care.test (Surco)');
  console.log('   Password (todas): test1234');
  console.log('\n========================================\n');

  await app.close();
}

seedCareUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding:', error);
    process.exit(1);
  });
