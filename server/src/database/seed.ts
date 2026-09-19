import type { Connection } from 'mongoose';
import { LocationSchema } from '../locations/schemas/location.schema.js';
import { ChallengeSchema } from '../challenges/schemas/challenge.schema.js';
import { BadgeSchema } from '../badges/schemas/badge.schema.js';
import { SEED_LOCATIONS, SEED_BADGES } from './seed-data.js';

export async function seedDatabase(connection: Connection) {
  const LocationModel = connection.model('Location', LocationSchema);
  const ChallengeModel = connection.model('Challenge', ChallengeSchema);
  const BadgeModel = connection.model('Badge', BadgeSchema);

  await Promise.all([
    LocationModel.deleteMany({}),
    ChallengeModel.deleteMany({}),
    BadgeModel.deleteMany({}),
  ]);

  const createdLocations = [];
  for (const seedLocation of SEED_LOCATIONS) {
    const { challenge, ...locationData } = seedLocation;
    const location = await LocationModel.create(locationData);
    const createdChallenge = await ChallengeModel.create({
      locationId: location._id,
      levelName: challenge.levelName,
      xpReward: challenge.xpReward,
      questions: challenge.questions,
    });
    createdLocations.push({ location, challenge: createdChallenge });
  }

  const createdBadges = await BadgeModel.insertMany(SEED_BADGES);

  return { locations: createdLocations, badges: createdBadges };
}
