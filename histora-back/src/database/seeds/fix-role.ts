import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument, UserRole } from '../../users/schema/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  const email = 'raulo87@gmail.com';

  console.log('\n=== Checking User Role ===\n');

  // Find user
  const user = await userModel.findOne({ email });

  if (!user) {
    console.log(`User with email ${email} NOT FOUND in this database`);
    console.log('\nListing all users in database:');
    const allUsers = await userModel.find({}, 'email role').limit(10);
    allUsers.forEach(u => console.log(`  - ${u.email}: ${u.role}`));
    await app.close();
    return;
  }

  console.log(`Found user: ${user.email}`);
  console.log(`Current Role: ${user.role}`);
  console.log(`User ID: ${user._id}`);
  console.log(`Google ID: ${user.googleId || 'N/A'}`);

  if (user.role === UserRole.PLATFORM_ADMIN) {
    console.log('\n✅ Role is already platform_admin');
  } else {
    console.log('\n⚠️ Updating role to platform_admin...');

    // Update role
    await userModel.updateOne(
      { email },
      { $set: { role: UserRole.PLATFORM_ADMIN } }
    );

    // Verify update
    const updatedUser = await userModel.findOne({ email });
    console.log(`\n✅ Updated Role: ${updatedUser?.role}`);
  }

  await app.close();
}

bootstrap().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
