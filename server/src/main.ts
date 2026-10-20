import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { resolve } from 'path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Uploaded files (e.g. the site logo) are served back from here. The dev client runs on a different
  // origin than this API, so the default helmet Cross-Origin-Resource-Policy would otherwise block it
  // from loading these images directly.
  const uploadDir = resolve(app.get(ConfigService).get<string>('UPLOAD_DIR', 'uploads'));
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads/',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  });

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
