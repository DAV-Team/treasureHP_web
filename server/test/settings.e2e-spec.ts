import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/users/schemas/user.schema.js';
import { startMemoryMongo, stopMemoryMongo } from './utils/memory-mongo.js';

describe('Site logo (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let playerToken: string;

  beforeAll(async () => { await startMemoryMongo(); });
  afterAll(async () => { await stopMemoryMongo(); });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    await app.get<Model<User>>(getModelToken(User.name)).deleteMany({});

    const admin = await request(app.getHttpServer()).post('/auth/register').send({ email: 'admin@example.com', password: 'SuperSecret123', name: 'Admin' }).expect(201);
    await app.get<Model<User>>(getModelToken(User.name)).updateOne({ email: 'admin@example.com' }, { role: 'admin' });
    adminToken = admin.body.accessToken;
    const player = await request(app.getHttpServer()).post('/auth/register').send({ email: 'player@example.com', password: 'SuperSecret123', name: 'Player' }).expect(201);
    playerToken = player.body.accessToken;
  });

  afterEach(async () => { await app.close(); });

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const http = () => request(app.getHttpServer());
  const logoUrl = 'https://cdn.example.com/culture-quest-logo.png';

  it('reports no logo until one is set', async () => {
    expect((await http().get('/settings').expect(200)).body).toEqual({ logoUrl: null });
  });

  it('requires an admin to change the logo', async () => {
    await http().patch('/admin/settings/logo').send({ logoUrl }).expect(401);
    await http().patch('/admin/settings/logo').set(auth(playerToken)).send({ logoUrl }).expect(403);
  });

  it('rejects a value that is not an http(s) URL', async () => {
    await http().patch('/admin/settings/logo').set(auth(adminToken)).send({ logoUrl: 'not-a-url' }).expect(400);
    await http().patch('/admin/settings/logo').set(auth(adminToken)).send({ logoUrl: 'ftp://example.com/logo.png' }).expect(400);
    await http().patch('/admin/settings/logo').set(auth(adminToken)).expect(400);
  });

  it('sets and clears the logo', async () => {
    const set = await http().patch('/admin/settings/logo').set(auth(adminToken)).send({ logoUrl }).expect(200);
    expect(set.body).toEqual({ logoUrl });
    expect((await http().get('/settings').expect(200)).body).toEqual({ logoUrl });

    const replaced = await http().patch('/admin/settings/logo').set(auth(adminToken)).send({ logoUrl: 'https://cdn.example.com/other.svg' }).expect(200);
    expect(replaced.body).toEqual({ logoUrl: 'https://cdn.example.com/other.svg' });

    // An empty string restores the default mark, matching how avatarUrl is cleared.
    const cleared = await http().patch('/admin/settings/logo').set(auth(adminToken)).send({ logoUrl: '' }).expect(200);
    expect(cleared.body).toEqual({ logoUrl: null });
    expect((await http().get('/settings').expect(200)).body).toEqual({ logoUrl: null });
  });
});
