import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { startMemoryMongo, stopMemoryMongo } from './utils/memory-mongo.js';
import { User } from '../src/users/schemas/user.schema.js';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

describe('Auth & Users (e2e)', () => {
  let app: INestApplication;

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

    const userModel = app.get<Model<User>>(getModelToken(User.name));
    await userModel.deleteMany({});
  });

  afterEach(async () => {
    await app.close();
  });

  const credentials = { email: 'traveler@example.com', password: 'SuperSecret123', name: 'Mai Phương Anh' };

  it('register -> login -> GET /users/me with token succeeds and never leaks passwordHash', async () => {
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(credentials)
      .expect(201);

    expect(registerRes.body.accessToken).toBeDefined();
    expect(registerRes.body.user).not.toHaveProperty('passwordHash');
    expect(registerRes.body.user.email).toBe(credentials.email.toLowerCase());

    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: credentials.email, password: credentials.password })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.user).not.toHaveProperty('passwordHash');

    const token = loginRes.body.accessToken;
    const meRes = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body).not.toHaveProperty('passwordHash');
    expect(meRes.body.email).toBe(credentials.email.toLowerCase());
    expect(meRes.body.level).toBe(1);
    expect(meRes.body.totalXp).toBe(0);
  });

  it('GET /users/me without token returns 401', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('GET /users/me with an invalid/malformed token returns 401', async () => {
    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('password is stored hashed in the database, never as plaintext', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    const userModel = app.get<Model<User>>(getModelToken(User.name));
    const stored = await userModel.findOne({ email: credentials.email.toLowerCase() }).exec();

    expect(stored).not.toBeNull();
    expect(stored!.passwordHash).not.toBe(credentials.password);
    const matches = await bcrypt.compare(credentials.password, stored!.passwordHash);
    expect(matches).toBe(true);
  });

  it('rejects duplicate registration for the same email', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(409);
  });

  it('rejects login with wrong password', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: credentials.email, password: 'wrong-password' })
      .expect(401);
  });

  it('throttles /auth/login after exceeding the request limit', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    const attempt = () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: credentials.email, password: 'wrong-password' });

    const results = [];
    for (let i = 0; i < 6; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      results.push(await attempt());
    }

    const statuses = results.map((res) => res.status);
    expect(statuses).toContain(429);
  }, 20000);
});
