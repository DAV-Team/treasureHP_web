import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | undefined;

export async function startMemoryMongo(): Promise<string> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  return uri;
}

export async function stopMemoryMongo(): Promise<void> {
  if (mongod) {
    await mongod.stop();
    mongod = undefined;
  }
}
