import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../users/schema/user.schema';
import { Patient } from '../../patients/schemas/patients.schema';
import { Doctor } from '../../doctors/schema/doctor.schema';

// Users to keep (do not delete)
const KEEP_USERS = [
  'admin@historahealth.com',
  'doctor@historahealth.com',
  'patient@historahealth.com',
  'dr.rodriguez@historahealth.com',
  'juan.perez@gmail.com',
  'raulo87@gmail.com', // App owner/admin
];

async function cleanupTestUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const patientModel = app.get<Model<Patient>>(getModelToken(Patient.name));
  const doctorModel = app.get<Model<Doctor>>(getModelToken(Doctor.name));

  console.log('Starting cleanup of test users...\n');
  console.log('Users to KEEP:');
  KEEP_USERS.forEach(email => console.log(`  - ${email}`));
  console.log('\n');

  // Find all users NOT in the keep list
  const usersToDelete = await userModel.find({
    email: { $nin: KEEP_USERS },
  });

  console.log(`Found ${usersToDelete.length} users to delete:\n`);

  if (usersToDelete.length === 0) {
    console.log('No users to delete. Database is clean.');
    await app.close();
    return;
  }

  // Show users that will be deleted
  for (const user of usersToDelete) {
    console.log(`  - ${user.email} (${user.role}) - ${user.firstName} ${user.lastName}`);
  }

  console.log('\n');

  // Collect user IDs
  const userIds = usersToDelete.map(u => u._id);

  // Delete associated Patient profiles
  const deletedPatients = await patientModel.deleteMany({
    userId: { $in: userIds },
  });
  console.log(`Deleted ${deletedPatients.deletedCount} patient profiles`);

  // Delete associated Doctor profiles
  const deletedDoctors = await doctorModel.deleteMany({
    userId: { $in: userIds },
  });
  console.log(`Deleted ${deletedDoctors.deletedCount} doctor profiles`);

  // Delete users
  const deletedUsers = await userModel.deleteMany({
    _id: { $in: userIds },
  });
  console.log(`Deleted ${deletedUsers.deletedCount} users`);

  console.log('\n========================================');
  console.log('Cleanup completed successfully!');
  console.log('========================================\n');

  // Show remaining users
  const remainingUsers = await userModel.find().select('email role firstName lastName');
  console.log('Remaining users in database:');
  for (const user of remainingUsers) {
    console.log(`  - ${user.email} (${user.role})`);
  }

  await app.close();
}

cleanupTestUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during cleanup:', error);
    process.exit(1);
  });
