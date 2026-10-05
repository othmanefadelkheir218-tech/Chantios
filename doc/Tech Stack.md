# ChantierOS — Tech Stack (Backend)

Focus: **backend first**. Frontend is decided later.

## 1. Core..

| Need | Technology |
| --- | --- |
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL (runs in Docker) |
| ORM | Prisma |
| Cache / queue storage | Redis (runs in Docker) |
| Containers | Docker + Docker Compose |
| Package manager | yarn |
| Tenant scoping | Prisma client extension + `nestjs-cls` |

## 2. Auth and security

| Need | Technology |
| --- | --- |
| Password hash | argon2 |
| Tokens | @nestjs/jwt + passport-jwt (access 15 min, refresh in httpOnly cookie, refresh token hashed in DB) |
| 2FA (super-admin) | otplib (TOTP) |
| Permissions (roles) | @casl/ability |
| HTTP security headers | helmet |
| CORS | built-in NestJS CORS |
| Rate limit | @nestjs/throttler |

### 4 auth types

1. Company users: email + password.
2. Super-admin: email + password + 2FA.
3. Mobile employees (`worker` role): **email + PIN**, PIN hashed with argon2id, account locks after 5 wrong tries. A PIN alone is not a credential. See `notes/technical/phase-02-auth-users.md`.
4. Client portal: random token, stored hashed, valid 90 days.

## 3. Features

| Need | Technology |
| --- | --- |
| Realtime (chat, notifications) | @nestjs/websockets + socket.io (Redis adapter) |
| Payments / subscriptions | stripe (official SDK, webhooks with raw body) |
| Background jobs | BullMQ (uses Redis) |
| Scheduled tasks | @nestjs/schedule (example: mark late invoices every night) |
| Email | Resend |
| File storage | ImageKit |
| PDF (quotes, invoices) | pdfmake |

## 4. Config, validation, quality

| Need | Technology |
| --- | --- |
| Env config | @nestjs/config (validate env at startup) |
| Validation | class-validator + class-transformer |
| Logging | nestjs-pino |
| Health check | @nestjs/terminus |
| API docs | @nestjs/swagger |
| Tests | Jest (+ supertest for e2e) |
| Lint / format | ESLint + Prettier |
| Git hooks | Husky |

## 4.1 Swagger (important)

- Package: `@nestjs/swagger`.
- URL: `/api/docs` (only in dev/staging, protected or off in production).
- Every controller uses `@ApiTags`, every DTO uses `@ApiProperty`, and protected routes use `@ApiBearerAuth`.
- We use the Swagger CLI plugin, so DTOs are documented automatically.
- Swagger is the contract for the frontend: it must always be up to date.

## 5. Docker plan

Docker Compose runs:

- `postgres` — the database (with a volume, so data is kept).
- `redis` — for BullMQ and Socket.io.
- `api` (later) — the NestJS app.

**Rule:** start Docker first (`docker compose up -d`), then run Prisma migrations and the API. The API connects to Postgres through `DATABASE_URL` in `.env`.

## 5.1 Decisions

- **Language**: the whole codebase is English — tables, columns, enums, routes, DTOs. See `notes/naming-conventions.md`.
- **Multi-tenancy**: every business table has `tenant_id NOT NULL`. Enforcement is a **Prisma client extension** that injects `tenant_id` from request-scoped storage (`nestjs-cls`) into every query. Postgres RLS is **not** used in v1; it can be added later as a second layer. See `notes/technical/build-order.md` § 1b.

## 5.2 Open decisions

- **Frontend**: not decided (focus is backend).

## 6. Related docs

- `Schema Proposal.md` — database schema
- `Scenarios and Explanation.md` — business flow
- `Dashboard Pages.md` — pages by role