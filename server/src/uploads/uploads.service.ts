import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

interface StoredFile {
  buffer: Buffer;
  mimetype: string;
}

/**
 * Writes uploaded files to a local directory (`UPLOAD_DIR`, default `./uploads`) and serves them back
 * under `/uploads/...` (wired up in `main.ts`). Meant for a single-server deployment with a persistent
 * disk/volume, not for a multi-instance or serverless one.
 */
@Injectable()
export class UploadsService {
  private readonly rootDir: string;

  constructor(config: ConfigService) {
    this.rootDir = resolve(config.get<string>('UPLOAD_DIR', 'uploads'));
  }

  /** Saves a file under `subfolder` with a random name and returns its public path, e.g. `/uploads/branding/<id>.png`. */
  async save(file: StoredFile, subfolder: string): Promise<string> {
    const extension = EXTENSION_BY_MIME[file.mimetype] ?? '';
    const filename = `${randomUUID()}${extension}`;
    const folder = join(this.rootDir, subfolder);
    await mkdir(folder, { recursive: true });
    await writeFile(join(folder, filename), file.buffer);
    return `/uploads/${subfolder}/${filename}`;
  }

  /** Deletes a file previously returned by `save`. Silently ignores anything that isn't one of our own uploads. */
  async remove(publicPath: string | undefined | null): Promise<void> {
    if (!publicPath?.startsWith('/uploads/')) return;
    const target = resolve(this.rootDir, `.${publicPath.slice('/uploads'.length)}`);
    // Guards against a tampered-with path ever deleting something outside the upload directory.
    if (target !== this.rootDir && !target.startsWith(`${this.rootDir}/`)) return;
    await unlink(target).catch(() => undefined);
  }
}
