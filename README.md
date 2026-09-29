# ChantierOS API

NestJS 11 + Prisma 7 (driver adapter `pg`) + PostgreSQL + Redis. Package manager: **yarn**.

## Start

```bash
cp .env.example .env      # first time only
yarn install
yarn docker:up            # PostgreSQL (localhost:5440) + Redis (localhost:6390)
yarn prisma:migrate       # create tables
yarn start:dev            # API on http://localhost:5300/api
```

- Swagger: http://localhost:5300/api/docs
- OpenAPI JSON: http://localhost:5300/api/docs-json
- Health: http://localhost:5300/api/health

## Scripts

| Script | What it does |
|---|---|
| `yarn start:dev` | Run the API with watch mode |
| `yarn build` | Build to `dist/` |
| `yarn lint` / `yarn lint:check` | ESLint (with / without fix) |
| `yarn test` | Unit tests (Jest) |
| `yarn test:e2e` | E2E tests (needs Docker up) |
| `yarn prisma:generate` | Generate the Prisma client |
| `yarn prisma:migrate` | Create and apply a migration (dev) |
| `yarn prisma:deploy` | Apply migrations (production) |
| `yarn prisma:studio` | Open Prisma Studio on http://localhost:51212 |
| `yarn docker:up` / `docker:down` | Start / stop PostgreSQL and Redis |

## Structure

```
prisma/schema.prisma   Database schema (no url: it is in prisma.config.ts)
prisma.config.ts       Prisma CLI config (DATABASE_URL, migrations path)
src/main.ts            Bootstrap only: infra -> app -> global config -> Swagger -> listen -> status
src/config/            One file per service: env (Joi), database, redis, prisma, swagger, logger, status
src/common/filters/    Global exception filters
src/prisma/            PrismaService (global)
src/health/            Health check (Terminus)
src/users/             Test module: controller -> service -> handlers -> repository
  decorators/ dto/ entities/ handlers/ helpers/ repositories/
```

Rules: controllers = HTTP, service = orchestration, handlers = business logic (with logs),
repositories = the only place that uses Prisma. Details in `.instruction/`.

## Startup status

Every start prints the connection status of each service (Database, ORM, Redis, Swagger).
To show a new service: add `xxx.config.ts` returning a `ServiceStatus`, then add it to the list in `main.ts`.
The database is required (the app stops without it). Redis is only reported for now.

## Installed but not used yet

Stripe, Resend, ImageKit, Socket.io (ignored for now), BullMQ, JWT / Passport, argon2, otplib, CASL, pdfmake.
Set `PRISMA_LOG=query` in `.env` to see SQL queries in the console.
Ports 5440 / 6390 are used because 5432 / 6379 were busy on the dev PC.
