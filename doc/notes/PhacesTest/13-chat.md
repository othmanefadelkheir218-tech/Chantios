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
| CHAT-01 | Owner: `POST /api/conversations { type: "internal", member_user_ids: [manager, supervisor] }` | `201`, **3** members (creator added) | PASS |
| CHAT-02 | A B user; an unknown user; `type: "support"` / `"project_client"`; `member_user_ids: []`; unknown `project_id` | `400`, `400`, `400`, `400`, `404` | PASS |
| CHAT-03 | Member `GET /:id` → `200`; same-company non-member (sales) on `GET /:id`, `/messages`, `POST /messages`, `POST /read` → `403`; B → `404`; no login → `401` | as stated | PASS |
| CHAT-04 | `GET /api/conversations` as the owner | only conversations the owner is in | PASS |
| CHAT-05 | `POST /:id/members { user_id: leader }`; again; a B user | `201`; `409`; `400` | PASS |
| CHAT-06 | DB: `project_client` with no project; `support` with no ticket; a member with both `user_id` and `client_id`; a duplicate member; a duplicate read | all refused (5 constraints) | PASS |

## 2. Messages in real time

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-07 | `POST /:id/messages { content: "TEST hello" }` | `201`, `sender_type employee`, `tenant_id` = the conversation's | PASS |
| CHAT-08 | 5001 characters; empty; `tenant_id` or `sender_id` in the body | `400` each | PASS |
| CHAT-09 | `GET /:id/messages` | paginated, newest first | PASS |
| CHAT-10 | Manager and supervisor sockets `join`, the owner sends over HTTP | both get `new_message` (snake_case); a socket outside the room gets nothing | PASS |
| CHAT-11 | Socket with no token | disconnected at the handshake | PASS |
| CHAT-12 | `join` by a non-member → `{ ok: false, status: 403 }`; by B → `404`; no `conversation_id` → `400`; unknown → `404` | as stated | PASS |

## 3. Attachments

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-13 | Upload 2 images (`entity_type=message`, `entity_id=0`); a DOCX | `201`, `201`; `400` | PASS |
| CHAT-14 | Send with `media_ids: [a, b]` | `201`, 2 `attachments`; both rows now point at the message id; the socket event carries them | PASS |
| CHAT-15 | **[CHECK IMAGEKIT]** | the 2 images are under `tenant-<A>/message/` | waiting |
| CHAT-16 | Another user's pending file; an already attached file; the same id twice; a trashed file | `400` each, **no** message written | PASS |

## 4. Read tracking

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-17 | Owner sends 2, manager replies 1; manager `GET /unread-count` | `2` (own reply never unread) | PASS |
| CHAT-18 | Manager `POST /:id/read`; again | `marked 2, unread 0`; `marked 0`, still 2 rows; other sockets get `message_read` | PASS |
| CHAT-19 | 3 `POST /read` at the same moment | one row per message per reader | PASS |

## 5. Archive

| ID | Do | Expected | Result |
|---|---|---|---|
| CHAT-20 | `PATCH /:id/archive` | `is_archived true`; hidden by default, shown with `?archived=true`; rows kept; a new message → `400 This conversation is archived` | PASS |
| CHAT-21 | Any delete route for a conversation or a message | none exists (`404`) | PASS |

## 6. The platform admin support door (after phase 17 opens a ticket)

| ID | Do | Expected | Result |
|---|---|---|---|
| SUPC-01 | `GET /api/admin/support/<ticket>/messages?tenant_id=<A>` | `200`; an `audit_logs` row `support_read` each time | SKIP |
| SUPC-02 | `tenant_id=<B>`; no `tenant_id`; an internal conversation's id; no platform session; a tenant cookie | `404` (no audit row); `400`; `404`; `401`; `401` | SKIP |
| SUPC-03 | `POST` a reply | `201`, `sender_type admin`, `support_reply` audit row, the owner's socket gets it live | SKIP |
| SUPC-04 | Platform socket `join { conversation_id, tenant_id }` | `ok`, audit row `support_join`; an internal conversation → `404` | SKIP |

The project conversation (`project_client`) is created by the portal and tested in phase 14 (POR-03).

## 7. Isolation

| ID | Do | Expected | Result |
|---|---|---|---|
| ISO-CH-01 | B owner: `GET /api/conversations` → `total 0`; A's thread, its messages, send, add member, socket join → `404` | no foreign message written | PASS |

---

## Result — 2026-10-09

**21 PASS, 0 FAIL, 1 waiting** (CHAT-15, ImageKit check — asked on Telegram), **4 SKIP** (SUPC-01..04 wait for phase 17, which opens the ticket).

Data: conversation 1 (owner, manager, supervisor, leader; messages 1–3), 4 (manager + supervisor, no message), 5 (owner + manager, archived, 6 messages). Media 45 and 46 are attached to message 3; 47 (manager) and 48 (owner) are still pending; 49 is in the trash. Message 3 has the 2 attachments.

- CHAT-01: members `1,2,3`. CHAT-02: `400 400 400 400 400 404`. CHAT-03: sales `403` ×4, B `404` ×5, no login `401`. CHAT-05: `201`, `409`, `400`.
- CHAT-04: the owner sees only conversation 1 even though conversation 4 exists in the same company without them.
- CHAT-06: the 5 constraints refused (`chk_project_client_has_project`, `chk_support_has_ticket`, `chk_member_one_identity`, `uq_member_user`, `uq_read_user`).
- CHAT-10: the manager and supervisor sockets both got `new_message` with snake_case keys; the leader (connected, not joined) got nothing.
- CHAT-11: a socket with no token gets `error { status: 401 }` and is disconnected (my first check read "connected" because it looks at the moment of connect; re-checked 1.5 s later: `connected false`).
- CHAT-12: `403`, `404`, `400`, `404` as stated.
- CHAT-13: PNG ×2 `201` (`entity_id 0`); DOCX `400 … not allowed for message — allowed: application/pdf, image/jpeg, …`.
- CHAT-14: 2 attachments, both media rows now `entity_id 3`, the socket event carried 2 attachments. The files stay in the ImageKit folder `Chantios/tenant-1/message/0/` (the pending folder), not under the message id.
- CHAT-16: another user's pending file, an attached file, the same id twice, a trashed file → `400` each, message count unchanged.
- CHAT-17: the manager had 3 unread from conversation 1 from CHAT-07/10/14, so I cleared them with `POST /read` first and used a new conversation (5). Then manager unread `2`, owner unread `1` (own reply never unread).
- CHAT-18: `marked 2, unread 0`, then `marked 0`; 2 rows; the owner's socket got `message_read` for messages 8 and 9. CHAT-19: 3 simultaneous reads → `marked 3`, `0`, `0`; no duplicate row.
- CHAT-20: archived conversation hidden by default, listed with `?archived=true`, rows kept, new message `400 This conversation is archived`. CHAT-21: `404` on every delete path tried.
- ISO-CH-01: B's list `total 0`; A's conversation `404` on get, messages, send, add member, read, archive and socket join; no message written.
