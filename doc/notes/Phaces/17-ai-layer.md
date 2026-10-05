# Step 17 — AI Layer  *(phase 17)* — **v2. DO NOT BUILD**

> This file exists so nobody has to ask whether it was forgotten. It was not. It is deliberately out of v1.

## Status

**Not in v1.** Its tables are **not** created in the first migration:

- `hitl_queue` — human-in-the-loop approvals
- `connectors` — external integrations per tenant
- `token_recharges` — AI token top-up packs

Do not add them to `schema.prisma`. Do not add an AI billing dimension. There is no token balance on `tenants`.

## What this means for v1

| Thing | v1 answer |
|---|---|
| Plan dimensions | **6**, none of them AI: `max_workers`, `max_managers`, `max_clients`, `max_subcontractors`, `storage_gb`, `retention_days` |
| Token balance on `tenants` | does not exist |
| `token_recharges` | not created |
| Client connection channels | **email only.** Telegram and WhatsApp are v2 |

If you find a reference to AI tokens, a token balance or a recharge pack anywhere in the docs or the code, it is a leftover from an older draft. Delete it.

## v1 is finished at step 16

When step 16 passes its acceptance list, the v1 backend is complete. The next decision is the **frontend**, which is still open — see `doc/Tech Stack.md` § 5.2.

## When v2 starts

Reopen this file and expand it into a real step, following the structure in [00-START-HERE.md](00-START-HERE.md) § 5. The old sketch lives in [technical/phase-17-ai-layer.md](../technical/phase-17-ai-layer.md) — treat it as notes, not decisions. Nothing in it has been reviewed to the standard the rest of these docs now meet.

## Notes to read

- [subscription-plans.md](../subscription-plans.md) — "AI is not part of v1 at all"
- [technical/build-order.md](../technical/build-order.md) — the AI layer exclusion
- [technical/phase-17-ai-layer.md](../technical/phase-17-ai-layer.md) — the unreviewed sketch
