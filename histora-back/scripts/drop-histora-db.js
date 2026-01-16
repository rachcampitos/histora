const { MongoClient } = require('mongodb');

async function dropHistoraDb() {
  const client = new MongoClient(process.env.MONGO_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    // Drop the old 'histora' database
    const db = client.db('histora');
    await db.dropDatabase();

    console.log('Database "histora" has been DELETED');

    // Verify
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();

    console.log('\nRemaining databases:');
    for (const dbInfo of databases.databases) {
      if (!['admin', 'local', 'config'].includes(dbInfo.name)) {
        console.log('   - ' + dbInfo.name);
      }
    }

  } finally {
    await client.close();
  }
}

dropHistoraDb();
