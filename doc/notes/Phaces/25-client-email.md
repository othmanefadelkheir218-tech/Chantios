# Step 25 — Email with clients (company address + personal Gmail)

> Needs step 02 (users, permissions), 03 (media), 04 (clients, projects), 11 (chat), 12 (portal), 13 (alerts), 14 (plans, billing).
> Backend first (25A → 25D), then frontend (25E). **Status: built 2026-10-19** (backend + frontend). Left: the live tests with the owner (D5 sections 3–9, E12 section 10).
> Rules (the WHY): [NOTE/EMAIL-CONNECTIONS-PLAN.md](../../../NOTE/EMAIL-CONNECTIONS-PLAN.md). Production setup (Resend + Google): [NOTE/GOOGLE-GMAIL-SETUP.md](../../../NOTE/GOOGLE-GMAIL-SETUP.md). AI: on hold, [NOTE/AI-email-idea.md](../../../NOTE/AI-email-idea.md).
> Test plan: [../PhacesTest/19-client-email.md](../PhacesTest/19-client-email.md).

## 1. Goal

Staff with the `email` right talk with clients by email from ChantierOS — through the company's ChantierOS address (shared inbox) or their own Gmail (private inbox) — and see emails and portal messages together, one chat per client, each email topic tagged with a project.

---

## 2. Decide first

Everything in the rule file is decided (owner, 2026-10-18). These points came up while planning against the code. **Do not build the part a point blocks before the owner answers.** Write the answer in `doc/notes/client-email.md` (task A1) and in the two open-question lists.

| # | Question | Why it comes up | Proposal | Blocks |
|---|---|---|---|---|
| D1 | How is a Gmail mailbox billed? | The code has no add-on purchase: [subscription-plans.md](../subscription-plans.md) § Decided — every dimension is **usage-based, counted at renewal, never blocks** | ✅ **Decided 2026-10-18 (owner): like employees.** New plan feature key `email_mailboxes`: allowance + overage rate per plan, set by the super-admin (this is the price per mailbox). Count = Gmail inboxes not removed. Connecting is never blocked; no "buy" button; the admin controls who can connect through the `email` right | — |
| D2 | Email attachments of a type chat does not allow (Word, Excel, ZIP…) or over 10 MB? | `media` for `message` allows PDF, JPEG, PNG only, max 10 MB | ✅ **Decided 2026-10-18 (owner).** New media entity type `email_attachment`: PDF, images (jpeg, png, webp, gif), Word, Excel, PowerPoint (doc/docx/xls/xlsx/ppt/pptx, odt/ods), ZIP, TXT, CSV — **max 25 MB** (Gmail's limit). **Blocked** (dangerous): executables and scripts (`.exe .bat .cmd .com .msi .scr .js .vbs .ps1 .jar .sh .apk`) — listed by name only, "not saved for security". Counts in plan storage. Staff attachments on an outbound email use the same type | — |
| D3 | How do we find the topic of a client's reply? | We only have `gmail.send` (no read), and the `Message-ID` we set is replaced (spike below) | ✅ **Decided 2026-10-18 (owner): option B + a code in the subject.** Company inbox → `Reply-To: reply-<token>@mail…` (sure). Gmail inbox → **no** Reply-To: the reply goes to the user's Gmail like a normal email and comes back by forward. Every email **we start from a Gmail inbox** ends its subject with the topic code: `Devis cuisine [#K7Q2M9]`. A reply to the client's own email has **no** code (it keeps their subject, so their Gmail keeps one conversation; their next reply is matched by `References`). Matching for Gmail: `[#code]` in the subject → known `References` / `In-Reply-To` → else a new topic. **No guessing by subject.** A wrongly placed message can still be **moved** to another topic | — |

**Spike B0 — done 2026-10-18.** Both providers **replace** the `Message-ID` we set:

| Sent through | Our `Message-ID` | The client's reply `In-Reply-To` |
|---|---|---|
| Resend | `<d3-resend-…@mail.zouadev.com>` | `<…@eu-west-1.amazonses.com>` (Amazon SES) |
| Gmail API | `<d3-gmail-…@mail.zouadev.com>` | `<CAKed-…@mail.gmail.com>` (Gmail's own) |

So: do **not** set our own `Message-ID`, and never rely on knowing the id of an email **we** sent. The ids we **do** know are the ones of emails we **receive** (stored in `message_emails.header_message_id`) — a reply from the client lists them in `References`, which is why a client-started topic always matches.

---

## 3. Tables

DDL to copy into [Schema Proposal.md](../../Schema%20Proposal.md) § 9 as `### Client email` (task A1). Migration name: `<date>_client_email`. Opening comment: `-- Step 25 — email with clients (doc/notes/client-email.md).`

```sql
-- Enums
ALTER TYPE permission_module ADD VALUE 'email';
ALTER TYPE permission_module ADD VALUE 'email_gmail'; -- "Connecter un Gmail", admin only by default (own migration 20261019180000)
ALTER TYPE conversation_type ADD VALUE 'client';        -- one chat per client per inbox
ALTER TYPE sender_type       ADD VALUE 'contact';       -- email from an address that is not a client yet
ALTER TYPE media_entity_type ADD VALUE 'email_attachment'; -- D2: files of an email (more types, 25 MB)

-- D2: email files may be up to 25 MB, every other file keeps the 10 MB limit
ALTER TABLE media DROP CONSTRAINT chk_media_file_size;
ALTER TABLE media ADD CONSTRAINT chk_media_file_size CHECK (
  file_size > 0 AND (file_size <= 10485760 OR (entity_type = 'email_attachment' AND file_size <= 26214400))
);
CREATE TYPE email_inbox_kind   AS ENUM ('company', 'gmail');
CREATE TYPE email_inbox_status AS ENUM ('active', 'disconnected', 'removed');
CREATE TYPE email_direction    AS ENUM ('inbound', 'outbound');
CREATE TYPE email_transport    AS ENUM ('resend', 'gmail');

-- Every tenant_id below also REFERENCES tenants(id) ON DELETE CASCADE, like every business table.
-- Migrations: 20261018120000_client_email_enums (enum values) + 20261018120100_client_email.
-- One row per inbox: the company address (1 per tenant) or a connected Gmail (1 per user + address)
CREATE TABLE email_inboxes (
  id                       SERIAL PRIMARY KEY,
  tenant_id                INT NOT NULL REFERENCES tenants(id),
  kind                     email_inbox_kind NOT NULL,
  owner_user_id            INT REFERENCES users(id),          -- gmail only
  gmail_address            VARCHAR(255),                       -- gmail only
  refresh_token_encrypted  TEXT,                               -- gmail only, AES-256-GCM
  scopes                   TEXT,
  status                   email_inbox_status NOT NULL DEFAULT 'active',
  last_error               TEXT,
  forward_confirm_url      TEXT,                               -- Gmail's "confirm forwarding" link, shown to the owner
  connected_at             TIMESTAMPTZ,
  disconnected_at          TIMESTAMPTZ,
  removed_at               TIMESTAMPTZ,
  last_used_at             TIMESTAMPTZ,
  last_received_at         TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, id),
  CONSTRAINT chk_inbox_kind_fields CHECK (
    (kind = 'company' AND owner_user_id IS NULL AND gmail_address IS NULL AND refresh_token_encrypted IS NULL)
 OR (kind = 'gmail'   AND owner_user_id IS NOT NULL AND gmail_address IS NOT NULL)
  )
);
CREATE UNIQUE INDEX uq_inbox_company ON email_inboxes(tenant_id) WHERE kind = 'company';
CREATE UNIQUE INDEX uq_inbox_gmail   ON email_inboxes(owner_user_id, lower(gmail_address)) WHERE status <> 'removed';

-- Every address we receive on: <local_part>@mail.<our-domain>. GLOBAL unique (the webhook has no tenant yet).
-- Company: 'company-x' (old names stay, is_primary = false). Gmail forward: 'company-x.<random>'.
CREATE TABLE email_addresses (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL,
  inbox_id    INT NOT NULL,
  local_part  VARCHAR(64) NOT NULL,
  is_primary  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, inbox_id) REFERENCES email_inboxes(tenant_id, id),
  CONSTRAINT chk_email_local_part CHECK (local_part ~ '^[a-z0-9][a-z0-9.-]{1,62}[a-z0-9]$' AND local_part NOT LIKE 'reply-%')
);
CREATE UNIQUE INDEX uq_email_local_part ON email_addresses(lower(local_part));

-- Extra addresses of a client (clients.email stays the main one). Needs UNIQUE (tenant_id, id) on clients.
CREATE UNIQUE INDEX clients_tenant_id_id_key ON clients(tenant_id, id);
-- Extra addresses of a client (clients.email stays the main one)
CREATE TABLE client_emails (
  id          SERIAL PRIMARY KEY,
  tenant_id   INT NOT NULL,
  client_id   INT NOT NULL,
  email       VARCHAR(255) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, client_id) REFERENCES clients(tenant_id, id)
);
CREATE UNIQUE INDEX uq_client_emails ON client_emails(tenant_id, lower(email));

-- conversations: a 'client' conversation = one chat with one client (or unknown contact) in one inbox
ALTER TABLE conversations
  ADD COLUMN inbox_id      INT REFERENCES email_inboxes(id),
  ADD COLUMN client_id     INT REFERENCES clients(id),
  ADD COLUMN contact_email VARCHAR(255),
  ADD COLUMN contact_name  VARCHAR(255),
  ADD CONSTRAINT chk_client_conversation CHECK (
    type <> 'client' OR (inbox_id IS NOT NULL AND (client_id IS NOT NULL OR contact_email IS NOT NULL))
  );
CREATE UNIQUE INDEX uq_client_conv_client  ON conversations(inbox_id, client_id) WHERE type = 'client' AND client_id IS NOT NULL;
CREATE UNIQUE INDEX uq_client_conv_contact ON conversations(inbox_id, lower(contact_email)) WHERE type = 'client' AND client_id IS NULL;

-- A topic = one email thread (one subject) inside a client conversation
CREATE TABLE conversation_topics (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INT NOT NULL,
  conversation_id    INT NOT NULL REFERENCES conversations(id),
  subject            VARCHAR(998) NOT NULL,
  project_id         INT REFERENCES projects(id),           -- the project tag, NULL = no project
  project_suggested  BOOLEAN NOT NULL DEFAULT false,         -- true = set by the "1 open project" rule, not confirmed yet
  reply_token        VARCHAR(64) NOT NULL,                   -- Reply-To: reply-<token>@mail.<our-domain>
  subject_code       VARCHAR(8)  NOT NULL,                   -- D3: '[#K7Q2M9]' at the end of the subject of every email we start from a Gmail inbox (not on a reply to the client's email)
  created_by         INT REFERENCES users(id),               -- NULL = opened by the client
  last_message_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_topic_reply_token ON conversation_topics(reply_token);
CREATE UNIQUE INDEX uq_topic_subject_code ON conversation_topics(conversation_id, subject_code);
CREATE INDEX idx_topics_project ON conversation_topics(tenant_id, project_id);

-- messages: an email message belongs to a topic; the email details are in message_emails
ALTER TABLE messages
  ADD COLUMN topic_id INT REFERENCES conversation_topics(id),
  ALTER COLUMN sender_id DROP NOT NULL,
  ADD CONSTRAINT chk_message_sender CHECK ((sender_type = 'contact') = (sender_id IS NULL));

CREATE TABLE message_emails (
  message_id           INT PRIMARY KEY REFERENCES messages(id),
  tenant_id            INT NOT NULL,
  direction            email_direction NOT NULL,
  transport            email_transport,                      -- outbound only
  inbox_id             INT NOT NULL REFERENCES email_inboxes(id),
  header_message_id    VARCHAR(998),
  in_reply_to          VARCHAR(998),
  references_ids       TEXT[] NOT NULL DEFAULT '{}',
  from_address         VARCHAR(255) NOT NULL,
  from_name            VARCHAR(255),
  to_addresses         TEXT[] NOT NULL,
  cc_addresses         TEXT[] NOT NULL DEFAULT '{}',
  subject              VARCHAR(998) NOT NULL,
  html                 TEXT,                                 -- the email as it was (its style)
  text_full            TEXT,                                 -- full text, quotes included; messages.content = clean text
  skipped_attachments  JSONB NOT NULL DEFAULT '[]',          -- D2: [{ filename, reason: 'blocked_type' | 'too_large' }]
  new_address          BOOLEAN NOT NULL DEFAULT false,       -- inbound from an address that is not the client's ("Add this address")
  resend_email_id      VARCHAR(64),
  gmail_message_id     VARCHAR(64),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_emails_header ON message_emails(tenant_id, header_message_id);
CREATE UNIQUE INDEX uq_message_emails_resend ON message_emails(resend_email_id) WHERE resend_email_id IS NOT NULL;

-- Platform table (NO tenant scope, like stripe_events): one row per Resend webhook, for idempotency
CREATE TABLE inbound_email_events (
  id               SERIAL PRIMARY KEY,
  resend_email_id  VARCHAR(64) NOT NULL UNIQUE,
  payload          JSONB NOT NULL,
  tenant_id        INT,                                      -- filled once routed, for support only
  processed_at     TIMESTAMPTZ,
  error            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- Add `InboundEmailEvent` to `TENANT_EXTENSION_SKIP_LIST` (`src/common/prisma/tenant-extension.ts`) and to Schema Proposal § 12.
- `email_addresses` is read **before** a tenant is known (webhook). Like the support door in chat: **one explicit repository method** on the unwrapped Prisma client (`findAddressForRouting(localPart)`), nothing else bypasses the extension.
- If D1 = proposal: plan feature key `email_mailboxes` (no DDL — `plan_features` is key/value).

---

## 4. Where the code lives

Three modules own the work. The arrows are service calls, never repository access.

```
email-connections  (inboxes, addresses, Gmail OAuth + send, encryption)   ← chat, inbound-email, billing call it
chat               (client conversations, topics, email messages, reading rules)  → email-connections, clients, projects, media, notifications
inbound-email      (Resend webhook, event store, queue, routing)           → email-connections, chat, clients
```

**Backend**

```
src/common/helpers/crypto.helper.ts                 NEW encryptSecret / decryptSecret (AES-256-GCM, key EMAIL_TOKEN_ENCRYPTION_KEY)
src/common/helpers/presence.helper.ts               MOVED from src/chat/helpers/ (room names shared with notifications)
src/common/events/app-events.service.ts             + 'user.deactivated': { tenantId, userId }
src/config/env.config.ts                            + EMAIL_TOKEN_ENCRYPTION_KEY, INBOUND_EMAIL_DOMAIN (e.g. mail.zouadev.com); GOOGLE_* + RESEND_WEBHOOK_SECRET become required in production
src/auth/helpers/permission.helper.ts               + email: admin F, manager F, sales F, others none, worker none
src/roles/handlers/roles.handlers.spec.ts           20 modules → 40
src/users/handlers/deactivate-user.handler.ts       emit 'user.deactivated'
src/clients/                                        + client_emails: addEmail, findByAnyEmail, listEmails (service pass-throughs)
src/media/media.service.ts                          + uploadBuffer(buffer, filename, mime, dto, actor) — the inbound email has no Multer file
src/media/helpers/media.helper.ts                   + email_attachment: allowed MIME list, 25 MB limit, blocked extensions (D2)
src/email/email.service.ts                          + sendThreaded({ fromName, fromAddress, to, subject, html, text, replyTo, headers, attachments }) → { resendEmailId }
src/email/helpers/email-mime.helper.ts              NEW build raw MIME (Gmail), encode headers, Message-ID builder
src/notifications/notification.types.ts            + new_email, email_mailbox_disconnected, email_forward_confirm
src/notifications/helpers/notification-templates.helper.ts   + the 3 templates (fr / en / nl)
src/notifications/handlers/dispatch-notification.handler.ts  + DispatchContext.emailOnlyIfOffline (presence check)

src/email-connections/                              REPLACES the test module
  email-connections.controller.ts                   /api/email-inboxes...
  email-connections.service.ts
  handlers/  find-inboxes, set-company-address, start-gmail-connect, finish-gmail-connect,
             disconnect-inbox, send-through-inbox, mark-inbox-broken, resolve-address, on-user-deactivated
  helpers/   gmail-oauth.helper.ts (consent URL, signed state, token calls), inbox.helper.ts (toInboxEntity, address builders)
  listeners/ user-events.listener.ts
  repositories/ email-inbox.repository.ts           inboxes + addresses (one file)
  dto/       set-company-address.dto.ts, find-inboxes-query.dto.ts
  decorators/ email-connections.swagger.ts

src/inbound-email/                                  REPLACES the test module
  inbound-email.controller.ts                       POST /api/webhooks/resend-inbound
  inbound-email.service.ts                          verify + recordAndEnqueue
  processors/ inbound-email.processor.ts            queue 'inbound-email'
  handlers/  record-inbound-event, process-inbound-email
  helpers/   email-parse.helper.ts (strip quotes, signatures, [image: …]; parse References), routing.helper.ts
  repositories/ inbound-email-event.repository.ts   raw PrismaService (skip list), like StripeEventRepository
  dto/       inbound-email-job.dto.ts               INBOUND_EMAIL_QUEUE = 'inbound-email'

src/chat/
  client-chats.controller.ts                        NEW /api/client-chats...
  handlers/  find-client-chats, find-client-chat, find-topic-messages, send-new-email, reply-in-topic,
             set-topic-project, move-message-topic, receive-inbound-email, resolve-contact, delete-client-chat, find-project-topics
  helpers/   chat-access.helper.ts (+ client conversation rule), topic-project.helper.ts (the tag rules), client-chat.helper.ts (entities)
  repositories/ conversation.repository.ts (+ client conversations, topics), message.repository.ts (+ message_emails)
  chat.gateway.ts                                   join: client conversations use the inbox reading rule
```

---

## 5. Routes

All tenant routes: `@TenantAuth()` + `@Module('email')` + `SnakeCaseInterceptor`. `tenant_id` never in a route, query or body.

**`email-connections` — `/api/email-inboxes`**

| Method | Path | Right | Does |
|---|---|---|---|
| GET | `/api/email-inboxes` | email view | The company inbox (address, old addresses) + the caller's Gmail inboxes. A user with `settings` view also gets every Gmail inbox of the company — **status only**, never the content |
| PATCH | `/api/email-inboxes/company` | settings edit | `{ local_part }` — new primary address, old one kept as `is_primary = false`. `409` if taken. Creates the company inbox on first call |
| POST | `/api/email-inboxes/gmail/connect` | email create | `{ url }` Google consent link. `state` = signed JWT `{ tenantId, userId, nonce }`, 10 min |
| GET | `/api/email-inboxes/gmail/callback` | `@Public()` | Checks `state`, requires `gmail.send` in the granted scopes, saves the token **encrypted**, creates the forward address `<company>.<random>`. Redirects to `APP_URL/<locale>/settings/email?gmail=connected` or `?gmail=error&reason=…` |
| DELETE | `/api/email-inboxes/:id` | owner, or settings edit | Revokes at Google (`oauth2.googleapis.com/revoke`), `status = removed`, token wiped. Conversations stay, read-only |

**`inbound-email`**

| Method | Path | Guard | Does |
|---|---|---|---|
| POST | `/api/webhooks/resend-inbound` | `@Public()`, raw body, `@SkipThrottle()` | Svix signature check (`400` if wrong) → `inbound_email_events` row (idempotent on `resend_email_id`) → queue job → `200 { received: true }` |

**`chat` — `/api/client-chats`**

| Method | Path | Right | Does |
|---|---|---|---|
| GET | `/api/client-chats?inbox_id=&search=&unknown=&page=&limit=` | email view | Chats the caller may read (§ 8 rule), last message first, unread count, 📧 + 💬 |
| GET | `/api/client-chats/:id` | email view | One chat: client or contact, inbox, **topics** = email topics + the client's portal conversations (`project_client`) as 💬 topics |
| GET | `/api/client-chats/:id/topics/:topicId/messages?page=&limit=` | email view | Messages of one email topic, newest first, with `email` details (from, to, subject, html, skipped attachments) and attachments |
| POST | `/api/client-chats/emails` | email create | New email: `{ to, subject, content, inbox_id?, project_id?, media_ids? }` → finds or creates the client conversation + a new topic, sends, returns the topic |
| POST | `/api/client-chats/topics/:topicId/reply` | email create | `{ content, media_ids? }` → same thread, to the address of the client's last email in this topic |
| POST | `/api/client-chats/attachments` | email create | A file for an email we send (D2 rules), pending `email_attachment`, then named in `media_ids`. `email_attachment` is a private media type, so the attach check reads it with `MediaRepository.findManyByIdsForAttach` (no private filter; safe: same type, pending, same uploader) |
| PATCH | `/api/client-chats/messages/:messageId/topic` | email edit (shared inbox) / owner (Gmail) | `{ topic_id }` — move a wrongly placed **inbound** email to another topic **of the same conversation** (D3). `400` for another conversation or an outbound message |
| PATCH | `/api/client-chats/topics/:topicId/project` | email edit + projects edit (shared inbox) / owner (Gmail) | `{ project_id \| null }`, clears `project_suggested` |
| POST | `/api/client-chats/:id/read` | email view | Mark all messages read for the caller |
| POST | `/api/client-chats/:id/create-client` | clients create | Unknown contact → new client. Body = the normal client form, pre-filled with name + email (decided 2026-10-19: a client needs a phone). The conversation moves to `client_id` |
| POST | `/api/client-chats/:id/add-address` | clients edit | `{ email }` — confirms "New address for Eya": adds a `client_emails` row |
| DELETE | `/api/client-chats/:id` | settings delete (admin) | GDPR: deletes the chat, its topics, messages, `message_emails`, reads and media. Audit row `gdpr_delete` (who, client, counts) |
| GET | `/api/projects/:id/email-topics?page=&limit=` | email view + projects view | Topics tagged with the project that the caller may read |

---

## 6. DTOs

| DTO | Fields |
|---|---|
| `SetCompanyAddressDto` | `local_part` string, 3–64, lower-case, `^[a-z0-9][a-z0-9.-]+[a-z0-9]$`, not starting with `reply-` |
| `FindClientChatsQueryDto` extends `PaginationQueryDto` | `inbox_id?` int, `search?` (name / email), `unknown?` bool |
| `SendNewEmailDto` | `to` email (required), `subject` 1–200, `content` 1–20 000, `inbox_id?` int (default: company inbox), `project_id?` int, `media_ids?` int[] ≤ 10 (pending `email_attachment` files, total ≤ 25 MB) |
| `ReplyInTopicDto` | `content` 1–20 000, `media_ids?` int[] ≤ 10 |
| `SetTopicProjectDto` | `project_id` int \| null |
| `MoveMessageDto` | `topic_id` int |
| `AddClientAddressDto` | `email` |
| `InboundEmailJobData` | `{ eventRowId, resendEmailId }` |

---

## 7. Repository methods

**`email-inbox.repository.ts`**
`createCompanyInbox(tenantId)`, `findCompanyInbox()`, `findById(id)`, `findForUser(userId)`, `findAllGmail()`, `createGmailInbox(data)`, `updateStatus(id, status, error?)`, `setToken(id, encrypted, scopes)`, `wipeToken(id)`, `touchUsed(id)`, `touchReceived(id)`, `setForwardConfirmUrl(id, url)`, `addAddress(inboxId, localPart, isPrimary)`, `demotePrimary(inboxId)`, `findAddresses(inboxId)`, `countBillableGmail()`, **`findAddressForRouting(localPart)` — unwrapped client, the only bypass**.

**`inbound-email-event.repository.ts`** (raw `PrismaService`) — `create`, `findByResendId`, `findById`, `markProcessed(id, tenantId)`, `markError(id, error)`.

**`conversation.repository.ts`** (+) — `findClientConversation(inboxId, clientId | contactEmail)`, `createClientConversation(data, tx)`, `findClientConversations(filter, skip, take)`, `moveContactToClient(id, clientId)`, `createTopic(data, tx)` (generates `reply_token` + `subject_code`: 6 characters from `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, retry on the unique index), `findTopicByReplyToken(token)`, `findTopicBySubjectCode(inboxId, code)`, `findTopicById(id)`, `setTopicProject(id, projectId, suggested)`, `touchTopic(id, at)`, `findTopicsByProject(projectId, inboxIds, skip, take)`, `deleteClientConversation(id, tx)`.

**`message.repository.ts`** (+) — `createEmailMessage(message, email, tx)`, `findTopicMessages(topicId, skip, take)`, `findByHeaderIds(ids[])` (for `References` matching), `lastInboundAddress(topicId)`, `existsResendEmail(resendEmailId)`.

**Clients repository** (+) — `findByAnyEmail(email)` (case-insensitive on `clients.email` and `client_emails.email`), `addEmail(clientId, email)`, `listEmails(clientId)`.

---

## 8. Handlers — the rule each one enforces

| Handler | Rule (see the rule file for the WHY) |
|---|---|
| `finish-gmail-connect` | `state` signature + expiry; `gmail.send` granted or `400` with "check the box"; the Gmail belongs to the person who logged in (one user can connect several Gmails); token stored encrypted; forward address created |
| `send-through-inbox` | Company inbox → Resend, `from: "<Company name> <primary@mail…>"`. Company inbox: `Reply-To: reply-<topic token>@mail…`. Gmail inbox → Gmail API with `From: <gmail>`, **no Reply-To**, and the subject ends with ` [#<subject_code>]` (D3) — **except** a reply in a topic **the client** started (`isReply`, the topic has the client's `Message-ID`s, and the client's last email has no `[#code]`): no code, `Re: <topic subject>` only. A topic **we** started keeps the code in every email (chat passes `threadHasCode` = the client's last subject carries the topic's code). Either way the subject never changes inside a thread, so the client's Gmail keeps one conversation. Both: `In-Reply-To` + `References` = the ids of the client's emails in this topic when replying (so the client's mail app keeps one thread); **no** own `Message-ID` (it is replaced anyway). Keep the subject: a reply is `Re: <topic subject>`; a new topic uses the subject the user typed. `topic.subject` is stored **without** the code; the code is added only when sending from Gmail (helper `withSubjectCode`). Google `invalid_grant` → `mark-inbox-broken` + `409 "Your Gmail is disconnected"` — **never** falls back to another inbox |
| `mark-inbox-broken` | `status = disconnected`, `last_error`; alert `email_mailbox_disconnected` to the owner + users with `settings` view (in-app + email) |
| `disconnect-inbox` | Owner or a user with `settings` edit. Revoke at Google, `removed`, token wiped. The admin never gets read access by doing this |
| `on-user-deactivated` | Listener of `user.deactivated`: every Gmail inbox of that user → `disconnect-inbox`. Their chats stay locked (owner inactive = nobody reads) |
| `process-inbound-email` | 1. Skip if processed. 2. Fetch the full email (`resend.emails.receiving.get`). 3. Route by recipient local part: `reply-<token>` → topic; else `email_addresses` → inbox. Unknown → mark error, stop. 4. `cls.run` + tenant. 5. Gmail forward confirmation (`forwarding-noreply@google.com`) → store the link + alert `email_forward_confirm` to the owner, stop. 6. Ignore auto-replies (`Auto-Submitted` not `no`, `X-Autoreply`, `Precedence: bulk/auto_reply`) — keep the row, no alert. 7. `chat.receiveInboundEmail(...)`. 8. `markProcessed`. Errors → `markError` + rethrow (BullMQ retries 3×) |
| `receive-inbound-email` | Find the topic, in this order (D3, [client-email.md](../client-email.md) § How a client's reply finds its topic): **company inbox** 1. reply token, 2. `References` / `In-Reply-To` match a `header_message_id` in `message_emails` of this inbox, 3. else a **new topic**. **Gmail inbox** 1. a `[#code]` in the subject (helper `readSubjectCode` in `email-parse.helper`) equals a topic's `subject_code` in the same inbox, 2. `References` / `In-Reply-To`, 3. else a **new topic**. No guessing by subject. The stored subject of a new topic has prefixes (`Re:`, `Fwd:`, `TR:`, `AW:`, `Antw:`) and any `[#code]` removed. Find the client: `clients.findByAnyEmail(from)`; on a known topic with a new address → message flagged `new_address` (the UI offers "Add this address"); unknown → `contact` conversation. Clean text = `email-parse.helper`. Attachments → `media.uploadBuffer` (entity `email_attachment`, entity id = message id); blocked or too large → `skipped_attachments` (D2). Alert `new_email` |
| `topic-project.helper` | The tag rules in order: reply → same tag; started from a project → that project; portal → the link's project; new client topic → 0 projects/unknown: none, 1 open project: suggested (`project_suggested = true`), 2+: none + `needs_project` in the alert |
| `set-topic-project` | Shared inbox: `email` edit + `projects` edit (admin + manager by default). Gmail inbox: the owner only. The project must belong to the conversation's client (`400` otherwise) |
| `chat-access.helper` (client rule) | Company inbox → `email` view. Gmail inbox → **only** `owner_user_id`, and only while the owner is active. Applied to HTTP **and** socket `join`. Another tenant → `404` |
| `send-new-email` | `to` matches a client (any address) → that client's conversation, else contact conversation. Inbox: given one must be readable by the caller and `active`; default = company inbox |
| `reply-in-topic` | Reply goes to the address of the client's **last inbound** email in the topic (falls back to the conversation address). Same inbox as the topic |
| `delete-client-chat` | `settings` delete only. One transaction + media hard delete + audit. The only delete of messages in the app (GDPR) |
| `dispatch-notification` (+) | `emailOnlyIfOffline`: the in-app row always; the email only if the user has **no** socket in `presence:user:<id>` (`fetchSockets`, Redis adapter) |

Alert recipients for `new_email`: company inbox → every active user whose role has `email` view (resolve with `loadPermissions`, **not** `filterStaffRecipients`, which keeps admin/manager only); Gmail inbox → the owner. Payload: `{ entity_id: messageId, conversation_id, topic_id, sender_name, subject, preview, needs_project }`. Use `emailOnlyIfOffline: true`.

Existing behaviour kept: a staff reply in a **portal** conversation already emails the client (`client_portal_message`). Nothing to build there.

---

## 9. Tasks

Send the Telegram messages from `CLAUDE.md` (phase start, each task, phase end). Run `tsc`, lint and the jest suite after each sub-phase. **Never start the API** — ask the owner to restart it, then test on port 5300 through ngrok.

### 25A — Foundations
- [x] A1 Write `doc/notes/client-email.md` from `NOTE/EMAIL-CONNECTIONS-PLAN.md` (rules only, final decisions) + the D1–D3 decisions (§ 2). Add the DDL to Schema Proposal § 9 and § 12. Add entry 21 to Schema Proposal "Open questions" and the matching `[x]` line to `A_progress-tracker.md` § To do. Add the `email` row to `roles-permissions.md` defaults
- [x] A2 Migration `<date>_client_email` (§ 3) + `schema.prisma` + `prisma generate`
- [x] A3 Permission `email` in `DEFAULT_PERMISSION_MATRIX`; roles spec 38 → 40
- [x] A3b Permission `email_gmail` ("Connecter un Gmail", 2026-10-19): admin `full`, every other role none, worker never (`NEVER_GRANTED`). `POST /api/email-inboxes/gmail/connect` is `@Module('email_gmail')` instead of `email`. Frontend: "Connecter mon Gmail" / "Reconnecter" need `email_gmail` create; the "Mon Gmail" card hides for a user with no Gmail and no right; Roles page label "Connecter un Gmail". Roles spec 40 → 42
- [x] A4 `crypto.helper.ts` + spec (round trip, wrong key fails, tampered text fails). Env `EMAIL_TOKEN_ENCRYPTION_KEY` (32 bytes base64), `INBOUND_EMAIL_DOMAIN`; `.env.example`
- [x] A5 `AppEvents['user.deactivated']`, emitted by `DeactivateUserHandler`
- [x] A6 Clients: `client_emails` methods + `ClientsService.findByAnyEmail / addEmail / listEmails`
- [x] A7 Media: `uploadBuffer` (same checks as `upload`: MIME, size, storage)
- [x] A8 Move `presence.helper.ts` to `src/common/helpers/`; chat imports it from there

### 25B — Inboxes and receiving
- [x] B0 Spike D3 — done 2026-10-18, result in § 2 (both providers replace our `Message-ID`; owner chose option B + a code in the subject)
- [x] B1 `email-connections` module: inboxes, addresses, company address route, Gmail connect/callback/disconnect (move the OAuth calls from the test service into `gmail-oauth.helper.ts`; delete `test-send`, the `x-test-key` and `.gmail-test-connection.json` logic)
- [x] B2 `send-through-inbox` (Resend + Gmail), `email-mime.helper.ts`, `EmailService.sendThreaded`
- [x] B3 `inbound-email` module: event table, queue, processor (copy the Stripe pattern), delete the logging test code
- [x] B4 `email-parse.helper.ts` + spec with real samples: Gmail en ("On … wrote:"), Gmail fr ("Le … a écrit :"), Outlook ("De :", "-----Original Message-----"), Dutch ("Op … schreef"), `[image: …]`, signature `-- `
- [x] B5 Routing: reply token, company address, Gmail forward address, unknown address, Gmail forward confirmation, auto-replies
- [x] B6 Attachments + inline images → media type `email_attachment` (D2: allowed list, 25 MB, blocked list by extension **and** MIME); `media.helper.ts` `ALLOWED_MIME_TYPES.email_attachment` + `MAX_FILE_SIZE_BYTES` per type; `chk_media_file_size` changed in the migration; `schema.prisma` comment updated

### 25C — Client chats
- [x] C1 Chat: client conversations, topics, email messages (repositories + entities)
- [x] C2 `receive-inbound-email` + `topic-project.helper` + spec (every tag rule)
- [x] C3 `/api/client-chats` routes (§ 5), access rule on HTTP + socket, `new_message` socket event on the conversation room
- [x] C4 New email, reply, set project, **move message to another topic**, read, create client, add address, GDPR delete
- [x] C5 `GET /api/projects/:id/email-topics`

### 25D — Alerts, events, billing
- [x] D1 `new_email`, `email_mailbox_disconnected`, `email_forward_confirm`: types + templates (fr / en / nl) + recipients
- [x] D2 `emailOnlyIfOffline` in the dispatch handler + spec
- [x] D3 `user.deactivated` listener
- [x] D4 Billing (D1 decided: like employees): `email_mailboxes` in `FEATURE_KEYS`, `BILLED_FEATURE_KEYS`, `UsageCounterHelper.countAll` (via `EmailConnectionsService.countBillable()`); a plan without the key = not billed
- [ ] D5 Full jest run, lint, build. Owner restarts the API. Live run of [19-client-email.md](../PhacesTest/19-client-email.md) sections 1–9

### 25E — Frontend (`ChanitOs_client/my-app`, follow its `.instruction/`)
- [x] E1 Types: `'email'` in `types/permission.ts`; `types/email.ts` (inbox, client chat, topic, email message); notification types; `lib/api/endpoints/email-inboxes.api.ts`, `client-chats.api.ts`; hooks `hooks/use-email-inboxes.ts`, `hooks/use-client-chats.ts`; `qk.emailInboxes`, `qk.clientChats`; row in `.instruction/chantieros/01-backend-contract.md`
- [x] E2 **Messages page** `/chat`: two tabs — "Équipe" (today's list) and **"Clients"** (client chats: name or "Contact inconnu", 📧/💬, unread, inbox filter). Route `/chat/clients/[id]`: topics column (subject, 📧/💬, project tag, "À lier" when `needs_project`, ⚠️ new address) + thread (HTML in a sandboxed `iframe` with a "texte / original" switch, attachments with image preview, skipped attachments listed) + reply composer
- [x] E3 **New email** dialog (Messages + client page + project page): to (client picker or free address), subject, message, **send from** (company address / my Gmail), project (optional, pre-filled on the project page), files
- [x] E4 Topic actions: "Lier à un projet" select, "Déplacer vers un autre sujet" on an inbound message, "Créer le client", "Ajouter cette adresse", admin "Supprimer (RGPD)" with a confirm dialog
- [x] E5 Project hub: tab **"Emails"** in the `exchanges` group (`project-tabs.constants.ts`, module `email`), folder `projects/[id]/emails/`
- [x] E6 **Settings → Email** (`settings-nav.constants.ts`, group `company`, module `email`): company address (+ change, admin), my Gmail (connect — first a warning dialog: a full forward brings every email, advice = a company Gmail or a Gmail filter; reconnect has no warning —, status 🟢/🔴, reconnect, disconnect, **forward address with copy button + the Gmail forward steps + the confirm link**; once a forwarded email has arrived (`last_received_at` set) only "Transfert actif" shows, the steps behind "Voir la configuration"), admin list of all mailboxes (status, owner, disconnect). Read `?gmail=connected|error`
- [x] E7 Client detail: "Envoyer un email" action + extra addresses list
- [x] E8 Notifications: 3 types in `notification-style.constants.ts`, `notification-view.ts` (`new_email` → `/chat/clients/:conversation_id?topic=`), `StaffRealtimeEvents.tsx` invalidates `qk.clientChats`
- [x] E9 Billing `UsageCard`: label `settings.billing.features.email_mailboxes`
- [x] E10 Roles screen label `settings.roles.modules.email`; app menu: "Messages" app gets no new item (tabs inside `/chat`)
- [x] E11 All text in `messages/fr.json` only. `npx tsc --noEmit`, `yarn lint`, `yarn build`. Update `my-app/.instruction/state.md`
- [ ] E12 Owner restarts the frontend, runs [19-client-email.md](../PhacesTest/19-client-email.md) section 10

### End
- [x] Update `doc/notes/WhereIStop/state.md`, this file's status, `00-START-HERE.md` table

---

## 10. Acceptance

- Webhook: a wrong signature → `400`; the same Resend email twice → one message.
- An email to the company address shows in the Messages "Clients" tab of every user with `email`, and **not** for the accountant (no `email`) or the worker.
- An email forwarded from the manager's Gmail shows **only** to the manager — the admin gets `404` on the chat, its topics and the socket `join`.
- A reply from the client lands in the **same topic** (company: reply token, then `References`; Gmail: the `[#code]`, then `References`), even from another address (flagged, not added). A wrongly placed email can be moved.
- Staff reply from the company inbox → the client sees it **from the company name**, same thread. From a Gmail → **from that Gmail**, same thread on the client's side.
- Tag rules: reply keeps the tag; started from a project = that project; 1 open project = suggested; 2+ = `needs_project` alert; the admin/manager (shared) or owner (Gmail) changes it.
- `new_email` alert: in-app always; email only when the user has no open socket.
- Gmail revoked → next send `409`, inbox `disconnected`, alert to owner + admin, nothing sent from another address.
- User deactivated → their Gmail inbox `removed`, token wiped, their chats unreadable.
- GDPR delete by admin removes everything of that chat, with an audit row; the manager gets `403`.
- Another tenant → `404` everywhere. `tenant_id` in a body → `400`.
- The test modules' code paths (`test-send`, `x-test-key`, `.gmail-test-connection.json`) are gone.

## 11. Notes to read

- [NOTE/EMAIL-CONNECTIONS-PLAN.md](../../../NOTE/EMAIL-CONNECTIONS-PLAN.md) — all the rules (until A1 moves them into `doc/notes/client-email.md`)
- [chat-conversations.md](../chat-conversations.md) — conversations, members, reads, online status
- [client-portal.md](../client-portal.md) — portal link, project conversation
- [alerts.md](../alerts.md) — the one dispatch door
- [subscription-plans.md](../subscription-plans.md) — usage-based billing (D1)
- [media-files.md](../media-files.md) — attachments
- [roles-permissions.md](../roles-permissions.md) — the matrix
