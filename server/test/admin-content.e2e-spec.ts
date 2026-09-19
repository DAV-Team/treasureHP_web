import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { Badge } from '../src/badges/schemas/badge.schema.js';
import { UserBadge } from '../src/badges/schemas/user-badge.schema.js';
import { Challenge } from '../src/challenges/schemas/challenge.schema.js';
import { Location } from '../src/locations/schemas/location.schema.js';
import { UserProgress } from '../src/progress/schemas/user-progress.schema.js';
import { User } from '../src/users/schemas/user.schema.js';
import { startMemoryMongo, stopMemoryMongo } from './utils/memory-mongo.js';

const locationData = (slug = 'cho-sat') => ({
  name: 'Chợ Sắt', slug, address: 'Cát Dài, Lê Chân', category: 'cuisine', coordinates: { lat: 20.85, lng: 106.68 },
  coverImageUrl: '/images/opera-cover.jpg', shortDescription: 'Khu chợ lâu đời.', cultureStory: { title: 'Chợ Sắt', content: 'Câu chuyện.' }, xpReward: 30, isSpecialQuest: false,
});

const question = (order: number, overrides: object = {}) => ({
  order, imageUrl: '/images/opera-house.jpg', highlightBox: { x: 10, y: 10, width: 20, height: 20 }, questionText: `Câu ${order}?`,
  options: [{ key: 'A', text: 'a' }, { key: 'B', text: 'b' }, { key: 'C', text: 'c' }, { key: 'D', text: 'd' }], correctOption: 'B', hintText: 'Gợi ý', ...overrides,
});

const badgeData = (code = 'food_fan') => ({ code, name: 'Food Fan', description: 'Thử 3 món.', icon: 'utensils', colorTheme: 'red', unlockCondition: { type: 'totalLocations', value: 3 } });

describe('Admin content CRUD (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => { await startMemoryMongo(); });
  afterAll(async () => { await stopMemoryMongo(); });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    for (const name of [User.name, Location.name, Challenge.name, Badge.name, UserProgress.name, UserBadge.name]) await app.get<Model<unknown>>(getModelToken(name)).deleteMany({});
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email: 'admin@example.com', password: 'SuperSecret123', name: 'Admin' }).expect(201);
    await app.get<Model<User>>(getModelToken(User.name)).updateOne({ email: 'admin@example.com' }, { role: 'admin' });
    token = res.body.accessToken;
  });

  afterEach(async () => { await app.close(); });

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());
  const model = <T,>(cls: { name: string }) => app.get<Model<T>>(getModelToken(cls.name));

  describe('locations', () => {
    it('creates, updates and deletes a location', async () => {
      const created = await http().post('/admin/locations').set(auth()).send(locationData()).expect(201);
      const id = created.body._id;
      const updated = await http().patch(`/admin/locations/${id}`).set(auth()).send({ name: 'Chợ Sắt Mới', xpReward: 45 }).expect(200);
      expect(updated.body).toMatchObject({ name: 'Chợ Sắt Mới', xpReward: 45 });
      await http().delete(`/admin/locations/${id}`).set(auth()).expect(200);
      expect(await model<Location>(Location).countDocuments()).toBe(0);
    });

    it('answers 400 with the reasons for invalid data instead of a 500', async () => {
      const res = await http().post('/admin/locations').set(auth()).send({ ...locationData(), category: 'sports', coordinates: { lat: 200, lng: 106 } }).expect(400);
      expect(Array.isArray(res.body.message)).toBe(true);
      await http().patch('/admin/locations/not-an-id').set(auth()).send({ name: 'x' }).expect(400);
      await http().delete('/admin/locations/not-an-id').set(auth()).expect(400);
    });

    it('answers 409 for a duplicate slug and 404 for unknown ids', async () => {
      await http().post('/admin/locations').set(auth()).send(locationData()).expect(201);
      await http().post('/admin/locations').set(auth()).send(locationData()).expect(409);
      await http().patch(`/admin/locations/${new Types.ObjectId()}`).set(auth()).send({ name: 'Ai đó' }).expect(404);
    });

    it('deleting a location also removes its challenge and player progress', async () => {
      const location = (await http().post('/admin/locations').set(auth()).send(locationData()).expect(201)).body;
      await http().post('/admin/challenges').set(auth()).send({ locationId: location._id, levelName: 'Cấp 1', xpReward: 30, questions: [question(1)] }).expect(201);
      await model<UserProgress>(UserProgress).create({ userId: new Types.ObjectId(), locationId: new Types.ObjectId(location._id), status: 'completed' });
      await http().delete(`/admin/locations/${location._id}`).set(auth()).expect(200);
      expect(await model<Challenge>(Challenge).countDocuments()).toBe(0);
      expect(await model<UserProgress>(UserProgress).countDocuments()).toBe(0);
    });
  });

  describe('challenges', () => {
    async function makeLocation(slug: string) {
      return (await http().post('/admin/locations').set(auth()).send(locationData(slug)).expect(201)).body._id as string;
    }

    it('creates a challenge for an existing location and lists it with the location name', async () => {
      const locationId = await makeLocation('a');
      await http().post('/admin/challenges').set(auth()).send({ locationId, levelName: 'Cấp 1', xpReward: 30, questions: [question(1), question(2)] }).expect(201);
      const list = await http().get('/admin/challenges').set(auth()).expect(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0].locationId).toMatchObject({ _id: locationId, name: 'Chợ Sắt' });
    });

    it('rejects a correct option that is not among the options, duplicate orders and empty question lists', async () => {
      const locationId = await makeLocation('b');
      const post = (questions: unknown[]) => http().post('/admin/challenges').set(auth()).send({ locationId, levelName: 'X', xpReward: 1, questions });
      await post([question(1, { correctOption: 'E' })]).expect(400);
      await post([question(1, { options: [{ key: 'A', text: 'a' }, { key: 'A', text: 'again' }], correctOption: 'A' })]).expect(400);
      await post([question(1), question(1)]).expect(400);
      await post([]).expect(400);
      expect(await model<Challenge>(Challenge).countDocuments()).toBe(0);
    });

    it('allows only one challenge per location and requires the location to exist', async () => {
      const locationId = await makeLocation('c');
      const body = { locationId, levelName: 'Cấp 1', xpReward: 30, questions: [question(1)] };
      await http().post('/admin/challenges').set(auth()).send(body).expect(201);
      await http().post('/admin/challenges').set(auth()).send(body).expect(409);
      await http().post('/admin/challenges').set(auth()).send({ ...body, locationId: new Types.ObjectId().toString() }).expect(400);
      await http().post('/admin/challenges').set(auth()).send({ ...body, locationId: 'nope' }).expect(400);
    });

    it('updates questions but keeps them valid, and lets a challenge keep its own location', async () => {
      const locationId = await makeLocation('d');
      const id = (await http().post('/admin/challenges').set(auth()).send({ locationId, levelName: 'Cấp 1', xpReward: 30, questions: [question(1)] }).expect(201)).body._id;
      await http().patch(`/admin/challenges/${id}`).set(auth()).send({ locationId, levelName: 'Cấp 1 mới', questions: [question(1), question(2)] }).expect(200);
      await http().patch(`/admin/challenges/${id}`).set(auth()).send({ questions: [question(1, { correctOption: 'Z' })] }).expect(400);
      await http().patch('/admin/challenges/bad-id').set(auth()).send({ levelName: 'x' }).expect(400);
    });
  });

  describe('badges', () => {
    it('creates, updates and deletes a badge, and deleting removes it from players', async () => {
      const badge = (await http().post('/admin/badges').set(auth()).send(badgeData()).expect(201)).body;
      await model<UserBadge>(UserBadge).create({ userId: new Types.ObjectId(), badgeId: new Types.ObjectId(badge._id) });
      const updated = await http().patch(`/admin/badges/${badge._id}`).set(auth()).send({ name: 'Food Lover', unlockCondition: { type: 'locationsInCategory', value: 2, category: 'cuisine' } }).expect(200);
      expect(updated.body).toMatchObject({ name: 'Food Lover', unlockCondition: { type: 'locationsInCategory', value: 2, category: 'cuisine' } });
      await http().delete(`/admin/badges/${badge._id}`).set(auth()).expect(200);
      expect(await model<Badge>(Badge).countDocuments()).toBe(0);
      expect(await model<UserBadge>(UserBadge).countDocuments()).toBe(0);
    });

    it('answers 400 for an invalid unlock condition and 409 for a duplicate code', async () => {
      await http().post('/admin/badges').set(auth()).send({ ...badgeData(), unlockCondition: { type: 'magic', value: 1 } }).expect(400);
      await http().post('/admin/badges').set(auth()).send(badgeData()).expect(201);
      await http().post('/admin/badges').set(auth()).send(badgeData()).expect(409);
    });
  });

  it('keeps content management away from players and guests', async () => {
    const player = await http().post('/auth/register').send({ email: 'p@example.com', password: 'SuperSecret123', name: 'Player' }).expect(201);
    await http().post('/admin/locations').set({ Authorization: `Bearer ${player.body.accessToken}` }).send(locationData()).expect(403);
    await http().post('/admin/locations').send(locationData()).expect(401);
  });
});
