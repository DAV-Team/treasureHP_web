import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose, { Connection } from 'mongoose';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDatabase } from './seed.js';
import { LocationSchema } from '../locations/schemas/location.schema.js';
import { ChallengeSchema } from '../challenges/schemas/challenge.schema.js';
import { BadgeSchema } from '../badges/schemas/badge.schema.js';
import { SEED_LOCATIONS } from './seed-data.js';

// Rough bounding box for Hai Phong city & its coastal districts (e.g. Do Son).
const HAI_PHONG_BBOX = {
  minLat: 20.6,
  maxLat: 21.1,
  minLng: 106.4,
  maxLng: 107.1,
};

describe('seedDatabase (mongodb-memory-server)', () => {
  let mongod: MongoMemoryServer;
  let connection: Connection;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    connection = mongoose.createConnection(mongod.getUri());
    await connection.asPromise();
  });

  afterAll(async () => {
    await connection.close();
    await mongod.stop();
  });

  it('seeds the expected number of locations and badges', async () => {
    const result = await seedDatabase(connection);
    expect(result.locations.length).toBe(SEED_LOCATIONS.length);
    expect(result.locations.length).toBeGreaterThanOrEqual(3);
    expect(result.locations.length).toBeLessThanOrEqual(5);
    expect(result.badges.length).toBeGreaterThan(0);
  });

  it('persists all locations with coordinates within the Hai Phong bounding box', async () => {
    const LocationModel = connection.model('Location', LocationSchema);
    const locations = await LocationModel.find().lean();
    expect(locations.length).toBe(SEED_LOCATIONS.length);
    for (const location of locations) {
      expect(location.coordinates.lat).toBeGreaterThanOrEqual(HAI_PHONG_BBOX.minLat);
      expect(location.coordinates.lat).toBeLessThanOrEqual(HAI_PHONG_BBOX.maxLat);
      expect(location.coordinates.lng).toBeGreaterThanOrEqual(HAI_PHONG_BBOX.minLng);
      expect(location.coordinates.lng).toBeLessThanOrEqual(HAI_PHONG_BBOX.maxLng);
    }
  });

  it('creates one challenge per location with valid questions and correctOption', async () => {
    const ChallengeModel = connection.model('Challenge', ChallengeSchema);
    const challenges = await ChallengeModel.find().lean();
    expect(challenges.length).toBe(SEED_LOCATIONS.length);
    for (const challenge of challenges) {
      expect(challenge.questions.length).toBeGreaterThanOrEqual(1);
      for (const question of challenge.questions) {
        const optionKeys = question.options.map((option) => option.key);
        expect(optionKeys).toContain(question.correctOption);
      }
    }
  });

  it('persists badges with a valid unlock condition', async () => {
    const BadgeModel = connection.model('Badge', BadgeSchema);
    const badges = await BadgeModel.find().lean();
    for (const badge of badges) {
      expect(badge.unlockCondition).toBeDefined();
      expect(badge.unlockCondition.value).toBeGreaterThanOrEqual(0);
    }
  });
});
