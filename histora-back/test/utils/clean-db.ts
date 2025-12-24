import mongoose from 'mongoose';

enum ConnectionStates {
  disconnected = 0,
  connected = 1,
  connecting = 2,
  disconnecting = 3,
  uninitialized = 99,
}

export async function cleanDatabase(collections: string[]) {
  if (
    (mongoose.connection.readyState as ConnectionStates) !==
    ConnectionStates.connected
  ) {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) throw new Error('MONGO_URL no está definida');
    await mongoose.connect(mongoUrl);
  }

  for (const name of collections) {
    await mongoose.connection.collection(name).deleteMany({});
  }
}
