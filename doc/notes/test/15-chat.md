# Tests — Chat & Conversations

> Routes: `/api/conversations/...`, `/api/admin/support/:ticketId/messages`, and the Socket.io events. Read [00-how-to-test.md](00-how-to-test.md) first.
> Rules behind it: [chat-conversations.md](../chat-conversations.md), [media-files.md](../media-files.md), the step file [Phaces/11-chat.md](../Phaces/11-chat.md).

## Before you start

- **Guards:** every tenant route carries `@TenantAuth()` + `@Module('chat')` **and** a membership check: a conversation is only readable by the people in it. A same-tenant non-member → `403`; another tenant's conversation (or an unknown id) → `404`. The platform routes carry `AdminAuthGuard` only.
- **Log in first.** Tenant: `curl -c jar.txt -X POST http://localhost:5391/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@dupont.test","password":"Demo@12345678"}'`. Platform admin: `POST /api/admin/auth/login` with `admin@chantieros.local` / `Admin@ChantierOS2026` (cookie `admin_access_token`). You need `manager@`, `worker@dupont.test` and `admin@verhelst.test` too. Login is rate-limited (5 per minute) — space the logins.
- **Migration this step:** `20261006220000_chat_member_and_read_uniques` — five partial unique indexes (`uq_member_user|client|admin`, `uq_read_user|client`). The original `UNIQUE (message_id, user_id, client_id)` could not stop a duplicate read row (one of the two columns is always `NULL`, and Postgres treats NULLs as distinct), and `conversation_members` had no uniqueness at all.
- **Sockets:** Socket.io on the same port (`ws://localhost:5391`, path `/socket.io`). The handshake needs the `access_token` cookie (or `auth: { token }`); a platform admin sends `auth: { role: 'admin' }` and the `admin_access_token`. Use `socket.io-client` (not a project dependency — install it in a scratch folder, or use any Socket.io test client).
- **Payloads are snake_case** over the socket too (`conversation_id`, `sender_type`), like every HTTP response.
- **Attachments:** upload each file with `POST /api/media` (`entity_type = message`, `entity_id = 0`), then name the media ids when you send the message.
- Every record you create should start with `TEST`.
- **Support threads** are created by a support ticket (step 16). To test now, insert one: a `support_tickets` row, a `conversations` row (`type = 'support'`, `support_ticket_id`) and a `conversation_members` row for the tenant admin.

---

## 1. Conversations

### CHAT-01 — Create an internal conversation → 3 members

`POST /api/conversations` `{"type":"internal","member_user_ids":[<manager>,<supervisor>]}` as `admin` → `201`, `members` has **3** entries (the creator is added automatically), 3 `conversation_members` rows in the DB. Confirmed live.

### CHAT-02 — Who can be a member

A user of **another** tenant → `400` `…is not an active user of this company`. An unknown user → `400`. `type: "support"` or `"project_client"` → `400` (only `internal` is created from the API). `member_user_ids: []` → `400`. An unknown `project_id` → `404`. Confirmed live.

### CHAT-03 — Only the people in it

| Caller | Route | Result |
|---|---|---|
| member | `GET /api/conversations/:id` | `200`, members included |
| same-tenant **non-member** | `GET /:id`, `GET /:id/messages`, `POST /:id/messages`, `POST /:id/read` | `403` |
| another tenant | any of them | `404` |
| nobody logged in | any | `401` |

`GET /api/conversations` lists **only the conversations the caller is in** (an admin does not see other people's team chats). Confirmed live.

### CHAT-04 — Add a member, archive

`POST /api/conversations/:id/members` `{"user_id":<id>}` → `201`. The same person twice → `409`. A user of another tenant → `400`. A `project_client` / `support` conversation → `400` (internal only). `PATCH /api/conversations/:id/archive` → `is_archived: true`; hidden from the default list, shown with `?archived=true`, **rows still there**, and a new message → `400` `This conversation is archived`. There is no route that deletes a conversation or a message. Confirmed live.

### CHAT-05 — The database refuses it too

```
insert into conversations(tenant_id,type) values (1,'project_client');   -- chk_project_client_has_project
insert into conversations(tenant_id,type) values (1,'support');          -- chk_support_has_ticket
insert into conversation_members(tenant_id,conversation_id,user_id,client_id) values (1,<c>,<u>,1);  -- chk_member_one_identity
insert into conversation_members(tenant_id,conversation_id,user_id) values (1,<c>,<existing member>);  -- uq_member_user
insert into message_reads(tenant_id,message_id,user_id) values (1,<m>,<reader already recorded>);       -- uq_read_user
```

All rejected. (Run these in `psql` with `\set ON_ERROR_STOP on`, or read stderr — `psql` exits `0` after a failed statement.) Confirmed live.

---

## 2. Messages, real time

### CHAT-06 — Send a message

`POST /api/conversations/:id/messages` `{"content":"TEST hello"}` → `201`, `sender_type: "employee"`, `sender_id` = the caller; in the DB `tenant_id` is the conversation's. `content` over 5000 characters → `400`; empty → `400`; a `tenant_id` or `sender_id` in the body → `400` (never trusted). `GET …/messages` → paginated, **newest first**. Confirmed live.

### CHAT-07 — `new_message` reaches the other member's socket

Two sockets (two members) emit `join` `{conversation_id}` → `{ok:true}`. One member sends a message over HTTP → the other socket receives `new_message` (snake_case, `attachments` included). A socket that is **not** in the room receives nothing. Confirmed live.

### CHAT-08 — The socket is access-checked, not only the HTTP routes

- A socket with **no token** → disconnected at the handshake.
- `join` by a same-tenant **non-member** → `{ok:false,status:403}`, never enters the room.
- `join` by a user of **another** tenant → `{ok:false,status:404}`.
- `join` with no `conversation_id` → `400`; an unknown conversation → `404`.

Confirmed live. It is the same `CheckAccessHandler` as the HTTP routes.

---

## 3. Attachments

### CHAT-09 — Images and PDF only, through `media`

`POST /api/media` with `entity_type=message`, `entity_id=0`: two images → `201`; a `.docx` → `400`. Send a message with `media_ids:[a,b]` → `201` with 2 `attachments`; 2 `media` rows now carry `entity_type = 'message'` and `entity_id = <message id>`; the socket event and `GET …/messages` carry the files (read in one query for the whole page). Confirmed live.

### CHAT-10 — A file can only be attached once, by its owner

Another user's pending file → `400` and **no message is written** (the message and its files are one transaction). An already-attached file → `400`. The same id twice → `400`. A trashed file or one of another entity type → `400`. Confirmed live.

---

## 4. Read tracking

### CHAT-11 — Opening writes `message_reads` once

Admin sends 2 messages, manager replies once. As manager: `GET /api/conversations/unread-count` → `2` for that conversation (his own reply is never unread to him). `POST /api/conversations/:id/read` → `marked: 2, unread: 0`; exactly 2 `message_reads` rows. Open again → `marked: 0`, still 2 rows. Unread count → `0`. The other member's socket receives `message_read` (`conversation_id`, `message_id`, `reader`). Confirmed live.

### CHAT-12 — Simultaneous opens add no duplicates

Three `POST …/read` at the same moment → one row per message per reader (the unique index and `ON CONFLICT DO NOTHING`, not luck). Confirmed live.

---

## 5. The project conversation (step 12 calls it)

### CHAT-13 — `ensure-project-conversation` is idempotent

No HTTP route — `ChatService.ensureProjectConversation(projectId, actor)` is called by the portal (step 12) every time a link is generated. Called **four times at once**, then once more, on one project: exactly **one** `project_client` conversation, one call reporting `created: true`, the rest reusing it; members are the project's **client** (`client_id`) and the employee who generated the link (plus the project manager if there is one). Confirmed live with a throwaway script inside the real DI container; the lost-race branch is covered by a unit test.

---

## 6. The platform admin's support door

Decided 2026-10-06: **one explicit repository method** that takes a `tenantId` and runs on the unwrapped client, called only from a handler behind `AdminAuthGuard`, which always writes `audit_logs`. Never a general "disable the extension" flag.

### SUP-01 — Read a support thread across tenants, audited

`GET /api/admin/support/<ticketId>/messages?tenant_id=1` as platform admin → `200`, the thread's messages and `conversation_id`. An `audit_logs` row exists: `action = 'support_read'`, `tenant_id = 1`, `admin_user_id` set, an IP. Two reads → two rows. Confirmed live.

### SUP-02 — The cross-checks

| Case | Result |
|---|---|
| `tenant_id=2` for a ticket of tenant 1 | `404`, nothing read, **no** audit row |
| no `tenant_id` | `400` |
| a ticket id that belongs to an internal conversation | `404` |
| no platform session | `401` |
| a **tenant** user's cookie | `401` (does not open the platform door) |

Confirmed live.

### SUP-03 — Reply, live

`POST /api/admin/support/<ticketId>/messages?tenant_id=1` `{"content":"…"}` → `201`, `sender_type: "admin"`, audited (`support_reply`); the message carries the conversation's `tenant_id`; the admin becomes a member. The tenant admin's socket (a member of the thread) receives `new_message` live, and reads the whole thread through the normal tenant route. Another employee of the tenant who is not in the thread → `403`. A reply with the wrong `tenant_id` → `404`, no message, no audit row. Confirmed live.

### SUP-04 — The live room is audited too

A platform admin socket (`auth: { role: 'admin' }`) `join` `{conversation_id, tenant_id}` → `ok`, and an `audit_logs` row `support_join`. It cannot join an internal conversation, nor a support conversation with the wrong tenant (both `404`). Confirmed live.

---

## 7. Tenant isolation

`admin@verhelst.test`: `GET /api/conversations` → `total: 0`; `GET /:id`, `GET /:id/messages` of tenant A's internal or support conversation → `404`; `POST …/messages` and `POST …/members` → `404`; a socket `join` → `404`. No foreign message was written. All confirmed live. The e2e loop in `test/tenant-isolation.e2e-spec.ts` covers `conversations`, `conversation_members`, `messages` and `message_reads` automatically.
