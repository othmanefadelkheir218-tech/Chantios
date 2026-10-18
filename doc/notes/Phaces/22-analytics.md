# Step 22 — Tenant analytics page

> Needs step 18 (dashboard: the same "one call, a block per permission" pattern).
> Backend **and** frontend. **Built 2026-10-17.** Rule: [analytics.md](../analytics.md).

## 1. Goal

The tenant admin and the accountant open `/analytics` and see how the company is doing over a period: 4 cards and 7 charts.

## 2. Decide first

**Decided 2026-10-17 (owner).** Nothing left open.

| # | Question | Answer |
|---|---|---|
| Q1 | Which blocks? | ✅ The 7 blocks of [analytics.md](../analytics.md) § The blocks |
| Q2 | Who gets it by default? | ✅ `admin` + `accountant` |
| Q3 | Plan limit? | ✅ None, every plan |
| Q4 | Analytics sees all, or follows each module's right? | ✅ Follows each module's right (option B) |

## 3. Tables

No table. One migration: `ALTER TYPE permission_module ADD VALUE 'analytics'`.

## 4. Where the code lives

**Backend**

`src/analytics/` is the product-events module (another domain) — not touched.

```
src/auth/helpers/permission.helper.ts            + analytics in the default matrix, + loadPermissions() (shared with the dashboard)
src/company-analytics/company-analytics.controller.ts    GET /analytics/overview
src/company-analytics/company-analytics.service.ts
src/company-analytics/handlers/get-company-analytics.handler.ts  one builder per block, a block only if its module is visible
src/company-analytics/helpers/analytics-period.helper.ts the period (default, checks, month list)
src/company-analytics/helpers/analytics-blocks.helper.ts month filling, margin average, best/worst
src/company-analytics/dto/company-analytics-query.dto.ts  from, to
src/company-analytics/decorators/company-analytics.swagger.ts
```

New methods in the owning modules (service → repository): invoices (invoiced per day, top clients, aging), payments (collected per day), quotes (sent / accepted / refused dates), margins (open projects with a budget), time entries (hours per day, per project), purchase invoices (amount per day), clients (names by ids).

**Frontend** (`ChanitOs_client/my-app`)

```
types/company-analytics.ts        (types/analytics.ts = the admin events page, not touched)
lib/api/endpoints/company-analytics.api.ts
hooks/use-company-analytics.ts
app/[locale]/(tenant)/analytics/page.tsx + AnalyticsClient.tsx + _components/
```

Charts are plain HTML/CSS bars (no chart library), with the design tokens.

## 5. Routes

| Method | Path | Guard | Module |
|---|---|---|---|
| GET | `/api/analytics/overview?from=&to=` | `@TenantAuth()` | `analytics` (view) |

## 6. Tasks

- [x] Note + permission matrix + schema enum
- [x] Migration `20261017120000_permission_module_analytics` + default matrix
- [x] Source module methods
- [x] `company-analytics` module + tests (`get-company-analytics.handler.spec.ts`)
- [x] Frontend page + menu app "Analyses" + texts + role label

## 7. Acceptance

- `admin` and `accountant` get `200`; `manager` gets `403`.
- A role without `margins` view gets no `margins` key.
- Every month of the period is in each `by_month`, empty months are `0`.
- `from` after `to`, or more than 24 months → `400`.
