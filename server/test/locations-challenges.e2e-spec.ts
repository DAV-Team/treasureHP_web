import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { startMemoryMongo, stopMemoryMongo } from './utils/memory-mongo.js';
import { seedDatabase } from '../src/database/seed.js';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SEED_LOCATIONS } from '../src/database/seed-data.js';

describe('Locations & Challenges (e2e)', () => {
  let app: INestApplication;
  let locationId: string;

  beforeAll(async () => {
    await startMemoryMongo();
  });

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const connection = app.get<Connection>(getConnectionToken());
    const result = await seedDatabase(connection);
    const seededLocation = result.locations[0];
    expect(seededLocation.challenge.locationId.toString()).toBe(seededLocation.location._id.toString());
    locationId = seededLocation.challenge.locationId.toString();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /locations returns all seeded locations', async () => {
    const response = await request(app.getHttpServer()).get('/locations').expect(200);
    expect(response.body).toHaveLength(SEED_LOCATIONS.length);
  });

  it('GET /locations?category=history returns only history locations', async () => {
    const response = await request(app.getHttpServer())
      .get('/locations?category=history')
      .expect(200);

    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((location: { category: string }) => location.category === 'history')).toBe(true);
  });

  it('GET /locations/:id/challenge never exposes correctOption', async () => {
    const response = await request(app.getHttpServer())
      .get(`/locations/${locationId}/challenge`)
      .expect(200);

    expect(response.body.questions.length).toBeGreaterThan(0);
    for (const question of response.body.questions) {
      expect(question).not.toHaveProperty('correctOption');
    }
    expect(JSON.stringify(response.body)).not.toContain('correctOption');
  });

  it('GET /locations/:id does not expose cultureStory.content while locked', async () => {
    const response = await request(app.getHttpServer()).get(`/locations/${locationId}`).expect(200);

    expect(response.body.cultureStory).not.toHaveProperty('content');
    expect(response.body.cultureStory.locked).toBe(true);
    expect(response.body.progress.cultureStoryUnlocked).toBe(false);
  });

  it('returns 404 for an ObjectId with no location', async () => {
    await request(app.getHttpServer()).get('/locations/507f1f77bcf86cd799439011').expect(404);
  });

  it('returns 400 for a malformed ObjectId', async () => {
    await request(app.getHttpServer()).get('/locations/not-an-object-id').expect(400);
  });

  it('returns 400 for invalid category filter', async () => {
    await request(app.getHttpServer()).get('/locations?category=not-valid').expect(400);
  });
});
