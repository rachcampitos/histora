/**
 * Script to check MongoDB databases and help with user cleanup
 * Usage: MONGO_URL="your-mongo-url" npx ts-node scripts/check-databases.ts
 */

import { MongoClient } from 'mongodb';

async function main() {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl) {
    console.error('❌ MONGO_URL environment variable is required');
    console.log('Usage: MONGO_URL="mongodb+srv://..." npx ts-node scripts/check-databases.ts');
    process.exit(1);
  }

  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();

    console.log('📊 Databases found:');
    console.log('─'.repeat(50));

    for (const db of databases.databases) {
      if (!['admin', 'local', 'config'].includes(db.name)) {
        console.log(`  • ${db.name} (${((db.sizeOnDisk || 0) / 1024 / 1024).toFixed(2)} MB)`);

        // List collections in this database
        const database = client.db(db.name);
        const collections = await database.listCollections().toArray();

        for (const col of collections) {
          const count = await database.collection(col.name).countDocuments();
          console.log(`      └─ ${col.name}: ${count} documents`);
        }
      }
    }

    // Check for deleted users
    console.log('\n📋 Checking for soft-deleted users:');
    console.log('─'.repeat(50));

    for (const dbInfo of databases.databases) {
      if (!['admin', 'local', 'config'].includes(dbInfo.name)) {
        const database = client.db(dbInfo.name);
        const usersCollection = database.collection('users');

        const deletedUsers = await usersCollection.find({
          $or: [
            { isDeleted: true },
            { email: { $regex: /^deleted_/ } }
          ]
        }).toArray();

        if (deletedUsers.length > 0) {
          console.log(`\n  Database: ${dbInfo.name}`);
          for (const user of deletedUsers) {
            console.log(`    • ID: ${user._id}`);
            console.log(`      Email: ${user.email}`);
            console.log(`      Original: ${user.email.replace(/^deleted_\d+_/, '')}`);
            console.log(`      Role: ${user.role}`);
            console.log('');
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n✅ Connection closed');
  }
}

main();
