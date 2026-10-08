# Phase 13 — Chat & Conversations

> Read [00-START-HERE.md](00-START-HERE.md) first. Rules: [chat-conversations.md](../chat-conversations.md).
> Old reference: [../test/15-chat.md](../test/15-chat.md).

## Goal

Internal conversations, membership checked on HTTP **and** on the socket, real-time delivery, attachments through `media`, read tracking, and the audited platform-admin door into support threads.

## Before you start

- Sockets: `ws://localhost:5300`, path `/socket.io`, a small `socket.io-client` script in the scratchpad. A tenant socket sends its `access_token`; a platform socket sends `auth: { role: 'admin' }` + `admin_access_token`.
- A `new_message` also emails members who are offline (phase 15 checks the emails).
- Support threads are created by tickets in phase 17. Section 6 runs **after** phase 17 opens a ticket.

---

## 1. Conversations

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-01 | Owner: `POST /api/conversations { type: "internal", member_user_ids: [manager, supervisor] }` | `201`, **3** members (creator added) | todo |
| CHAT-02 | A B user; an unknown user; `type: "support"` / `"project_client"`; `member_user_ids: []`; unknown `project_id` | `400`, `400`, `400`, `400`, `404` | todo |
| CHAT-03 | Member `GET /:id` → `200`; same-company non-member (sales) on `GET /:id`, `/messages`, `POST /messages`, `POST /read` → `403`; B → `404`; no login → `401` | as stated | todo |
| CHAT-04 | `GET /api/conversations` as the owner | only conversations the owner is in | todo |
| CHAT-05 | `POST /:id/members { user_id: leader }`; again; a B user | `201`; `409`; `400` | todo |
| CHAT-06 | DB: `project_client` with no project; `support` with no ticket; a member with both `user_id` and `client_id`; a duplicate member; a duplicate read | all refused (5 constraints) | todo |

## 2. Messages in real time

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-07 | `POST /:id/messages { content: "TEST hello" }` | `201`, `sender_type employee`, `tenant_id` = the conversation's | todo |
| CHAT-08 | 5001 characters; empty; `tenant_id` or `sender_id` in the body | `400` each | todo |
| CHAT-09 | `GET /:id/messages` | paginated, newest first | todo |
| CHAT-10 | Manager and supervisor sockets `join`, the owner sends over HTTP | both get `new_message` (snake_case); a socket outside the room gets nothing | todo |
| CHAT-11 | Socket with no token | disconnected at the handshake | todo |
| CHAT-12 | `join` by a non-member → `{ ok: false, status: 403 }`; by B → `404`; no `conversation_id` → `400`; unknown → `404` | as stated | todo |

## 3. Attachments

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-13 | Upload 2 images (`entity_type=message`, `entity_id=0`); a DOCX | `201`, `201`; `400` | todo |
| CHAT-14 | Send with `media_ids: [a, b]` | `201`, 2 `attachments`; both rows now point at the message id; the socket event carries them | todo |
| CHAT-15 | **[CHECK IMAGEKIT]** | the 2 images are under `tenant-<A>/message/` | todo |
| CHAT-16 | Another user's pending file; an already attached file; the same id twice; a trashed file | `400` each, **no** message written | todo |

## 4. Read tracking

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-17 | Owner sends 2, manager replies 1; manager `GET /unread-count` | `2` (own reply never unread) | todo |
| CHAT-18 | Manager `POST /:id/read`; again | `marked 2, unread 0`; `marked 0`, still 2 rows; other sockets get `message_read` | todo |
| CHAT-19 | 3 `POST /read` at the same moment | one row per message per reader | todo |

## 5. Archive

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-20 | `PATCH /:id/archive` | `is_archived true`; hidden by default, shown with `?archived=true`; rows kept; a new message → `400 This conversation is archived` | todo |
| CHAT-21 | Any delete route for a conversation or a message | none exists (`404`) | todo |

## 6. The platform admin support door (after phase 17 opens a ticket)

| ID | Do | Expected | Result |
|---|---|---|---|
| SUPC-01 | `GET /api/admin/support/<ticket>/messages?tenant_id=<A>` | `200`; an `audit_logs` row `support_read` each time | todo |
| SUPC-02 | `tenant_id=<B>`; no `tenant_id`; an internal conversation's id; no platform session; a tenant cookie | `404` (no audit row); `400`; `404`; `401`; `401` | todo |
| SUPC-03 | `POST` a reply | `201`, `sender_type admin`, `support_reply` audit row, the owner's socket gets it live | todo |
| SUPC-04 | Platform socket `join { conversation_id, tenant_id }` | `ok`, audit row `support_join`; an internal conversation → `404` | todo |

The project conversation (`project_client`) is created by the portal and tested in phase 14 (POR-03).

## 7. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-CH-01 | B owner: `GET /api/conversations` → `total 0`; A's thread, its messages, send, add member, socket join → `404` | no foreign message written | todo |
