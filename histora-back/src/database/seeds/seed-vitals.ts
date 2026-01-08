import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserRole } from '../../users/schema/user.schema';
import { Clinic } from '../../clinics/schema/clinic.schema';
import { Patient } from '../../patients/schemas/patients.schema';
import { Doctor } from '../../doctors/schema/doctor.schema';
import { Vitals } from '../../vitals/schema/vitals.schema';
import { Consultation, ConsultationStatus } from '../../consultations/schema/consultation.schema';

async function seedVitals() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const clinicModel = app.get<Model<Clinic>>(getModelToken(Clinic.name));
  const patientModel = app.get<Model<Patient>>(getModelToken(Patient.name));
  const doctorModel = app.get<Model<Doctor>>(getModelToken(Doctor.name));
  const vitalsModel = app.get<Model<Vitals>>(getModelToken(Vitals.name));
  const consultationModel = app.get<Model<Consultation>>(getModelToken(Consultation.name));

  console.log('Starting vitals and consultations seeding...\n');

  // 1. Get existing doctor user
  const doctorUser = await userModel.findOne({ email: 'doctor@historahealth.com' });
  if (!doctorUser) {
    console.error('Doctor user not found. Run seed-users first.');
    await app.close();
    process.exit(1);
  }
  console.log(`Found doctor user: ${doctorUser.firstName} ${doctorUser.lastName}`);

  // 2. Get existing patient user
  const patientUser = await userModel.findOne({ email: 'patient@historahealth.com' });
  if (!patientUser) {
    console.error('Patient user not found. Run seed-users first.');
    await app.close();
    process.exit(1);
  }
  console.log(`Found patient user: ${patientUser.firstName} ${patientUser.lastName}`);

  // 3. Get existing clinic
  const clinic = await clinicModel.findOne({ ownerId: doctorUser._id });
  if (!clinic) {
    console.error('Clinic not found. Run seed-users first.');
    await app.close();
    process.exit(1);
  }
  console.log(`Found clinic: ${clinic.name}`);

  // 4. Create or get doctor profile
  let doctor = await doctorModel.findOne({ userId: doctorUser._id });
  if (!doctor) {
    doctor = await doctorModel.create({
      userId: doctorUser._id,
      clinicId: clinic._id,
      firstName: doctorUser.firstName,
      lastName: doctorUser.lastName,
      email: doctorUser.email,
      phone: doctorUser.phone,
      specialty: 'Medicina General',
      licenseNumber: 'CMP-12345',
      isActive: true,
    });
    console.log('Created doctor profile');

    // Update user with doctorProfileId
    await userModel.updateOne(
      { _id: doctorUser._id },
      { $set: { doctorProfileId: doctor._id } }
    );
  } else {
    console.log('Doctor profile already exists');
  }

  // 5. Create or get patient profile
  let patient = await patientModel.findOne({ userId: patientUser._id, clinicId: clinic._id });
  if (!patient) {
    patient = await patientModel.create({
      userId: patientUser._id,
      clinicId: clinic._id,
      firstName: patientUser.firstName,
      lastName: patientUser.lastName || 'García',
      email: patientUser.email,
      phone: patientUser.phone,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'female',
      documentType: 'DNI',
      documentNumber: '12345678',
      bloodType: 'O+',
      allergies: ['Penicilina'],
      chronicConditions: ['Hipertensión leve'],
      address: {
        street: 'Av. Los Pinos 123',
        city: 'Lima',
        state: 'Lima',
        country: 'Perú',
        postalCode: '15001',
      },
      emergencyContactName: 'Juan García',
      emergencyContactPhone: '+51 999 111 222',
      emergencyContactRelation: 'Esposo',
    });
    console.log('Created patient profile');

    // Update user with patientProfileId
    await userModel.updateOne(
      { _id: patientUser._id },
      { $set: { patientProfileId: patient._id } }
    );
  } else {
    console.log('Patient profile already exists');
  }

  // 6. Delete existing vitals for this patient (to avoid duplicates)
  const deletedVitals = await vitalsModel.deleteMany({ patientId: patient._id });
  console.log(`Deleted ${deletedVitals.deletedCount} existing vitals records`);

  // 7. Create vitals records for the last 14 days
  const now = new Date();
  const vitalsRecords: Partial<Vitals>[] = [];

  // Helper to generate random values with small variations
  const randomInRange = (base: number, variance: number) =>
    Math.round((base + (Math.random() * variance * 2 - variance)) * 10) / 10;

  for (let i = 13; i >= 0; i--) {
    const recordDate = new Date(now);
    recordDate.setDate(recordDate.getDate() - i);
    recordDate.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60), 0, 0);

    vitalsRecords.push({
      clinicId: clinic._id as Types.ObjectId,
      patientId: patient._id as Types.ObjectId,
      recordedBy: doctorUser._id as Types.ObjectId,
      recordedAt: recordDate,
      temperature: randomInRange(36.5, 0.5),
      heartRate: Math.round(randomInRange(72, 8)),
      respiratoryRate: Math.round(randomInRange(16, 2)),
      systolicBP: Math.round(randomInRange(122, 10)),
      diastolicBP: Math.round(randomInRange(78, 6)),
      oxygenSaturation: Math.round(randomInRange(97, 2)),
      weight: randomInRange(65, 1),
      height: 165, // Fixed height
      bloodGlucose: Math.round(randomInRange(95, 10)),
      painLevel: Math.floor(Math.random() * 3), // 0-2 pain level
      notes: i === 0 ? 'Signos vitales dentro de parámetros normales' : undefined,
      isDeleted: false,
    });
  }

  await vitalsModel.insertMany(vitalsRecords);
  console.log(`Created ${vitalsRecords.length} vitals records`);

  // 8. Delete existing consultations for this patient (to avoid duplicates)
  const deletedConsultations = await consultationModel.deleteMany({ patientId: patient._id });
  console.log(`Deleted ${deletedConsultations.deletedCount} existing consultation records`);

  // 9. Create consultations with prescriptions
  const consultationsData = [
    {
      daysAgo: 7,
      chiefComplaint: 'Control de presión arterial',
      diagnoses: [
        { code: 'I10', description: 'Hipertensión esencial primaria', type: 'principal' },
      ],
      prescriptions: [
        {
          medication: 'Losartán 50mg',
          dosage: '50mg',
          frequency: 'Una vez al día',
          duration: '30 días',
          route: 'oral',
          instructions: 'Tomar en la mañana con el desayuno',
          isControlled: false,
        },
        {
          medication: 'Aspirina 100mg',
          dosage: '100mg',
          frequency: 'Una vez al día',
          duration: '30 días',
          route: 'oral',
          instructions: 'Tomar después del almuerzo',
          isControlled: false,
        },
      ],
      treatmentPlan: 'Continuar con medicación antihipertensiva. Dieta baja en sodio. Control en 30 días.',
      status: ConsultationStatus.COMPLETED,
    },
    {
      daysAgo: 21,
      chiefComplaint: 'Dolor de cabeza frecuente',
      diagnoses: [
        { code: 'R51', description: 'Cefalea', type: 'principal' },
        { code: 'I10', description: 'Hipertensión esencial primaria', type: 'secondary' },
      ],
      prescriptions: [
        {
          medication: 'Paracetamol 500mg',
          dosage: '500mg',
          frequency: 'Cada 8 horas si dolor',
          duration: '5 días',
          route: 'oral',
          instructions: 'Tomar solo cuando presente dolor de cabeza',
          isControlled: false,
        },
      ],
      treatmentPlan: 'Analgésicos PRN. Reposo. Hidratación adecuada. Monitorear presión arterial.',
      status: ConsultationStatus.COMPLETED,
    },
    {
      daysAgo: 45,
      chiefComplaint: 'Chequeo general anual',
      diagnoses: [
        { code: 'Z00.0', description: 'Examen médico general', type: 'principal' },
      ],
      prescriptions: [
        {
          medication: 'Vitamina D3 1000UI',
          dosage: '1000UI',
          frequency: 'Una vez al día',
          duration: '60 días',
          route: 'oral',
          instructions: 'Tomar con el desayuno',
          isControlled: false,
        },
        {
          medication: 'Omega 3 1000mg',
          dosage: '1000mg',
          frequency: 'Una vez al día',
          duration: '60 días',
          route: 'oral',
          instructions: 'Tomar con las comidas',
          isControlled: false,
        },
      ],
      treatmentPlan: 'Paciente en buen estado general. Suplementación vitamínica. Próximo chequeo en 1 año.',
      status: ConsultationStatus.COMPLETED,
    },
  ];

  for (const consultData of consultationsData) {
    const consultDate = new Date(now);
    consultDate.setDate(consultDate.getDate() - consultData.daysAgo);
    consultDate.setHours(10, 0, 0, 0);

    // Find vitals closest to this consultation date
    const closestVitals = vitalsRecords.find(v => {
      const vDate = new Date(v.recordedAt!);
      const diffDays = Math.abs(Math.round((consultDate.getTime() - vDate.getTime()) / (1000 * 60 * 60 * 24)));
      return diffDays <= 1;
    });

    // Create vitals for consultation if not found
    let vitalsId: Types.ObjectId | undefined;
    if (consultData.daysAgo > 13) {
      // Create specific vitals for older consultations
      const vitalsForConsult = await vitalsModel.create({
        clinicId: clinic._id,
        patientId: patient._id,
        recordedBy: doctorUser._id,
        recordedAt: consultDate,
        temperature: randomInRange(36.5, 0.3),
        heartRate: Math.round(randomInRange(72, 5)),
        respiratoryRate: Math.round(randomInRange(16, 2)),
        systolicBP: Math.round(randomInRange(125, 8)),
        diastolicBP: Math.round(randomInRange(80, 5)),
        oxygenSaturation: Math.round(randomInRange(98, 1)),
        weight: randomInRange(65, 0.5),
        height: 165,
        bloodGlucose: Math.round(randomInRange(92, 8)),
        painLevel: 0,
        isDeleted: false,
      });
      vitalsId = vitalsForConsult._id as Types.ObjectId;
    }

    await consultationModel.create({
      clinicId: clinic._id,
      patientId: patient._id,
      doctorId: doctor._id,
      vitalsId: vitalsId,
      date: consultDate,
      status: consultData.status,
      chiefComplaint: consultData.chiefComplaint,
      historyOfPresentIllness: `Paciente acude por ${consultData.chiefComplaint.toLowerCase()}. Se realiza evaluación completa.`,
      diagnoses: consultData.diagnoses,
      prescriptions: consultData.prescriptions,
      treatmentPlan: consultData.treatmentPlan,
      followUpDate: new Date(consultDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      followUpInstructions: 'Control en 30 días. Acudir antes si presenta síntomas.',
      isDeleted: false,
    });
  }

  console.log(`Created ${consultationsData.length} consultation records with prescriptions`);

  console.log('\n========================================');
  console.log('Vitals and Consultations Seeding completed!');
  console.log('========================================\n');
  console.log('--- Test Data Summary ---');
  console.log(`Patient: ${patient.firstName} ${patient.lastName} (${patientUser.email})`);
  console.log(`Doctor: Dr. ${doctor.firstName} ${doctor.lastName}`);
  console.log(`Clinic: ${clinic.name}`);
  console.log(`Vitals records: ${vitalsRecords.length + consultationsData.filter(c => c.daysAgo > 13).length}`);
  console.log(`Consultations: ${consultationsData.length}`);
  console.log('\n--- How to Test ---');
  console.log('1. Login as patient: patient@historahealth.com / patient123');
  console.log('2. Go to Patient Dashboard');
  console.log('3. You should see vitals, statistics, and medications from consultations');
  console.log('========================================\n');

  await app.close();
}

seedVitals()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error seeding vitals:', error);
    process.exit(1);
  });
