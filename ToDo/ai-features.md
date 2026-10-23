# To do — AI in ChantierOS

Ideas kept for later. Not built. Decide before building. When decided, the rules move to `doc/notes/ai.md` and step 17 becomes a real build plan.

**Rule for this list: no AI on something the app already does (or can do) with normal code.** AI is only for reading messy input (emails, PDFs, photos, voice) and writing text.

## Main rules

- **The AI proposes, a human approves.** The AI never sends an email, creates an invoice or touches money alone.
- On approve, the action goes through the **same services and guards** as a normal user.
- The AI only sees the **current company's data** (`tenant_id` from the JWT, like everywhere).
- An email from outside can hold hidden instructions. The AI never acts directly from email content.
- AI lives **inside the pages** (email, quote, invoice…), not only on one "Agents" page.

## Provider

- One AI layer in the backend. The provider can change per task (config, not a rewrite).
- Needs **text + images + PDF** and an **EU data agreement** (GDPR). Options: Claude, Mistral.
- DeepSeek: dev tests only. No images/PDF, data stored in China.

## Credits

- **Credit ≠ token.** A token is what the provider charges us; a credit is what the customer pays. A credit is fixed per action.
- 200 credits a month in the plan. Packs: Small 50 = 9 € HT, Medium 150 = 24 € HT, Large 500 = 69 € HT.
- When credits run out, paid AI actions stop. The rest of the app keeps working. No automatic extra charge.
- Automatic small AI is **free** (email summary / tag), so spam doesn't eat credits.
- The button shows the cost before the click: "Générer le devis · 3 crédits". Warning at 20% left.
- No credit lost when the AI fails.
- Proposal — credits per action:

| Action | Credits |
|---|---|
| Email summary / tag | 0 |
| Improve / translate selected text | 0 or 1 |
| Reply draft | 1 |
| Read a supplier invoice (PDF/photo) | 2 |
| Site report from photos | 2–3 |
| Structured quote | 3 |

### Tracking (internal)

- Each AI call is logged: company, user, action, tokens in/out, real cost in €, credits charged.
- Gives the real cost and margin per action type. Change the credits or the model if an action costs too much.
- A **maximum of tokens** per action (e.g. PDF max 20 pages, last 30 messages of a thread).

## A. Already built without AI — no AI here

| Idea | What the app already does |
|---|---|
| Invoice reminders | Late invoice detected (`due_date` passed, `balance_due > 0`), manual reminder button, reminder count, fixed email (`invoices/send-reminder.handler.ts`) |
| Payment risk / late payers | Unpaid aging buckets in analytics (`company-analytics` → `agingBlock`) + "Invoice late" alert |
| Order when stock is low | "Stock below minimum" + "Stock reservation unmet" alerts (`materials/find-low-stock.handler.ts`) |
| Materials used on site | Report pre-fills materials from the service recipe (`reports/prefill-materials.handler.ts`) |
| Why a project loses money | Margin per project + breakdown by cost type (`margins/margin-breakdown.handler.ts`) + 80% / 95% alerts |
| Project delays | "Progress stalled" (7 days) and "Missing site report" (3 days) alerts |
| Monthly numbers | Analytics: totals by month, quotes, margins, unpaid (`company-analytics`) |
| Too many hours | "Abnormal hours" alert (> 12 h a day) |
| Client sees progress | Portal: progress %, documents, quotes, invoices |

Only possible AI extra on these: turn the numbers into a few plain sentences. **Low value — not in the first versions.**

## B. Features to add that don't use AI

### Reporting mensuel — decided by the owner (2026-10-21)

Today: the analytics page shows the monthly numbers. Missing: a ready monthly report.

1. **Email + PDF.** Each report is also **saved in the database**, with its own page where the tenant admin (and users with the permission) can open any past report at any time — no need to search the mailbox.
2. **Who receives it:** by default the **main admin** and the **managers**. Other users by permission.
3. **Numbers:** everything in analytics.
4. **Turn off:** yes, from the settings.
5. **AI summary at the top** (2–3 sentences, e.g. "Good month: +12% invoiced, but 3 invoices are late") — **do later.** Free or 1 credit, to decide then.

Already there to reuse: analytics numbers (`company-analytics`), per-company crons (`crons/tenant-runner.service.ts`), email layout (`email/templates/email-layout.ts`), PDF (`documents`).

### Trésorerie (cash forecast) — decided by the owner (2026-10-21)

Today: nothing. The app has the data (unpaid client invoices, unpaid supplier bills, each with a due date) but shows them apart. New feature: put them together, week by week. Normal code, no AI. No new table for the numbers.

1. **How far ahead:** 8 weeks by default. The user can switch to 4 / 8 / 12 weeks.
2. **Late items:** a separate **"En retard"** line at the top (late client invoices and late supplier bills). They are never put into a future week.
3. **Bank balance:** the admin types the balance of today → the table shows the money left each week. No balance typed → only "in − out".
   - The feature must be **turned on** by the admin (settings).
   - A **reminder** asks the admin to update the balance. How often (week / month) — **to decide**.
4. **Who sees it:** its own permission. Main admin by default, others only if the admin allows it.

Already there to reuse: unpaid invoices (`invoices`, analytics aging), purchase bills due (`purchase-invoices/due-soon.handler.ts`). Place: a block on the analytics page or its own page — to decide.

### Claude's suggestions — not decided

- **Supplier price compare** (part of "Agent Achats" in the mockup) — same material, price per supplier from past purchase invoices.
- **Planning conflicts** — the same worker on two tasks at the same time.
- **Tasks from an accepted quote** — one task per quote line (today accepting a quote only starts the project).

## C. Real AI — this is the list

### 1. Email with clients — first version
- Automatic summary, tag (quote request, complaint, payment, planning, spam…) and priority
- Suggested project / client link (fills "À lier")
- Reply drafts + 3 short suggested replies, tone choice
- Selected-text menu
  - received email: Expliquer · Traduire · Créer une tâche · Ajouter au devis
  - my reply: Améliorer · Plus court · Plus poli · Corriger · Traduire FR ↔ NL
- Read attachments (PDF, images)
- Detect actions (quote request → draft quote, date → task)
- Side panel "Assistant": questions about this thread

### 2. Quotes (Devis Agent) — first version
- Quote from a description, using the catalogue
- Quote from an email, a photo or a client plan
- Check a quote: missing lines for this kind of job (prices and margin are already checked by code)

### 3. Supplier invoices (Agent Achats) — first version
- Read a supplier invoice (PDF/photo) → pre-filled purchase invoice

### 4. Site reports (Rapport Chantier)
- Report from photos + worker voice note
- Detect problems in photos (damage, safety)

### 5. Tenders (Appels d'offres)
- Read a tender document → summary, requirements, deadline
- First draft of the answer

### 6. After-sales (Agent SAV)
- Sort client complaints, propose a reply and a task

### 7. Chat and notes
- Summary of a long team chat
- Notes: clean up, turn into tasks

### 8. Client portal
- Answer simple client questions (with human approval)

### 9. General
- Global "Assistant" side panel: ask questions about the company data (reads the existing numbers, does not compute new ones)
- "À valider" page: everything the AI proposed, waiting for approval (`hitl_queue`)
- Credits and usage page

## UI — first mockup feedback

- Don't paste the email: the app already receives emails, so the AI works on them directly.
- Keep the "Agents IA" page for: "À valider" list, agents on/off, credit balance and usage.
- The subtitle says "4 agents hero" but 9 are shown.
- "Relance Impayés", "Agent Trésorerie" and "Reporting mensuel" are not AI agents — see A and B.

## Decide first

- Which provider (text + images + PDF, EU)?
- Final credit cost per action — after measuring the real cost on ~50 real actions.
- Packs expiry: never, or 12 months?
- Which roles can use AI, and which roles approve its actions?
- First version: email, quotes, supplier invoices — confirm.
- Section B: when to build "Reporting mensuel" and "Trésorerie"? Keep or drop Claude's suggestions?
- Trésorerie: bank balance reminder every week or every month? Analytics block or own page?
