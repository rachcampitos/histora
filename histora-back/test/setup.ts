/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
dotenv.config();

async function setupMongoMemory() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const mongoServer = await MongoMemoryServer.create();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  process.env.MONGO_URL = mongoServer.getUri();

  if (!process.env.MONGO_URL) {
    throw new Error(
      'MONGO_URL no está definida. Verifica tu archivo .env o setup.ts',
    );
  }
}

export default setupMongoMemory();
