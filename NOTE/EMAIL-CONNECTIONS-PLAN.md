# Email with clients — plan

> Status: **plan, nothing built** (except the local test routes listed at the end).
> Impacts: **database, backend and frontend.**
> Related: [AI-email-idea.md](AI-email-idea.md) (AI — on hold) · [GOOGLE-GMAIL-SETUP.md](GOOGLE-GMAIL-SETUP.md) (Google + Resend setup for production).

---

## What it is

Company staff talk with **clients by email, from ChantierOS**. Emails and portal messages show **together in one chat per client** — on **our side only**.

We **never read** a mailbox. We receive only what is sent or forwarded to our address, and we send only what the user writes and clicks Send on.

---

## Mailboxes and plans

| | Default — ChantierOS address | Extra mailbox — personal Gmail | Extra mailbox — own domain |
|---|---|---|---|
| Address | `company-x@mail.<our-domain>`, one per company | The user's own Gmail | e.g. `contact@companyx.be` |
| Receive | Clients write to it directly (Resend) | **Gmail forward** to the user's personal forward address (Resend) | Mailbox forward (Resend) |
| Send | Resend, from `company-x@mail.<our-domain>` with the company name | Gmail API (`gmail.send`), from the user's real Gmail | Resend, after the tenant adds DNS (SPF/DKIM) |
| Who reads it | **Shared team inbox** — everyone with the `email` permission | **Only the owner** — not the admin either | To decide |
| Price | **Free, always on, every plan** | **Paid per mailbox, like employees** (see § 2) | **Paid per mailbox** |
| Status | Build now | **Build now** | **Not built — keep the design open for it** |

**Why each Gmail has its own forward address:** a forwarded email arrives with the **client** as sender and our address as recipient. If every Gmail forwarded to the company address, we could not tell whose mailbox it came from, and a private email would land in the shared inbox. So each connected Gmail gets its own forward address (e.g. `company-x.<token>@mail.<our-domain>`), and that address decides the owner.

---

## Decisions (owner, 2026-10-18)

### 1. Permission `email`
- New permission module **`email`**, set per role by the admin, like every other module.
- It decides **who can use email** (read the shared inbox, send) **and who can add a personal mailbox**.
- **Default:** admin, manager and sales **on** · accountant, site supervisor, team leader **off** · **worker never**.
- Available in **every plan** (the ChantierOS address is free).

### 2. Who can do what with a mailbox

| Action | Who |
|---|---|
| Choose who can connect | **Admin**, through the `email` permission per role |
| Connect a Gmail | A user with `email`, **for their own Gmail only** (Google forces it: the owner must log in). **Never blocked** |
| Disconnect a mailbox | **The owner** (their own) **and the admin** (anyone's — e.g. an employee leaves). The admin can disconnect, but still cannot read it |

- **Billing — like employees:** each plan has a new item **`email_mailboxes`** = how many Gmail mailboxes are included + the price of each extra one, set by the super-admin per plan. At each renewal the app counts the Gmail mailboxes and bills the extra ones. There is **no "buy" button**, and connecting is never blocked.
  - Example: plan includes 1, extra = €X/month. The company connects 3 → at renewal it pays 2 extra.
- A **disconnected** mailbox **still counts as paid** until the admin removes it.
- When a user is **deactivated**, their Gmail is **disconnected automatically**. Their private email chats stay **locked** (nobody reads them).
- **Outlook / Microsoft 365** mailboxes: later, not in this plan.

### 3. Who reads what
- **ChantierOS address:** everyone with the `email` permission.
- **Personal Gmail:** **only the owner.** If an email comes to the manager's Gmail, only the manager reads it. Same privacy rule as private notes.

### 4. Which emails come in
**All of them:** replies to our emails, new emails written to the ChantierOS address, and emails forwarded from a personal Gmail.

### 5. One chat per client, with topics

```
💬 Eya Jarraya                                    ← ONE chat per client
 ├── 💬 Portal – Salle de bain        🏷️ Salle de bain Namur
 ├── 📧 "Devis salle de bain"          🏷️ Salle de bain Namur
 ├── 📧 "Question facture"             🏷️ Cuisine Liège
 └── 📧 "Re: Devis" (from eya@work.com ⚠️)
```

- **One chat per client.** All emails and portal messages with that client land in it.
- **A topic** = one email thread (one subject), or the portal chat of one project.
- **Each topic has a project tag** (or "No project"). The tag is on the **topic**, not on the whole chat, because one client can talk about several projects.

### 6. How the project tag is decided — in this order
1. **Reply in an existing topic** → same tag, automatic (we know the thread from the reply address or `References`).
2. **Topic started from a project** (staff click "New email" on the project page) → that project, automatic.
3. **Portal message** → the project of the portal link, automatic.
4. **Client opens a new email topic:**

   | Client has | What happens |
   |---|---|
   | 0 projects, or unknown sender | "No project", nothing to ask |
   | 1 open project | **Suggested** — "Link to Salle de bain Namur?" → ✅ or change |
   | 2+ open projects | **Alert:** "Eya (2 projects) sent a new email. Link it to a project?" → list + "No project" |

5. **The tag can always be changed later.**

**Who sets the tag:**
- Shared inbox topics → **admin and manager**.
- Personal Gmail topics → **the owner** (the admin cannot read them).

### 7. Who is the client
- **Portal** → the client of the portal link.
- **Email** → the client whose email address matches.
- **Reply from another address** (e.g. `eya@work.com`) → we still know the topic from the thread, so it lands in Eya's chat, marked ⚠️ "New address for Eya — add it to her contact?". A new address is **never added automatically**; the admin confirms.
- A client can have **several email addresses**.
- **Unknown sender** → shown as "Unknown contact" with a one-click **Create client** (name and email filled in).

### 8. Replying — always by the channel and address the client used

| Client wrote from | Our reply goes to | Client sees it in |
|---|---|---|
| `eya@gmail.com` | `eya@gmail.com` | Her Gmail |
| `eya@work.com` | `eya@work.com` | Her work mailbox |
| The portal | The portal | The portal |

The client sees each channel **separately**. Only ChantierOS shows everything together.

### 8b. How a client's reply finds its topic
- **ChantierOS address:** our emails carry a hidden reply address (`reply-<token>@mail…`). The reply always lands in the right topic.
- **Personal Gmail:** no special reply address. The client's reply goes to the user's Gmail (they see it there too) and comes back to ChantierOS by the forward. To be sure of the topic, **every email sent from a personal Gmail ends its subject with a short code**: `Devis cuisine [#K7Q2M9]`. The client's reply keeps it (`Re: Devis cuisine [#K7Q2M9]`), so ChantierOS finds the topic **every time**. No guessing by subject.
  - Order: 1. the code in the subject, 2. the client's earlier emails in the thread (their ids are known), 3. else a new topic.
  - The code is in the email only, never shown in ChantierOS. The user can still **move** a message to another topic.
- Why: Resend and Gmail both replace the email id we set (tested 2026-10-18), and the send-only Gmail permission cannot read the id Gmail gives.

### 9. Portal link (90 days) — still needed
- **Email = talk. Portal = see and act:** quote, invoices, progress, photos, reports, **Accept / Refuse the quote**, PDFs.
- Emails can carry a button ("View your quote") that opens the portal.
- **Portal chat is kept.** The client chooses portal or email; both land in the same chat on our side.
- When staff reply **in the portal**, the client also gets a short email: "You have a new message — open your portal".

### 10. Start a conversation
- **Messages → New email**, or **project page → New email** (tagged with that project).
- Type the **email address**, subject, message → **Send**.
- **Send from:** the ChantierOS address, or the user's own Gmail if connected.

### 11. Where it shows
- **Messages page:** the chats per client, with topics, 📧 / 💬, and the "Link to project" choice. The quoted old text of each email is cut off.
- **Project page:** an **Emails** tab with only the topics tagged with that project.
- **Bell 🔔:** an alert for every incoming email — ChantierOS address → everyone with `email`; personal Gmail → the owner only.
  - Recipient **connected** to the app (online) → **in-app only**.
  - Recipient **not connected** → **in-app + email**.

### 12. What we save
- The email **as it was**: **original HTML** (its style) + clean text + subject, from, to, `message_id`, `in_reply_to`, `references`.
- **Attachments** and inline images → **media** (ImageKit), as a new type **email attachment**:
  - Accepted: PDF, images, Word, Excel, PowerPoint, ZIP, TXT, CSV — **up to 25 MB** (Gmail's limit).
  - **Blocked** (dangerous): programs and scripts (`.exe`, `.bat`, `.js`…). They are not saved; the message shows their name: "not saved for security".
  - They count in the company's **storage**, like every file.
- **Kept**, no automatic delete.
- **GDPR:** when a client asks to delete their data, the **admin only** can delete that client's chat.

### 12b. The company's ChantierOS address
- The **admin picks the name** once (`company-x`).
- It **can change** later. The **old address keeps working**, so clients who still use it are not lost.

### 13. Language
Emails we send **automatically** (notifications, templates) follow the company language, like our other emails. What a user writes by hand is sent as written.

### 14. When Google access stops (removed or expired)
- **Alert** (in-app + email) to the **mailbox owner** and the **admin**: "Your Gmail is disconnected. Reconnect to keep sending."
- **Settings page:** 🟢 connected / 🔴 disconnected + **Reconnect** button.
- Sending from that mailbox **stops with a clear message**. Never sent silently from another address.

---

## What changes where

| Layer | Changes |
|---|---|
| **Database** | New `email_connections` · chat: **client chat + topics + project tag + channel** · email fields on messages (ids, subject, original HTML) · client **several email addresses** · permission module `email` · plans: paid mailboxes |
| **Backend** | Resend webhook (real version) + queue job · Gmail connect / send / disconnect · reply and forward addresses · client matching · tag rules · alerts · billing add-on per mailbox |
| **Frontend** | Messages page (client chat, topics, 📧/💬, link to project) · New email (Messages + project page) · project **Emails** tab · Settings → Email (connect Gmail, status, buy mailboxes) · roles screen (`email`) · "Create client" / "Add this address" actions |

---

## Data (first idea — to confirm in the schema step)

**`email_connections`** — one row per connected Gmail:

| Field | What |
|---|---|
| `tenant_id` | The company (from the JWT, never from the request) |
| `user_id` | Owner of the mailbox |
| `provider` | `google` (later: own domain) |
| `email` | The Gmail address |
| `forward_token` | Makes the personal forward address |
| `refresh_token_encrypted` | Google refresh token, **encrypted** (AES-256-GCM, key in `.env`) |
| `scopes` | What Google granted (must include `gmail.send`) |
| `status` | `active` / `disconnected` |
| `last_error`, `connected_at`, `disconnected_at`, `last_used_at` | |

**Chat** — reuse `conversations` + `messages`:
- conversation (= one client chat): client, inbox owner (`NULL` = shared company inbox, or the user for a personal Gmail)
- topic: channel (`email` / `portal`), subject, **project tag** (nullable), reply token
- message: `channel`, `message_id`, `in_reply_to`, `references`, from, to, subject, clean text, **original HTML**, attachments → media

---

## Routes (first idea)

| Route | Who | What |
|---|---|---|
| `GET /api/email-connections` | User with `email` | My mailboxes (admin: all of the company, status only) |
| `POST /api/email-connections/google/connect` | User with `email` | Returns the Google consent link |
| `GET /api/email-connections/google/callback` | Google (public) | Checks the signed `state`, saves the token encrypted |
| `DELETE /api/email-connections/:id` | Owner or admin | Disconnects + removes the access at Google |
| `POST /api/webhooks/resend-inbound` | Resend (signed) | Incoming email → queue job → save + alert |
| `POST /api/email-conversations` | User with `email` | New email: to, subject, text, send from, project (optional) |
| `POST /api/email-conversations/:topicId/messages` | User with `email` (+ owner for personal) | Reply in the topic |
| `PATCH /api/email-conversations/:topicId/project` | Admin + manager (shared) · owner (personal) | Set or change the project tag |

Messages list and threads: through the existing chat routes, with topics, channel and the "who reads what" rule added.

Security: the Google `state` carries the tenant and the user, **signed**. The webhook checks the Resend signature. Reply and forward tokens are long and random.

---

## Open questions (to answer before building)

None. The price per mailbox is set by the super-admin in each plan (§ 2).

---

## Test code today (local only, to replace)

| File | What |
|---|---|
| `src/inbound-email/` | `POST /api/webhooks/resend-inbound` — checks the signature, fetches the full email, logs only |
| `src/email-connections/` | `connect`, `callback`, `test-send` — one connection kept in `.gmail-test-connection.json` (git-ignored, off in production), `x-test-key` header |

What the tests proved (2026-10-18): receive by forward ✅ · two clients kept apart ✅ · reply as the user's Gmail in the same thread ✅ · client's next reply links back to the first email through `References` ✅.
