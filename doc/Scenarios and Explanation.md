# ChantierOS — Business Scenario & Q&A (En

## Scenario: A small renovation company uses the app on one real project — without AI, just the core features.

**Clients** — The company gets a call from Mr. Dubois, who wants his bathroom renovated. The office registers a new client card: name, phone, email, address, type = "particulier" (individual, not a company).

**Projects/sites (Projects/sites)** — From this client, a project is created: "Bathroom renovation — Dubois," with the site address and status = `prospect` (not confirmed yet).

**Quote (Quote)** — Someone visits the site, estimates the work, and builds a quote inside the project: demolition €800, plumbing €2,500, tiling €3,200, painting €900, electricity €600 → total €8,000 excl. tax + VAT. The quote is sent to Mr. Dubois, and he accepts it. The quote status becomes `accepté`, and the project automatically switches from `prospect` to `en cours` (in progress).

**Planning Gantt (Scheduling)** — Once the project is confirmed, the team schedules it on a timeline: Week 1 = demolition + plumbing rough-in, Week 2 = tiling, Week 3 = painting and finishing. Each task has a start date, an end date, and an assigned person.

**Subcontracting (Subcontracting)** — The company doesn't have its own plumber, so it hires an external plumber (subcontractor) for the plumbing task. The system tracks this subcontractor's invoice separately — meaning what the company owes them is not mixed with what the client owes the company.

**Stocks (Inventory)** — Materials needed for the site (30 tiles, 2 boxes of pipes, 15L of paint) are drawn from the stock module. If tiles start running low across all active projects, the stock screen shows a "low/out of stock" alert before it blocks the work.

**Time Entries (Time tracking)** — Every day, the mason and the painter log their hours on this exact project: mason 8 hours on Monday, painter 6 hours on Thursday... This data (work time) is tied to one specific project.

**Margins (Profit margin)** — The system now compares: the budget was €8,000. The real cost so far = materials purchased (stock) + subcontractor invoice (plumber) + labor hours × hourly cost. If the real cost reaches €7,200 while only 80% of the work is done, the margin module flags that the project is losing profitability — even before the work is finished.

**Invoices (Invoices)** — After the demolition and plumbing are done, the company issues a 50% deposit invoice: €4,000 excl. tax. Mr. Dubois pays it — the invoice status changes from `sent` to `paid`. At the end of the project, a second invoice for the remaining 50% is issued. If payment is late, the invoice shows status `overdue`, and the system counts how many reminders (`reminders`) have been sent.

**Portal client (Client portal)** — Mr. Dubois receives a single link (no login or password required, valid for 90 days). When he opens it, he sees: the quote he accepted, the project's current progress, and both invoices with their payment status — in real time, without having to call the office and ask "where are we at?"

**In short, this is the full loop:** client → project → quote → scheduling → execution (materials + subcontractor + labor) → real cost vs. budget → invoices → client visibility. Every feature exists to feed the next stage — the margin calculation only makes sense because the quote, subcontractor, stock, and time-tracking steps all feed it real numbers.

---

## Follow-up Q&A

### 1) Quote — Who is the person who visits the site?

It's a company employee (usually the business owner, a "sales," or a "team_leader") — not an outside person. They log into the app (from a computer or phone) and build the quote directly inside the system, linked to the project. The quote is 100% owned by the company — the client only views it and accepts it, with no permission to modify it.

### 2) Planning Gantt — Does the assigned person need to be a registered employee?

Yes, exactly. The person assigned to a task must already exist in the "Équipe" (Team) section — meaning they have an account/profile inside the company — not a freely typed name. This matters because that same person is the one who will later log their hours (Time Entries) against that exact task — if the name isn't tied to a real account, they won't be able to log their time.

### 3) Subcontracting — A clearer explanation

This is actually a simple module: a small directory of subcontractors (name, specialty, phone number) + tracking of the invoices the company pays them. In other words, there are two completely separate money flows:

- **Invoice (Invoice)** = money coming in — the client (Dubois) pays the company.
- **`purchase_invoices` (Purchase invoice)** = money going out — the company pays the plumber (or any subcontractor).

Both are linked to the same project, but not in the same table — so the margin calculation can compute: money in − money out (purchases + subcontractor + labor hours).

### 4) Stocks — Is inventory per-project or company-wide?

Inventory is **company-wide**, not per project. The company registers it once: it has X tiles, Y liters of paint, etc., and this number is shared across all active projects. When a specific project consumes 30 tiles, that number is deducted from the shared stock and recorded as a cost for that project. If two projects are running at the same time and both consume tiles, they both draw down the same shared stock — and this is where a stock-out (rupture) can happen.

### 5) Time Entries — How will workers (who have no technical experience) log their hours?

My opinion: you shouldn't build a separate app, and WhatsApp isn't the answer either (WhatsApp has no structured format, so turning a free-text message into accurate data would be difficult). The right solution is: a much simpler, mobile version of the same app, where the worker logs in with a simple account (phone number + code, not a complex email/password), and only sees: "My tasks today" + a "Log your hours" button. They shouldn't even have permission to see invoices or margins. This already exists in the technical documentation (app/mobile/time entry) — so the idea is correct, it just needs to be properly finished/built.

### 6) Invoices — Is payment recorded manually?

Yes, in the current version, the accountant or office staff manually confirms that the client has paid (after seeing a bank transfer, check, or cash), and changes the invoice status from `sent` to `paid`. There's no automatic bank reconciliation (that would require a real bank integration or a complete Stripe integration, which doesn't exist yet). Regarding "too many objects/models" — no, the number is reasonable, not excessive: `draft` (draft), `sent` (sent), `partiellement paid` (partially paid), `paid` (paid), `overdue` (late). That's only 5 statuses — a normal setup for any invoicing system, not unnecessary complexity.

### 7) Portal client — When is the link generated, and how long does it last?

You're close to correct, with one small correction:

- The link is **not generated automatically** when the client accepts the quote. The company generates it **manually** (a "générer un lien" button on the project page), whenever they choose to.
- The link stays valid for **90 days only** (a fixed duration), not "as long as the project is active." If the project runs longer than 90 days, the company needs to generate a new link before the old one expires.
- Once generated, it's correct that it updates in real time (any change to the quote/invoices/progress shows immediately to the client without needing to send a new link) — just with that 90-day time limit.