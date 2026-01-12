const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URL = 'mongodb+srv://histora:HistoraLeonardo@histora.pcb3mhu.mongodb.net/histora_db?retryWrites=true&w=majority';

async function createTestNurses() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const nursesCollection = db.collection('nurses');

    // Hash password
    const hashedPassword = await bcrypt.hash('Test1234!', 10);

    // Create nurse users
    const nurseData = [
      {
        email: 'maria.lopez.enfermera@test.com',
        firstName: 'Maria',
        lastName: 'Lopez',
        phone: '+51987654321',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        specialties: ['Inyecciones', 'Curaciones', 'Cuidado General'],
        bio: 'Enfermera con 8 anos de experiencia en atencion domiciliaria. Especialista en cuidados de heridas y administracion de medicamentos.',
        yearsOfExperience: 8,
        cepNumber: 'CEP-12345',
        // Miraflores, Lima
        location: { lat: -12.1219, lng: -77.0306 }
      },
      {
        email: 'carmen.garcia.enfermera@test.com',
        firstName: 'Carmen',
        lastName: 'Garcia',
        phone: '+51912345678',
        avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
        specialties: ['Terapia IV', 'Signos Vitales', 'Cuidado Adulto Mayor'],
        bio: 'Enfermera especializada en cuidado de adultos mayores y terapia intravenosa. Experiencia en clinicas y atencion a domicilio.',
        yearsOfExperience: 5,
        cepNumber: 'CEP-67890',
        // San Isidro, Lima
        location: { lat: -12.0975, lng: -77.0365 }
      }
    ];

    for (const nurse of nurseData) {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email: nurse.email });
      if (existingUser) {
        console.log(`User ${nurse.email} already exists, skipping...`);
        continue;
      }

      // Check if nurse CEP already exists
      const existingNurse = await nursesCollection.findOne({ cepNumber: nurse.cepNumber });
      if (existingNurse) {
        console.log(`Nurse with CEP ${nurse.cepNumber} already exists, skipping...`);
        continue;
      }

      // Create user
      const userId = new mongoose.Types.ObjectId();
      const nurseId = new mongoose.Types.ObjectId();

      const user = {
        _id: userId,
        email: nurse.email,
        password: hashedPassword,
        authProvider: 'local',
        firstName: nurse.firstName,
        lastName: nurse.lastName,
        phone: nurse.phone,
        role: 'nurse',
        nurseProfileId: nurseId,
        isActive: true,
        isEmailVerified: true,
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        professionalDisclaimerAccepted: true,
        professionalDisclaimerAcceptedAt: new Date(),
        avatar: nurse.avatar,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create nurse profile
      const nurseProfile = {
        _id: nurseId,
        userId: userId,
        cepNumber: nurse.cepNumber,
        cepVerified: true,
        cepVerifiedAt: new Date(),
        verificationStatus: 'approved',
        specialties: nurse.specialties,
        bio: nurse.bio,
        yearsOfExperience: nurse.yearsOfExperience,
        services: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Inyeccion Intramuscular',
            description: 'Aplicacion de medicamentos via intramuscular',
            category: 'injection',
            price: 25,
            currency: 'PEN',
            durationMinutes: 15,
            isActive: true
          },
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Curacion de Heridas',
            description: 'Limpieza y curacion de heridas menores',
            category: 'wound_care',
            price: 40,
            currency: 'PEN',
            durationMinutes: 30,
            isActive: true
          },
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Control de Signos Vitales',
            description: 'Medicion de presion arterial, temperatura, pulso',
            category: 'vital_signs',
            price: 20,
            currency: 'PEN',
            durationMinutes: 20,
            isActive: true
          }
        ],
        location: {
          type: 'Point',
          coordinates: [nurse.location.lng, nurse.location.lat], // MongoDB uses [lng, lat]
          address: 'Lima, Peru',
          city: 'Lima',
          district: nurse.firstName === 'Maria' ? 'Miraflores' : 'San Isidro'
        },
        serviceRadius: 15,
        extraChargePerKm: 2,
        minimumServiceFee: 20,
        isAvailable: true,
        availableFrom: '08:00',
        availableTo: '20:00',
        availableDays: [1, 2, 3, 4, 5, 6], // Lunes a Sabado
        averageRating: nurse.firstName === 'Maria' ? 4.8 : 4.6,
        totalReviews: nurse.firstName === 'Maria' ? 45 : 28,
        totalServicesCompleted: nurse.firstName === 'Maria' ? 120 : 75,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await usersCollection.insertOne(user);
      await nursesCollection.insertOne(nurseProfile);

      console.log(`Created nurse: ${nurse.firstName} ${nurse.lastName} (${nurse.email})`);
    }

    console.log('\nTest nurses created successfully!');
    console.log('\nYou can login with:');
    console.log('Email: maria.lopez.enfermera@test.com');
    console.log('Email: carmen.garcia.enfermera@test.com');
    console.log('Password: Test1234!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestNurses();
