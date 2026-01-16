/**
 * Script to PERMANENTLY delete a user and all related data
 * This allows the user to register again from scratch
 *
 * Usage: MONGO_URL="your-mongo-url" npx ts-node scripts/hard-delete-user.ts <email-or-id>
 *
 * Example:
 * MONGO_URL="mongodb+srv://..." npx ts-node scripts/hard-delete-user.ts mariaclaudia.chavez3@gmail.com
 */

import { MongoClient, ObjectId } from 'mongodb';

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const searchTerm = process.argv[2];

  if (!mongoUrl) {
    console.error('❌ MONGO_URL environment variable is required');
    process.exit(1);
  }

  if (!searchTerm) {
    console.error('❌ Please provide an email or user ID');
    console.log('Usage: MONGO_URL="..." npx ts-node scripts/hard-delete-user.ts <email-or-id>');
    process.exit(1);
  }

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(); // Uses database from connection string

    // Find user by email (including deleted_ prefix) or by ID
    const usersCollection = db.collection('users');

    let user;
    if (ObjectId.isValid(searchTerm)) {
      user = await usersCollection.findOne({ _id: new ObjectId(searchTerm) });
    }

    if (!user) {
      // Search by email (exact or with deleted_ prefix)
      user = await usersCollection.findOne({
        $or: [
          { email: searchTerm },
          { email: { $regex: new RegExp(`deleted_\\d+_${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) } }
        ]
      });
    }

    if (!user) {
      console.error(`❌ User not found: ${searchTerm}`);
      process.exit(1);
    }

    console.log('🔍 Found user:');
    console.log(`   ID: ${user._id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   isDeleted: ${user.isDeleted}`);
    console.log('');

    const userId = user._id;
    const deletedItems: string[] = [];

    // 1. Find and delete nurse profile
    const nursesCollection = db.collection('nurses');
    const nurse = await nursesCollection.findOne({ userId: userId });

    if (nurse) {
      console.log(`🔍 Found nurse profile: ${nurse._id}`);

      // Delete nurse verifications
      const verificationsCollection = db.collection('nurseverifications');
      const verificationResult = await verificationsCollection.deleteMany({ nurseId: nurse._id });
      if (verificationResult.deletedCount > 0) {
        deletedItems.push(`${verificationResult.deletedCount} nurse verification(s)`);
      }

      // Delete service requests as nurse
      const serviceRequestsCollection = db.collection('servicerequests');
      const serviceResult = await serviceRequestsCollection.deleteMany({ nurseId: nurse._id });
      if (serviceResult.deletedCount > 0) {
        deletedItems.push(`${serviceResult.deletedCount} service request(s) as nurse`);
      }

      // Delete nurse profile
      await nursesCollection.deleteOne({ _id: nurse._id });
      deletedItems.push('nurse profile');
    }

    // 2. Delete service requests as patient
    const serviceRequestsCollection = db.collection('servicerequests');
    const patientServiceResult = await serviceRequestsCollection.deleteMany({ patientId: userId });
    if (patientServiceResult.deletedCount > 0) {
      deletedItems.push(`${patientServiceResult.deletedCount} service request(s) as patient`);
    }

    // 3. Delete notifications
    const notificationsCollection = db.collection('notifications');
    const notifResult = await notificationsCollection.deleteMany({ userId: userId });
    if (notifResult.deletedCount > 0) {
      deletedItems.push(`${notifResult.deletedCount} notification(s)`);
    }

    // 4. Delete notification preferences
    const notifPrefsCollection = db.collection('notificationpreferences');
    const notifPrefsResult = await notifPrefsCollection.deleteMany({ userId: userId });
    if (notifPrefsResult.deletedCount > 0) {
      deletedItems.push(`${notifPrefsResult.deletedCount} notification preference(s)`);
    }

    // 5. Delete the user
    await usersCollection.deleteOne({ _id: userId });
    deletedItems.push('user account');

    console.log('✅ PERMANENTLY DELETED:');
    for (const item of deletedItems) {
      console.log(`   • ${item}`);
    }

    console.log('\n🎉 User can now register again with the same email!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

main();
