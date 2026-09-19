import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { UserBadge } from '../src/badges/schemas/user-badge.schema.js';
import { UserProgress } from '../src/progress/schemas/user-progress.schema.js';
import { User } from '../src/users/schemas/user.schema.js';
import { startMemoryMongo, stopMemoryMongo } from './utils/memory-mongo.js';

describe('Profile & user management (e2e)', () => {
  let app: INestApplication;
  let users: Model<User>;

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
    users = app.get<Model<User>>(getModelToken(User.name));
    await users.deleteMany({});
  });

  afterEach(async () => {
    await app.close();
  });

  async function register(email: string, role: 'player' | 'admin' = 'player') {
    const password = 'SuperSecret123';
    const res = await request(app.getHttpServer()).post('/auth/register').send({ email, password, name: 'Người chơi' }).expect(201);
    // The JWT strategy loads the user on every request, so promoting after sign-up takes effect immediately.
    if (role === 'admin') await users.updateOne({ email }, { role });
    return { token: res.body.accessToken as string, id: res.body.user.id as string, password, email };
  }

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('PATCH /users/me', () => {
    it('updates name and avatar, and an empty avatar clears it', async () => {
      const { token } = await register('a@example.com');
      const updated = await request(app.getHttpServer()).patch('/users/me').set(auth(token)).send({ name: '  Mai Anh  ', avatarUrl: 'https://cdn.example.com/a.png' }).expect(200);
      expect(updated.body).toMatchObject({ name: 'Mai Anh', avatarUrl: 'https://cdn.example.com/a.png' });
      expect(updated.body).not.toHaveProperty('passwordHash');

      const cleared = await request(app.getHttpServer()).patch('/users/me').set(auth(token)).send({ avatarUrl: '' }).expect(200);
      expect(cleared.body.avatarUrl).toBeUndefined();
    });

    it('cannot be used to escalate privileges or change protected fields', async () => {
      const { token, id } = await register('b@example.com');
      for (const body of [{ role: 'admin' }, { totalXp: 9999 }, { email: 'evil@example.com' }]) {
        await request(app.getHttpServer()).patch('/users/me').set(auth(token)).send(body).expect(400);
      }
      const stored = await users.findById(id).exec();
      expect(stored).toMatchObject({ role: 'player', totalXp: 0, email: 'b@example.com' });
    });

    it('rejects unsafe avatar URLs and too-short names, and requires a token', async () => {
      const { token } = await register('c@example.com');
      await request(app.getHttpServer()).patch('/users/me').set(auth(token)).send({ avatarUrl: 'javascript:alert(1)' }).expect(400);
      await request(app.getHttpServer()).patch('/users/me').set(auth(token)).send({ name: 'x' }).expect(400);
      await request(app.getHttpServer()).patch('/users/me').send({ name: 'Không token' }).expect(401);
    });
  });

  describe('POST /users/me/password', () => {
    it('changes the password: old one stops working, new one logs in', async () => {
      const { token, email, password } = await register('d@example.com');
      await request(app.getHttpServer()).post('/users/me/password').set(auth(token)).send({ currentPassword: password, newPassword: 'BrandNewSecret456' }).expect(204);
      await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(401);
      await request(app.getHttpServer()).post('/auth/login').send({ email, password: 'BrandNewSecret456' }).expect(200);
    });

    it('rejects a wrong current password, an unchanged password and a short one', async () => {
      const { token, password } = await register('e@example.com');
      const change = (body: object) => request(app.getHttpServer()).post('/users/me/password').set(auth(token)).send(body);
      await change({ currentPassword: 'not-the-password', newPassword: 'BrandNewSecret456' }).expect(400);
      await change({ currentPassword: password, newPassword: password }).expect(400);
      await change({ currentPassword: password, newPassword: 'short' }).expect(400);
      await request(app.getHttpServer()).post('/users/me/password').send({ currentPassword: password, newPassword: 'BrandNewSecret456' }).expect(401);
    });
  });

  describe('admin user management', () => {
    it('forbids players from editing or deleting users', async () => {
      const player = await register('p@example.com');
      const other = await register('q@example.com');
      await request(app.getHttpServer()).patch(`/admin/users/${other.id}`).set(auth(player.token)).send({ role: 'admin' }).expect(403);
      await request(app.getHttpServer()).delete(`/admin/users/${other.id}`).set(auth(player.token)).expect(403);
      await request(app.getHttpServer()).delete(`/admin/users/${other.id}`).expect(401);
    });

    it('lets an admin rename a user and change their role', async () => {
      const admin = await register('admin@example.com', 'admin');
      const player = await register('p2@example.com');
      const res = await request(app.getHttpServer()).patch(`/admin/users/${player.id}`).set(auth(admin.token)).send({ name: 'Tên mới', role: 'admin' }).expect(200);
      expect(res.body).toMatchObject({ name: 'Tên mới', role: 'admin' });
      expect(res.body).not.toHaveProperty('passwordHash');
      await request(app.getHttpServer()).patch(`/admin/users/${player.id}`).set(auth(admin.token)).send({ role: 'superuser' }).expect(400);
      await request(app.getHttpServer()).patch(`/admin/users/${player.id}`).set(auth(admin.token)).send({ email: 'x@example.com' }).expect(400);
    });

    it('stops admins from demoting or deleting themselves', async () => {
      const admin = await register('solo@example.com', 'admin');
      await request(app.getHttpServer()).patch(`/admin/users/${admin.id}`).set(auth(admin.token)).send({ role: 'player' }).expect(403);
      await request(app.getHttpServer()).delete(`/admin/users/${admin.id}`).set(auth(admin.token)).expect(403);
      // Renaming yourself, or re-sending your current role, is still fine.
      await request(app.getHttpServer()).patch(`/admin/users/${admin.id}`).set(auth(admin.token)).send({ name: 'Quản trị', role: 'admin' }).expect(200);
    });

    it('deletes a user together with their progress and badges, and invalidates their token', async () => {
      const admin = await register('boss@example.com', 'admin');
      const player = await register('gone@example.com');
      const userId = new Types.ObjectId(player.id);
      await app.get<Model<UserProgress>>(getModelToken(UserProgress.name)).create({ userId, locationId: new Types.ObjectId(), status: 'completed', xpEarned: 50 });
      await app.get<Model<UserBadge>>(getModelToken(UserBadge.name)).create({ userId, badgeId: new Types.ObjectId() });

      await request(app.getHttpServer()).delete(`/admin/users/${player.id}`).set(auth(admin.token)).expect(200);

      expect(await users.countDocuments({ _id: userId })).toBe(0);
      expect(await app.get<Model<UserProgress>>(getModelToken(UserProgress.name)).countDocuments({ userId })).toBe(0);
      expect(await app.get<Model<UserBadge>>(getModelToken(UserBadge.name)).countDocuments({ userId })).toBe(0);
      await request(app.getHttpServer()).get('/users/me').set(auth(player.token)).expect(401);
    });

    it('returns 404 for unknown users and 400 for malformed ids', async () => {
      const admin = await register('root@example.com', 'admin');
      await request(app.getHttpServer()).patch(`/admin/users/${new Types.ObjectId()}`).set(auth(admin.token)).send({ name: 'Ai đó' }).expect(404);
      await request(app.getHttpServer()).delete(`/admin/users/${new Types.ObjectId()}`).set(auth(admin.token)).expect(404);
      await request(app.getHttpServer()).delete('/admin/users/not-an-id').set(auth(admin.token)).expect(400);
    });
  });
});
