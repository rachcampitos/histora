import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/histora_db';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;
    const usersCollection = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@histora.care' });
    const hashedPassword = await bcrypt.hash('Admin123', 10);

    if (existingAdmin) {
      console.log('Admin user already exists, updating...');

      await usersCollection.updateOne(
        { email: 'admin@histora.care' },
        {
          $set: {
            password: hashedPassword,
            role: 'platform_admin',
            isActive: true,
            isDeleted: false,
            isEmailVerified: true,
            updatedAt: new Date(),
          }
        }
      );
      console.log('Admin user updated!');
    } else {
      // Create new admin
      await usersCollection.insertOne({
        email: 'admin@histora.care',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Histora',
        role: 'platform_admin',
        isActive: true,
        isDeleted: false,
        isEmailVerified: true,
        authProvider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Admin user created!');
    }

    // Verify the user
    const admin = await usersCollection.findOne({ email: 'admin@histora.care' });
    if (admin) {
      console.log('\nAdmin user details:');
      console.log('- ID:', admin._id);
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- isActive:', admin.isActive);
      console.log('- Has password:', !!admin.password);

      // Test password comparison
      const isMatch = await bcrypt.compare('Admin123', admin.password as string);
      console.log('- Password matches Admin123:', isMatch);

      console.log('\n✅ Admin credentials:');
      console.log('   Email: admin@histora.care');
      console.log('   Password: Admin123');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createAdmin();
