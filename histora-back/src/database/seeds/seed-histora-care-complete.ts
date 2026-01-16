import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../../users/schema/user.schema';
import { Nurse } from '../../nurses/schema/nurse.schema';
import { NurseVerification, VerificationStatus } from '../../nurses/schema/nurse-verification.schema';
import { ServiceRequest } from '../../service-requests/schema/service-request.schema';
import * as bcrypt from 'bcrypt';

// Ubicaciones en Lima, Peru (diferentes distritos)
const LOCATIONS: Record<string, { lat: number; lng: number; district: string; address: string }> = {
  miraflores: { lat: -12.1191, lng: -77.0311, district: 'Miraflores', address: 'Av. Larco 123' },
  sanIsidro: { lat: -12.0977, lng: -77.0365, district: 'San Isidro', address: 'Av. Javier Prado 456' },
  surco: { lat: -12.1469, lng: -76.9917, district: 'Santiago de Surco', address: 'Av. Primavera 789' },
  laMolina: { lat: -12.0867, lng: -76.9353, district: 'La Molina', address: 'Av. Raul Ferrero 1234' },
  sanBorja: { lat: -12.1050, lng: -76.9989, district: 'San Borja', address: 'Av. San Borja Norte 567' },
  jesus_maria: { lat: -12.0766, lng: -77.0467, district: 'Jesus Maria', address: 'Av. Brasil 890' },
  lince: { lat: -12.0842, lng: -77.0330, district: 'Lince', address: 'Av. Arequipa 321' },
  pueblo_libre: { lat: -12.0764, lng: -77.0638, district: 'Pueblo Libre', address: 'Av. La Marina 456' },
  barranco: { lat: -12.1500, lng: -77.0219, district: 'Barranco', address: 'Av. Grau 789' },
  magdalena: { lat: -12.0900, lng: -77.0700, district: 'Magdalena del Mar', address: 'Av. Brasil 1010' },
};

// CEP numbers reales de prueba (formatos validos)
const CEP_NUMBERS = [
  '108887', '095432', '112345', '078901', '134567',
  '156789', '167890', '189012', '190123', '201234',
];

// Servicios de enfermeria disponibles (categorias validas: injection, wound_care, catheter, vital_signs, iv_therapy, blood_draw, medication, elderly_care, post_surgery, other)
const NURSE_SERVICES = [
  { name: 'Inyeccion Intramuscular', category: 'injection', price: 30, durationMinutes: 15 },
  { name: 'Inyeccion Intravenosa', category: 'injection', price: 40, durationMinutes: 20 },
  { name: 'Control de Presion Arterial', category: 'vital_signs', price: 25, durationMinutes: 15 },
  { name: 'Control de Glucosa', category: 'vital_signs', price: 30, durationMinutes: 20 },
  { name: 'Curacion Simple', category: 'wound_care', price: 40, durationMinutes: 30 },
  { name: 'Curacion Avanzada', category: 'wound_care', price: 60, durationMinutes: 45 },
  { name: 'Terapia Intravenosa', category: 'iv_therapy', price: 80, durationMinutes: 60 },
  { name: 'Nebulizacion', category: 'medication', price: 35, durationMinutes: 25 },
  { name: 'Cuidado de Adulto Mayor (4h)', category: 'elderly_care', price: 150, durationMinutes: 240 },
  { name: 'Cuidado de Adulto Mayor (8h)', category: 'elderly_care', price: 280, durationMinutes: 480 },
  { name: 'Colocacion de Sonda Vesical', category: 'catheter', price: 70, durationMinutes: 30 },
  { name: 'Cuidado de Sonda', category: 'catheter', price: 45, durationMinutes: 25 },
  { name: 'Toma de Muestras de Sangre', category: 'blood_draw', price: 35, durationMinutes: 20 },
  { name: 'Cuidado Post-Operatorio', category: 'post_surgery', price: 100, durationMinutes: 120 },
  { name: 'Acompanamiento Hospitalario', category: 'other', price: 120, durationMinutes: 240 },
];

// Nombres peruanos realistas
const FIRST_NAMES_F = ['Maria', 'Ana', 'Rosa', 'Carmen', 'Patricia', 'Luz', 'Milagros', 'Claudia', 'Silvia', 'Gladys'];
const LAST_NAMES = ['Garcia', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Vargas'];

// Patient names
const PATIENT_NAMES = [
  { firstName: 'Carlos', lastName: 'Mendoza' },
  { firstName: 'Elena', lastName: 'Quispe' },
  { firstName: 'Roberto', lastName: 'Huaman' },
  { firstName: 'Lucia', lastName: 'Paredes' },
  { firstName: 'Fernando', lastName: 'Chavez' },
  { firstName: 'Isabel', lastName: 'Rojas' },
  { firstName: 'Miguel', lastName: 'Castillo' },
  { firstName: 'Sofia', lastName: 'Vera' },
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomServices(count: number) {
  const shuffled = [...NURSE_SERVICES].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(s => ({
    _id: new Types.ObjectId(),
    name: s.name,
    category: s.category,
    price: s.price,
    currency: 'PEN',
    durationMinutes: s.durationMinutes,
    isActive: true,
  }));
}

async function seedHistoraCareComplete() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const nurseModel = app.get<Model<Nurse>>(getModelToken(Nurse.name));
  const verificationModel = app.get<Model<NurseVerification>>(getModelToken(NurseVerification.name));
  const serviceRequestModel = app.get<Model<ServiceRequest>>(getModelToken(ServiceRequest.name));

  console.log('========================================');
  console.log('Starting Histora Care Complete Seeding...');
  console.log('========================================\n');

  const hashedPassword = await bcrypt.hash('test1234', 10);
  const locationKeys = Object.keys(LOCATIONS);

  // =========================================
  // 1. CREAR PACIENTES DE PRUEBA
  // =========================================
  console.log('1. Creando pacientes...\n');
  const createdPatients: User[] = [];

  for (let i = 0; i < PATIENT_NAMES.length; i++) {
    const patientData = PATIENT_NAMES[i];
    const email = `paciente${i + 1}@care.test`;

    let patient = await userModel.findOne({ email });

    if (!patient) {
      patient = await userModel.create({
        email,
        password: hashedPassword,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phone: `+519${String(87654321 + i).padStart(8, '0')}`,
        role: UserRole.PATIENT,
        isActive: true,
        isEmailVerified: true,
        authProvider: 'local',
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsVersion: '1.0',
      });
      console.log(`   + ${patientData.firstName} ${patientData.lastName} (${email})`);
    } else {
      console.log(`   = ${email} ya existe`);
    }
    createdPatients.push(patient);
  }

  // =========================================
  // 2. CREAR ENFERMERAS CON DIFERENTES ESTADOS
  // =========================================
  console.log('\n2. Creando enfermeras con diferentes estados de verificacion...\n');

  const nurseConfigs = [
    // 3 Enfermeras APROBADAS (ya verificadas)
    { status: VerificationStatus.APPROVED, count: 3, bio: 'Enfermera verificada y activa' },
    // 2 Enfermeras EN REVISION (admin debe revisar)
    { status: VerificationStatus.UNDER_REVIEW, count: 2, bio: 'Verificacion en proceso de revision' },
    // 3 Enfermeras PENDIENTES (esperando revision)
    { status: VerificationStatus.PENDING, count: 3, bio: 'Esperando revision de documentos' },
    // 2 Enfermeras RECHAZADAS (deben resubir documentos)
    { status: VerificationStatus.REJECTED, count: 2, bio: 'Documentos rechazados, debe resubir' },
  ];

  let nurseIndex = 0;
  const createdNurses: { nurse: Nurse; user: User }[] = [];

  for (const config of nurseConfigs) {
    console.log(`   [${config.status.toUpperCase()}]`);

    for (let i = 0; i < config.count; i++) {
      const firstName = FIRST_NAMES_F[nurseIndex % FIRST_NAMES_F.length];
      const lastName = LAST_NAMES[nurseIndex % LAST_NAMES.length];
      const email = `enfermera${nurseIndex + 1}@care.test`;
      const locationKey = locationKeys[nurseIndex % locationKeys.length];
      const location = LOCATIONS[locationKey];
      const cepNumber = CEP_NUMBERS[nurseIndex % CEP_NUMBERS.length];

      let nurseUser = await userModel.findOne({ email });

      if (!nurseUser) {
        // Create user
        nurseUser = await userModel.create({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone: `+519${String(12345001 + nurseIndex).padStart(8, '0')}`,
          role: UserRole.NURSE,
          isActive: config.status === VerificationStatus.APPROVED,
          isEmailVerified: true,
          authProvider: 'local',
          termsAccepted: true,
          termsAcceptedAt: new Date(),
          termsVersion: '1.0',
          professionalDisclaimerAccepted: true,
          professionalDisclaimerAcceptedAt: new Date(),
        });

        // Create nurse profile
        const isApproved = config.status === VerificationStatus.APPROVED;
        const nurseProfile = await nurseModel.create({
          userId: nurseUser._id,
          cepNumber,
          cepVerified: isApproved,
          cepVerifiedAt: isApproved ? new Date() : undefined,
          verificationStatus: config.status === VerificationStatus.APPROVED ? 'approved' :
                             config.status === VerificationStatus.REJECTED ? 'rejected' : 'pending',
          specialties: ['Cuidado General', 'Inyecciones'].concat(
            Math.random() > 0.5 ? ['Control de Signos Vitales'] : []
          ),
          bio: config.bio,
          yearsOfExperience: Math.floor(Math.random() * 10) + 2,
          services: randomServices(Math.floor(Math.random() * 5) + 3),
          location: {
            type: 'Point',
            coordinates: [location.lng, location.lat],
            address: location.address,
            city: 'Lima',
            district: location.district,
          },
          serviceRadius: 10,
          extraChargePerKm: 2,
          minimumServiceFee: 20,
          isAvailable: isApproved,
          availableFrom: '08:00',
          availableTo: '20:00',
          availableDays: [1, 2, 3, 4, 5, 6],
          averageRating: isApproved ? 4.0 + Math.random() * 1.0 : 0,
          totalReviews: isApproved ? Math.floor(Math.random() * 30) + 5 : 0,
          totalServicesCompleted: isApproved ? Math.floor(Math.random() * 50) + 10 : 0,
          isActive: isApproved,
        });

        // Update user with nurseProfileId
        await userModel.updateOne(
          { _id: nurseUser._id },
          { $set: { nurseProfileId: nurseProfile._id } }
        );

        // Create verification record
        const daysAgo = Math.floor(Math.random() * 7) + 1;
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        const verificationData: Partial<NurseVerification> = {
          nurseId: nurseProfile._id as Types.ObjectId,
          userId: nurseUser._id as Types.ObjectId,
          status: config.status,
          dniNumber: `4${String(Math.floor(Math.random() * 9999999)).padStart(7, '0')}`,
          fullNameOnDni: `${firstName} ${lastName}`.toUpperCase(),
          attemptNumber: config.status === VerificationStatus.REJECTED ? 2 : 1,
          documents: [
            { url: 'https://example.com/cep_front.jpg', publicId: `cep_front_${nurseIndex}`, type: 'cep_front', uploadedAt: createdAt },
            { url: 'https://example.com/cep_back.jpg', publicId: `cep_back_${nurseIndex}`, type: 'cep_back', uploadedAt: createdAt },
            { url: 'https://example.com/dni_front.jpg', publicId: `dni_front_${nurseIndex}`, type: 'dni_front', uploadedAt: createdAt },
            { url: 'https://example.com/dni_back.jpg', publicId: `dni_back_${nurseIndex}`, type: 'dni_back', uploadedAt: createdAt },
            { url: 'https://example.com/selfie.jpg', publicId: `selfie_${nurseIndex}`, type: 'selfie_with_dni', uploadedAt: createdAt },
          ],
          cepValidation: {
            isValid: config.status !== VerificationStatus.REJECTED,
            cepNumber,
            fullName: `${firstName} ${lastName}`.toUpperCase(),
            region: ['LIMA', 'CALLAO', 'AREQUIPA'][Math.floor(Math.random() * 3)],
            isHabil: config.status !== VerificationStatus.REJECTED,
            status: config.status !== VerificationStatus.REJECTED ? 'HABIL' : 'INHABILITADO',
            validatedAt: createdAt,
          },
          cepIdentityConfirmed: true,
          cepIdentityConfirmedAt: createdAt,
        } as any;

        if (config.status === VerificationStatus.APPROVED || config.status === VerificationStatus.REJECTED) {
          verificationData.reviewedAt = new Date();
          verificationData.reviewNotes = config.status === VerificationStatus.APPROVED
            ? 'Documentos verificados correctamente'
            : 'DNI no coincide con CEP';
        }

        if (config.status === VerificationStatus.REJECTED) {
          verificationData.rejectionReason = 'El numero de DNI no coincide con el registrado en el CEP. Por favor, verifique sus documentos.';
        }

        // Check if verification already exists
        const existingVerification = await verificationModel.findOne({ nurseId: nurseProfile._id });
        if (!existingVerification) {
          await verificationModel.create(verificationData);
        }

        console.log(`   + ${firstName} ${lastName} (${location.district}) - CEP: ${cepNumber}`);
        createdNurses.push({ nurse: nurseProfile as Nurse, user: nurseUser });
      } else {
        console.log(`   = ${email} ya existe`);
        const nurseProfile = await nurseModel.findOne({ userId: nurseUser._id });
        if (nurseProfile) {
          createdNurses.push({ nurse: nurseProfile as Nurse, user: nurseUser });
        }
      }

      nurseIndex++;
    }
  }

  // =========================================
  // 3. CREAR SOLICITUDES DE SERVICIO
  // =========================================
  console.log('\n3. Creando solicitudes de servicio...\n');

  const approvedNurses = createdNurses.filter(n =>
    n.nurse.verificationStatus === 'approved' && n.nurse.isActive
  );

  if (approvedNurses.length > 0 && createdPatients.length > 0) {
    const serviceStatuses = [
      { status: 'completed', count: 5, needsRating: true },
      { status: 'in_progress', count: 2, needsRating: false },
      { status: 'accepted', count: 2, needsRating: false },
      { status: 'pending', count: 3, needsRating: false },
      { status: 'cancelled', count: 1, needsRating: false },
    ];

    for (const statusConfig of serviceStatuses) {
      console.log(`   [${statusConfig.status.toUpperCase()}]`);

      for (let i = 0; i < statusConfig.count; i++) {
        const patient = randomElement(createdPatients);
        const nurseData = randomElement(approvedNurses);
        const service = randomElement(NURSE_SERVICES);
        const locationKey = randomElement(locationKeys);
        const location = LOCATIONS[locationKey];

        const daysAgo = Math.floor(Math.random() * 14) + 1;
        const requestDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        const serviceRequestData: Partial<ServiceRequest> = {
          patientId: patient._id as Types.ObjectId,
          nurseId: nurseData.nurse._id as Types.ObjectId,
          service: {
            name: service.name,
            category: service.category,
            price: service.price,
            currency: 'PEN',
            durationMinutes: service.durationMinutes,
          },
          location: {
            type: 'Point',
            coordinates: [location.lng + (Math.random() - 0.5) * 0.01, location.lat + (Math.random() - 0.5) * 0.01],
            address: location.address,
            district: location.district,
            city: 'Lima',
          },
          requestedDate: requestDate,
          requestedTimeSlot: randomElement(['morning', 'afternoon', 'evening']),
          status: statusConfig.status,
          statusHistory: [
            { status: 'pending', changedAt: requestDate, changedBy: patient._id as Types.ObjectId },
          ],
          patientNotes: Math.random() > 0.5 ? 'Por favor traer todo el material necesario' : undefined,
          paymentStatus: statusConfig.status === 'completed' ? 'paid' : 'pending',
        } as any;

        if (statusConfig.status === 'completed') {
          serviceRequestData.completedAt = new Date(requestDate.getTime() + service.durationMinutes * 60 * 1000);
          serviceRequestData.paymentStatus = 'paid';

          if (statusConfig.needsRating && Math.random() > 0.3) {
            serviceRequestData.rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars
            serviceRequestData.review = randomElement([
              'Excelente servicio, muy profesional',
              'Muy puntual y amable',
              'Buena atencion, lo recomiendo',
              'Profesional y cuidadosa',
              'Todo bien, gracias',
            ]);
            serviceRequestData.reviewedAt = new Date();
          }
        }

        if (statusConfig.status === 'cancelled') {
          serviceRequestData.cancelledAt = new Date(requestDate.getTime() + 2 * 60 * 60 * 1000);
          serviceRequestData.cancellationReason = 'Paciente cancelo por emergencia personal';
        }

        await serviceRequestModel.create(serviceRequestData);
        console.log(`   + ${service.name} - ${patient.firstName} -> ${nurseData.user.firstName}`);
      }
    }
  } else {
    console.log('   ! No hay enfermeras aprobadas o pacientes para crear servicios');
  }

  // =========================================
  // 4. RESUMEN
  // =========================================
  console.log('\n========================================');
  console.log('Histora Care Seeding Completado!');
  console.log('========================================\n');

  const stats = {
    patients: await userModel.countDocuments({ role: UserRole.PATIENT }),
    nurses: await nurseModel.countDocuments(),
    verificationsPending: await verificationModel.countDocuments({ status: VerificationStatus.PENDING }),
    verificationsUnderReview: await verificationModel.countDocuments({ status: VerificationStatus.UNDER_REVIEW }),
    verificationsApproved: await verificationModel.countDocuments({ status: VerificationStatus.APPROVED }),
    verificationsRejected: await verificationModel.countDocuments({ status: VerificationStatus.REJECTED }),
    serviceRequests: await serviceRequestModel.countDocuments(),
  };

  console.log('ESTADISTICAS:');
  console.log(`   Pacientes: ${stats.patients}`);
  console.log(`   Enfermeras: ${stats.nurses}`);
  console.log(`   Verificaciones Pendientes: ${stats.verificationsPending}`);
  console.log(`   Verificaciones En Revision: ${stats.verificationsUnderReview}`);
  console.log(`   Verificaciones Aprobadas: ${stats.verificationsApproved}`);
  console.log(`   Verificaciones Rechazadas: ${stats.verificationsRejected}`);
  console.log(`   Solicitudes de Servicio: ${stats.serviceRequests}`);

  console.log('\nCREDENCIALES DE PRUEBA:');
  console.log('   Password (todas): test1234');
  console.log('\n   PACIENTES:');
  for (let i = 0; i < Math.min(3, PATIENT_NAMES.length); i++) {
    console.log(`   - paciente${i + 1}@care.test`);
  }
  console.log('\n   ENFERMERAS (verificadas):');
  console.log('   - enfermera1@care.test (Miraflores)');
  console.log('   - enfermera2@care.test (San Isidro)');
  console.log('   - enfermera3@care.test (Surco)');
  console.log('\n========================================\n');

  await app.close();
}

seedHistoraCareComplete()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding:', error);
    process.exit(1);
  });
