import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './chat/gateways/redis-io.adapter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { connectDatabase } from './config/database.config';
import { ALLOWED_ORIGINS, env } from './config/env.config';
import { connectImageKit } from './config/imagekit.config';
import { getOrmStatus } from './config/prisma.config';
import { connectRedis } from './config/redis.config';
import { connectResend } from './config/resend.config';
import { printStatus } from './config/status';
import { connectStripe } from './config/stripe.config';
import { getSwaggerStatus, setupSwagger } from './config/swagger.config';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  // 1. Infrastructure: check the connections before creating the app.
  const [database, redis, stripe, imagekit, resend] = await Promise.all([
    connectDatabase(),
    connectRedis(),
    connectStripe(),
    connectImageKit(),
    connectResend(),
  ]);
  if (!database.ok) {
    printStatus([database, redis, stripe, imagekit, resend]);
    console.error('  The database is required. Run `yarn docker:up` first.\n');
    process.exit(1);
  }

  // 2. Nest application. Boot logs are hidden: only errors and warnings.
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'],
    rawBody: true, // Stripe webhooks need the raw body to check the signature
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api');

  // 3. Global configuration.
  // Swagger UI needs inline scripts, so the CSP is relaxed for scripts only.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'", "'unsafe-inline'"],
          'upgrade-insecure-requests': null,
        },
      },
    }),
  );
  app.use(cookieParser());
  app.enableCors({ origin: ALLOWED_ORIGINS, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove unknown fields
      forbidNonWhitelisted: true, // error if unknown fields are sent
      transform: true, // convert payloads to DTO classes
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  // 3b. WebSockets (chat): the Socket.io adapter with Redis behind it, so a
  // message sent through one API instance reaches a socket on another.
  const ioAdapter = new RedisIoAdapter(app);
  await ioAdapter.connectToRedis();
  app.useWebSocketAdapter(ioAdapter);

  // 4. API documentation.
  if (env.SWAGGER_ENABLED) setupSwagger(app);

  // 5. Start the server.
  await app.listen(env.PORT);
  console.log(
    `\n  [App] ChantierOS API (${env.NODE_ENV}) running on http://localhost:${env.PORT}/api`,
  );

  // 6. Startup status of every service.
  printStatus([
    database,
    await getOrmStatus(app.get(PrismaService)),
    redis,
    stripe,
    imagekit,
    resend,
    getSwaggerStatus(),
  ]);
}

void bootstrap();
