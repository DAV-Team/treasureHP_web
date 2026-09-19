import mongoose from 'mongoose';
import { seedDatabase } from './seed.js';

async function run() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/culture-quest';
  await mongoose.connect(uri);
  const result = await seedDatabase(mongoose.connection);
  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${result.locations.length} locations and ${result.badges.length} badges into ${uri}`,
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
