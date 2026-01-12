/**
 * Script para crear usuarios de prueba para Histora Care
 *
 * Ejecutar con: npx ts-node scripts/seed-test-users.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as bcrypt from 'bcrypt';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/histora';

// Ubicaciones en Lima, Perú (diferentes distritos)
const LOCATIONS = {
  miraflores: { lat: -12.1191, lng: -77.0311, district: 'Miraflores', address: 'Av. Larco 123' },
  sanIsidro: { lat: -12.0977, lng: -77.0365, district: 'San Isidro', address: 'Av. Javier Prado 456' },
  surco: { lat: -12.1469, lng: -76.9917, district: 'Santiago de Surco', address: 'Av. Primavera 789' },
};

async function seed() {
  const client = new MongoClient(MONGO_URL);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');
    const nursesCollection = db.collection('nurses');

    // Hash de contraseña común para pruebas
    const passwordHash = await bcrypt.hash('Test1234!', 10);

    // =========================================
    // CREAR PACIENTE DE PRUEBA
    // =========================================
    const patientEmail = 'paciente.test@histora.com';

    // Eliminar si existe
    await usersCollection.deleteOne({ email: patientEmail });

    const patientUser = {
      _id: new ObjectId(),
      email: patientEmail,
      password: passwordHash,
      firstName: 'Carlos',
      lastName: 'Mendoza',
      phone: '+51987654321',
      role: 'patient',
      authProvider: 'local',
      isActive: true,
      isEmailVerified: true,
      termsAccepted: true,
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await usersCollection.insertOne(patientUser);
    console.log(`✅ Paciente creado: ${patientEmail}`);

    // =========================================
    // CREAR ENFERMERAS DE PRUEBA
    // =========================================
    const nurses = [
      {
        email: 'enfermera1.test@histora.com',
        firstName: 'María',
        lastName: 'García',
        phone: '+51912345001',
        cepNumber: 'CEP-TEST-001',
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
        email: 'enfermera2.test@histora.com',
        firstName: 'Ana',
        lastName: 'López',
        phone: '+51912345002',
        cepNumber: 'CEP-TEST-002',
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
        email: 'enfermera3.test@histora.com',
        firstName: 'Rosa',
        lastName: 'Martínez',
        phone: '+51912345003',
        cepNumber: 'CEP-TEST-003',
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
      // Eliminar usuario y perfil de enfermera si existen
      const existingUser = await usersCollection.findOne({ email: nurseData.email });
      if (existingUser) {
        await nursesCollection.deleteOne({ userId: existingUser._id });
        await usersCollection.deleteOne({ _id: existingUser._id });
      }
      await nursesCollection.deleteOne({ cepNumber: nurseData.cepNumber });

      // Crear usuario
      const userId = new ObjectId();
      const nurseProfileId = new ObjectId();

      const user = {
        _id: userId,
        email: nurseData.email,
        password: passwordHash,
        firstName: nurseData.firstName,
        lastName: nurseData.lastName,
        phone: nurseData.phone,
        role: 'nurse',
        authProvider: 'local',
        isActive: true,
        isEmailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
        professionalDisclaimerAccepted: true,
        professionalDisclaimerAcceptedAt: new Date(),
        nurseProfileId: nurseProfileId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await usersCollection.insertOne(user);

      // Crear perfil de enfermera
      const nurseProfile = {
        _id: nurseProfileId,
        userId: userId,
        cepNumber: nurseData.cepNumber,
        cepVerified: true, // Verificada para pruebas
        cepVerifiedAt: new Date(),
        verificationStatus: 'approved',
        specialties: nurseData.specialties,
        bio: nurseData.bio,
        yearsOfExperience: nurseData.yearsOfExperience,
        services: nurseData.services.map(s => ({
          _id: new ObjectId(),
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
        serviceRadius: 10, // 10km
        extraChargePerKm: 2, // S/. 2 por km extra
        minimumServiceFee: 20, // S/. 20 mínimo
        isAvailable: true, // Disponible
        availableFrom: '08:00',
        availableTo: '20:00',
        availableDays: [1, 2, 3, 4, 5, 6], // Lunes a Sábado
        averageRating: 4.5 + Math.random() * 0.5, // 4.5 - 5.0
        totalReviews: Math.floor(Math.random() * 50) + 10,
        totalServicesCompleted: Math.floor(Math.random() * 100) + 20,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await nursesCollection.insertOne(nurseProfile);
      console.log(`✅ Enfermera creada: ${nurseData.firstName} ${nurseData.lastName} (${nurseData.location.district})`);
    }

    // Asegurar índice geoespacial
    await nursesCollection.createIndex({ location: '2dsphere' });
    console.log('✅ Índice geoespacial creado');

    console.log('\n========================================');
    console.log('📋 USUARIOS DE PRUEBA CREADOS');
    console.log('========================================');
    console.log('\n👤 PACIENTE:');
    console.log(`   Email: paciente.test@histora.com`);
    console.log(`   Password: Test1234!`);
    console.log('\n👩‍⚕️ ENFERMERAS:');
    console.log(`   Email: enfermera1.test@histora.com (Miraflores)`);
    console.log(`   Email: enfermera2.test@histora.com (San Isidro)`);
    console.log(`   Email: enfermera3.test@histora.com (Surco)`);
    console.log(`   Password (todas): Test1234!`);
    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Desconectado de MongoDB');
  }
}

seed();
