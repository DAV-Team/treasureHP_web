import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { AppModule } from '../src/app.module.js';
import { seedDatabase } from '../src/database/seed.js';
import { startMemoryMongo, stopMemoryMongo } from './utils/memory-mongo.js';
import { ChallengeSchema } from '../src/challenges/schemas/challenge.schema.js';

interface UserSession {
  token: string;
  id: string;
}

describe('Progress, XP & badges (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let locationId: string;
  let firstQuestionOrder: number;
  let firstCorrectOption: string;

  beforeAll(async () => {
    await startMemoryMongo();
  });

  afterAll(async () => {
    await stopMemoryMongo();
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    connection = app.get<Connection>(getConnectionToken());
    const seeded = await seedDatabase(connection);
    const challenge = seeded.locations[0].challenge;
    locationId = challenge.locationId.toString();
    firstQuestionOrder = challenge.questions[0].order;
    firstCorrectOption = challenge.questions[0].correctOption;
  });

  afterEach(async () => {
    await app.close();
  });

  async function register(email: string): Promise<UserSession> {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'SecurePass123', name: 'Quest Player' })
      .expect(201);
    return { token: response.body.accessToken, id: response.body.user.id };
  }

  function auth(session: UserSession) {
    return { Authorization: `Bearer ${session.token}` };
  }

  it('correct answer -> complete awards exact XP and unlocks Culture Story', async () => {
    const player = await register('correct@example.com');

    const answer = await request(app.getHttpServer())
      .post(`/locations/${locationId}/challenge/answer`)
      .set(auth(player))
      .send({ questionOrder: firstQuestionOrder, selectedOption: firstCorrectOption })
      .expect(201);
    expect(answer.body).toMatchObject({ questionOrder: firstQuestionOrder, isCorrect: true });
    expect(answer.body).not.toHaveProperty('correctOption');

    const completed = await request(app.getHttpServer())
      .post(`/locations/${locationId}/complete`)
      .set(auth(player))
      .expect(201);
    expect(completed.body).toMatchObject({ completed: true, xpEarned: 50, totalXp: 50, level: 1 });

    const detail = await request(app.getHttpServer())
      .get(`/locations/${locationId}`)
      .set(auth(player))
      .expect(200);
    expect(detail.body.cultureStory.content).toContain('Xây dựng từ năm 1904');
    expect(detail.body.progress.cultureStoryUnlocked).toBe(true);

    const progress = await request(app.getHttpServer())
      .get('/users/me/progress')
      .set(auth(player))
      .expect(200);
    expect(progress.body).toHaveLength(1);
    expect(progress.body[0]).toMatchObject({ status: 'completed', cultureStoryUnlocked: true, xpEarned: 50 });
  });

  it('GET /locations reports per-user progress after completing, and never leaks story content', async () => {
    const player = await register('list@example.com');
    const other = await register('list-other@example.com');
    await request(app.getHttpServer()).post(`/locations/${locationId}/challenge/answer`).set(auth(player)).send({ questionOrder: firstQuestionOrder, selectedOption: firstCorrectOption }).expect(201);
    await request(app.getHttpServer()).post(`/locations/${locationId}/complete`).set(auth(player)).expect(201);

    type ListedLocation = { _id: string; progress?: { status: string; cultureStoryUnlocked: boolean }; cultureStory: { content?: string; locked?: boolean } };
    const statusOf = (body: ListedLocation[]) => body.find((location) => location._id === locationId)?.progress?.status;

    const mine = await request(app.getHttpServer()).get('/locations').set(auth(player)).expect(200);
    expect(statusOf(mine.body)).toBe('completed');
    expect(mine.body.filter((location: ListedLocation) => location.progress?.status === 'completed')).toHaveLength(1);

    // Progress is personal: another player and a guest do not inherit it.
    const others = await request(app.getHttpServer()).get('/locations').set(auth(other)).expect(200);
    expect(statusOf(others.body)).toBe('available');
    const guest = await request(app.getHttpServer()).get('/locations').expect(200);
    expect(guest.body.every((location: ListedLocation) => location.progress === undefined)).toBe(true);

    // Even the player who unlocked the story does not get its text from the list endpoint.
    for (const body of [mine.body, others.body, guest.body] as ListedLocation[][]) {
      expect(body.every((location) => location.cultureStory.content === undefined && location.cultureStory.locked === true)).toBe(true);
    }
  });

  it('wrong answer does not award XP and keeps the story locked', async () => {
    const player = await register('wrong@example.com');
    const wrongOption = firstCorrectOption === 'A' ? 'B' : 'A';

    const answer = await request(app.getHttpServer())
      .post(`/locations/${locationId}/challenge/answer`)
      .set(auth(player))
      .send({ questionOrder: firstQuestionOrder, selectedOption: wrongOption })
      .expect(201);
    expect(answer.body.isCorrect).toBe(false);
    expect(answer.body.hintText).toBeTruthy();

    await request(app.getHttpServer())
      .post(`/locations/${locationId}/complete`)
      .set(auth(player))
      .expect(400);

    const me = await request(app.getHttpServer()).get('/users/me').set(auth(player)).expect(200);
    expect(me.body.totalXp).toBe(0);

    const detail = await request(app.getHttpServer())
      .get(`/locations/${locationId}`)
      .set(auth(player))
      .expect(200);
    expect(detail.body.cultureStory).not.toHaveProperty('content');
    expect(detail.body.progress.cultureStoryUnlocked).toBe(false);
  });

  it('requires JWT for answer and completion writes', async () => {
    await request(app.getHttpServer())
      .post(`/locations/${locationId}/challenge/answer`)
      .send({ questionOrder: firstQuestionOrder, selectedOption: firstCorrectOption })
      .expect(401);
    await request(app.getHttpServer()).post(`/locations/${locationId}/complete`).expect(401);
  });

  it('does not award XP twice when complete is submitted twice', async () => {
    const player = await register('idempotent@example.com');
    await request(app.getHttpServer())
      .post(`/locations/${locationId}/challenge/answer`)
      .set(auth(player))
      .send({ questionOrder: firstQuestionOrder, selectedOption: firstCorrectOption })
      .expect(201);

    const first = await request(app.getHttpServer()).post(`/locations/${locationId}/complete`).set(auth(player)).expect(201);
    const second = await request(app.getHttpServer()).post(`/locations/${locationId}/complete`).set(auth(player)).expect(201);
    const me = await request(app.getHttpServer()).get('/users/me').set(auth(player)).expect(200);

    expect(first.body).toMatchObject({ completed: true, xpEarned: 50, totalXp: 50 });
    expect(second.body).toMatchObject({ completed: false, xpEarned: 0, totalXp: 50 });
    expect(me.body.totalXp).toBe(50);
  });

  it('one user cannot create or complete another user progress', async () => {
    const userA = await register('user-a@example.com');
    const userB = await register('user-b@example.com');

    await request(app.getHttpServer())
      .post(`/locations/${locationId}/challenge/answer`)
      .set(auth(userA))
      .send({ questionOrder: firstQuestionOrder, selectedOption: firstCorrectOption })
      .expect(201);
    await request(app.getHttpServer()).post(`/locations/${locationId}/complete`).set(auth(userA)).expect(201);

    const progressB = await request(app.getHttpServer()).get('/users/me/progress').set(auth(userB)).expect(200);
    const meB = await request(app.getHttpServer()).get('/users/me').set(auth(userB)).expect(200);
    expect(progressB.body).toHaveLength(0);
    expect(meB.body.totalXp).toBe(0);
  });

  it('unlocks the history badge only once its condition is met', async () => {
    const player = await register('badges@example.com');
    const locations = await request(app.getHttpServer()).get('/locations?category=history').expect(200);
    const locked = await request(app.getHttpServer()).get('/users/me/badges').set(auth(player)).expect(200);
    expect(locked.body.find((badge: { code: string }) => badge.code === 'history_hunter').unlocked).toBe(false);

    const ChallengeModel = connection.model('Challenge', ChallengeSchema);
    for (const location of locations.body) {
      const challenge = await ChallengeModel
        .findOne({ locationId: new Types.ObjectId(location._id) })
        .lean()
        .exec();
      expect(challenge).not.toBeNull();
      for (const question of challenge!.questions) {
        await request(app.getHttpServer())
          .post(`/locations/${location._id}/challenge/answer`)
          .set(auth(player))
          .send({ questionOrder: question.order, selectedOption: question.correctOption })
          .expect(201);
      }
      await request(app.getHttpServer()).post(`/locations/${location._id}/complete`).set(auth(player)).expect(201);
    }

    const unlocked = await request(app.getHttpServer()).get('/users/me/badges').set(auth(player)).expect(200);
    expect(unlocked.body.find((badge: { code: string }) => badge.code === 'history_hunter')).toMatchObject({
      unlocked: true,
    });
  });
  describe('finishing a journey', () => {
    async function completeLocations(player: UserSession, locationIds: string[]) {
      const ChallengeModel = connection.model('Challenge', ChallengeSchema);
      for (const id of locationIds) {
        const challenge = await ChallengeModel.findOne({ locationId: new Types.ObjectId(id) }).lean().exec();
        for (const question of challenge!.questions) {
          await request(app.getHttpServer())
            .post(`/locations/${id}/challenge/answer`)
            .set(auth(player))
            .send({ questionOrder: question.order, selectedOption: question.correctOption })
            .expect(201);
        }
        await request(app.getHttpServer()).post(`/locations/${id}/complete`).set(auth(player)).expect(201);
      }
    }

    async function allLocationIds() {
      const locations = await request(app.getHttpServer()).get('/locations').expect(200);
      return locations.body.map((location: { _id: string }) => location._id) as string[];
    }

    it('starts a journey only with exactly the required number of distinct locations', async () => {
      const player = await register('start@example.com');
      const ids = await allLocationIds();
      await request(app.getHttpServer()).post('/quests/start').send({ type: 'mini', locationIds: ids.slice(0, 3) }).expect(401);
      const start = (type: string, locationIds: string[]) =>
        request(app.getHttpServer()).post('/quests/start').set(auth(player)).send({ type, locationIds });

      await start('mini', ids.slice(0, 2)).expect(400);
      await start('mini', ids.slice(0, 4)).expect(400);
      await start('mini', [ids[0], ids[0], ids[1]]).expect(400);
      await start('full', ids.slice(0, 3)).expect(400);
      await start('explore', ids.slice(0, 3)).expect(400);
      await start('mini', [ids[0], ids[1], '507f1f77bcf86cd799439011']).expect(400);

      const started = await start('mini', ids.slice(0, 3)).expect(201);
      expect(started.body.journey).toMatchObject({ type: 'mini', locationIds: ids.slice(0, 3) });
      const current = await request(app.getHttpServer()).get('/quests/current').set(auth(player)).expect(200);
      expect(current.body.journey.locationIds).toEqual(ids.slice(0, 3));

      // Starting again replaces the unfinished journey.
      await start('full', ids).expect(201);
      const replaced = await request(app.getHttpServer()).get('/quests/current').set(auth(player)).expect(200);
      expect(replaced.body.journey).toMatchObject({ type: 'full' });
      expect(replaced.body.journey.locationIds).toHaveLength(5);
    });

    it('finishes a mini journey after just its 3 locations, without unlocking City Master', async () => {
      const player = await register('mini@example.com');
      const ids = await allLocationIds();
      const picked = ids.slice(0, 3);
      await request(app.getHttpServer()).post('/quests/start').set(auth(player)).send({ type: 'mini', locationIds: picked }).expect(201);

      await completeLocations(player, picked.slice(0, 2));
      await request(app.getHttpServer()).post('/quests/finish').set(auth(player)).expect(400);
      await completeLocations(player, picked.slice(2));

      const finished = await request(app.getHttpServer()).post('/quests/finish').set(auth(player)).expect(201);
      expect(finished.body).toEqual({ finished: true, type: 'mini', locationsCompleted: 3 });
      const current = await request(app.getHttpServer()).get('/quests/current').set(auth(player)).expect(200);
      expect(current.body.journey).toBeNull();
      const badges = await request(app.getHttpServer()).get('/users/me/badges').set(auth(player)).expect(200);
      expect(badges.body.find((badge: { code: string }) => badge.code === 'city_master').unlocked).toBe(false);
    });

    it('requires JWT and refuses to finish before every location is completed', async () => {
      await request(app.getHttpServer()).post('/quests/finish').expect(401);
      const player = await register('early@example.com');
      await completeLocations(player, [locationId]);
      await request(app.getHttpServer()).post('/quests/finish').set(auth(player)).expect(400);
    });

    it('records the journey, unlocks City Master, resets progress and keeps XP', async () => {
      const player = await register('finish@example.com');
      const locations = await request(app.getHttpServer()).get('/locations').expect(200);
      const ids = locations.body.map((location: { _id: string }) => location._id);
      await completeLocations(player, ids);
      const before = await request(app.getHttpServer()).get('/users/me').set(auth(player)).expect(200);

      const finished = await request(app.getHttpServer()).post('/quests/finish').set(auth(player)).expect(201);
      expect(finished.body).toEqual({ finished: true, type: 'full', locationsCompleted: ids.length });

      const progress = await request(app.getHttpServer()).get('/users/me/progress').set(auth(player)).expect(200);
      expect(progress.body).toHaveLength(0);
      const after = await request(app.getHttpServer()).get('/users/me').set(auth(player)).expect(200);
      expect(after.body.totalXp).toBe(before.body.totalXp);
      const badges = await request(app.getHttpServer()).get('/users/me/badges').set(auth(player)).expect(200);
      expect(badges.body.find((badge: { code: string }) => badge.code === 'city_master')).toMatchObject({ unlocked: true });

      // The new journey starts clean, and finishing again is refused.
      await request(app.getHttpServer()).post('/quests/finish').set(auth(player)).expect(400);
      const list = await request(app.getHttpServer()).get('/locations').set(auth(player)).expect(200);
      expect(list.body.every((location: { progress: { status: string } }) => location.progress.status === 'available')).toBe(true);
    });
  });
});
