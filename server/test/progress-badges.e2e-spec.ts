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
});
