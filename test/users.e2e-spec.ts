import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/** Needs the database: run `yarn docker:up` first. */
describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const phone = '+212600000099';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { phone } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { phone } });
    await app.close();
  });

  it('GET /api/health', () =>
    request(app.getHttpServer() as App)
      .get('/api/health')
      .expect(200));

  it('rejects an invalid body', () =>
    request(app.getHttpServer() as App)
      .post('/api/users')
      .send({ name: '', lastName: 'B', phone: 'abc' })
      .expect(400));

  it('creates, reads, updates and deletes a user', async () => {
    const http = app.getHttpServer() as App;
    const created = await request(http)
      .post('/api/users')
      .send({ name: 'Test', lastName: 'User', phone })
      .expect(201);
    const id = (created.body as { id: string }).id;

    await request(http)
      .post('/api/users')
      .send({ name: 'Other', lastName: 'User', phone })
      .expect(409);
    await request(http).get(`/api/users/${id}`).expect(200);
    await request(http)
      .patch(`/api/users/${id}`)
      .send({ name: 'Changed' })
      .expect(200)
      .expect((res) =>
        expect((res.body as { name: string }).name).toBe('Changed'),
      );
    await request(http).delete(`/api/users/${id}`).expect(204);
    await request(http).get(`/api/users/${id}`).expect(404);
  });
});
