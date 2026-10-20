import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { Model } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { User } from '../src/users/schemas/user.schema.js';
import { startMemoryMongo, stopMemoryMongo } from './utils/memory-mongo.js';

describe('Site logo (e2e)', () => {
  let app: NestExpressApplication;
  let uploadDir: string;
  let adminToken: string;
  let playerToken: string;

  beforeAll(async () => {
    // Each run gets its own throwaway folder, so uploaded files never leak into the repo or other runs.
    uploadDir = mkdtempSync(join(tmpdir(), 'culture-quest-uploads-'));
    process.env.UPLOAD_DIR = uploadDir;
    await startMemoryMongo();
  });

  afterAll(async () => {
    await stopMemoryMongo();
    rmSync(uploadDir, { recursive: true, force: true });
    delete process.env.UPLOAD_DIR;
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    // Mirrors the static-assets wiring in main.ts, which this test never runs through.
    app.useStaticAssets(resolve(app.get(ConfigService).get<string>('UPLOAD_DIR', 'uploads')), { prefix: '/uploads/' });
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
  const png = () => Buffer.from('89504e470d0a1a0a', 'hex');

  it('reports no logo until one is set', async () => {
    const settings = await http().get('/settings').expect(200);
    expect(settings.body).toEqual({ logoUrl: null });
  });

  it('requires an admin to change the logo', async () => {
    await http().post('/admin/settings/logo').attach('logo', png(), 'logo.png').expect(401);
    await http().post('/admin/settings/logo').set(auth(playerToken)).attach('logo', png(), 'logo.png').expect(403);
    await http().delete('/admin/settings/logo').set(auth(playerToken)).expect(403);
  });

  it('rejects a missing file, the wrong type and an oversized file', async () => {
    await http().post('/admin/settings/logo').set(auth(adminToken)).expect(400);
    await http().post('/admin/settings/logo').set(auth(adminToken)).attach('logo', Buffer.from('not an image'), { filename: 'logo.txt', contentType: 'text/plain' }).expect(400);
    await http().post('/admin/settings/logo').set(auth(adminToken)).attach('logo', Buffer.alloc(2 * 1024 * 1024 + 1), { filename: 'logo.png', contentType: 'image/png' }).expect(413);
  });

  it('uploads, serves, replaces and clears the logo, cleaning up the old file each time', async () => {
    const uploaded = await http().post('/admin/settings/logo').set(auth(adminToken)).attach('logo', png(), { filename: 'logo.png', contentType: 'image/png' }).expect(201);
    const firstUrl: string = uploaded.body.logoUrl;
    expect(firstUrl).toMatch(/^\/uploads\/branding\/.+\.png$/);
    expect((await http().get('/settings').expect(200)).body).toEqual({ logoUrl: firstUrl });

    const served = await http().get(firstUrl).expect(200);
    expect(served.headers['content-type']).toContain('image/png');
    expect(existsSync(join(uploadDir, firstUrl.replace('/uploads/', '')))).toBe(true);

    const replaced = await http().post('/admin/settings/logo').set(auth(adminToken)).attach('logo', png(), { filename: 'logo2.webp', contentType: 'image/webp' }).expect(201);
    const secondUrl: string = replaced.body.logoUrl;
    expect(secondUrl).not.toBe(firstUrl);
    expect(existsSync(join(uploadDir, firstUrl.replace('/uploads/', '')))).toBe(false);
    expect(existsSync(join(uploadDir, secondUrl.replace('/uploads/', '')))).toBe(true);

    const cleared = await http().delete('/admin/settings/logo').set(auth(adminToken)).expect(200);
    expect(cleared.body).toEqual({ logoUrl: null });
    expect((await http().get('/settings').expect(200)).body).toEqual({ logoUrl: null });
    expect(existsSync(join(uploadDir, secondUrl.replace('/uploads/', '')))).toBe(false);
  });
});
