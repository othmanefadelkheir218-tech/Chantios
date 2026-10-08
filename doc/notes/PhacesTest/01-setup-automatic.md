# Phase 01 — Setup & Automatic Tests

> Read [00-START-HERE.md](00-START-HERE.md) first.

## Goal

Bring the empty database to a usable start (reference data + super-admin only), start the stack, and run the automatic test suites.

## Before you start

- The database is empty. The tables, the 3 views and the migration history are kept.
- No server is running. Start it **after** the seed.

## Scenarios

| ID | Do | Expected | Result |
|---|---|---|---|
| SET-01 | `docker compose up -d` | `chantieros_postgres` and `chantieros_redis` are `healthy` | PASS |
| SET-02 | Confirm the database is empty: count rows of every table except `_prisma_migrations` | every table `0` | PASS |
| SET-03 | `yarn seed:data` | 7 `roles` (ids 1–7), 3 `cost_types` (`material`, `subcontractor`, `labor`, `tenant_id` NULL), 10 `categories` (`tenant_id` NULL) | PASS |
| SET-04 | `yarn seed:admin` | one `admin_users` row `admin@chantieros.local`, role `super_admin`, `password_hash` starts `$argon2id` | PASS |
| SET-05 | Check no plan, tenant or user exists | `plans`, `tenants`, `users` all `0` — `seed:tenants` was **not** run | PASS |
| SET-06 | `yarn start:dev` | log shows `ChantierOS API (development) running`, database and Redis green, listening on `5300` | PASS — API answers on 5300 (your terminal log not read) |
| SET-07 | Only one server instance | exactly one process listens on `5300`, no second `nest start --watch` (a second one steals queue jobs, emails included) | PASS — one watcher (58625) + one app (58756) |
| SET-08 | `GET /api/docs` | `200`, Swagger lists every module | PASS — 166 paths, 38 tags |
| SET-09 | `stripe listen ...` (see 00 § 6) running | prints `Ready!`; its `whsec_` equals `STRIPE_WEBHOOK_SECRET` in `.env` | PASS |
| SET-10 | `node telegram-bot.js` running, write a test message to `push.json` | `push.json` resets to `{}`, the message arrives on Telegram | PASS |
| AUTO-01 | `yarn test` | all suites green (last known: 713 tests, 49 suites — a higher count is fine) | PASS — 713 tests, 49 suites |
| AUTO-02 | `npx jest --config test/jest-e2e.json --forceExit` | 11 passed, prints `Isolation checked on 44 tables` (more if tables were added) | FAIL — 10/11; no leak, coverage check needs seed data (see RESULTS) |
| AUTO-03 | `yarn lint` | `0 errors` (4 known warnings) | PASS — 0 errors, 4 warnings |
| AUTO-04 | `yarn build` | no output, exit 0 | PASS — compiled with tsc into the scratchpad, not yarn build (it deletes the running server dist/) |
| AUTO-05 | After AUTO-02, the e2e test removed its own data | no tenant named `Isolation Test%` left | PASS |

## Notes

- `yarn seed:reset` is **not** used: it fails on Prisma 7 (`--skip-seed` no longer exists). Logged in RESULTS.md as a problem found.
- AUTO-02 runs against the real database. It creates and deletes `Isolation Test A/B`; if it is killed halfway, SET-02 will no longer hold — delete them by name.
