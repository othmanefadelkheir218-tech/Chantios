# Step 11 — Chat & Conversations  *(phase 11)*

> Built **before** the portal, because generating a portal token auto-creates a `project_client` conversation.

## Goal

Three conversation types, read tracking, attachments through `media`, and real-time delivery over Socket.io.

## Decide first

**Decided 2026-10-06 — the platform admin's cross-tenant read is ONE explicit repository method.** It takes a `tenantId` argument and runs on the **unwrapped** Prisma client. It is called only from a handler behind `AdminAuthGuard`, and that handler always writes an `audit_logs` row. There is no general "disable the extension" flag. Written into [chat-conversations.md](../chat-conversations.md). Nothing blocking.

## Tables

DDL in [Schema Proposal.md](../../Schema%20Proposal.md) § 9.

| Table | Purpose |
|---|---|
| `conversations` | the thread container |
| `conversation_members` | one row per member, exactly one id column set |
| `messages` | `tenant_id` denormalised on purpose, for fast scoped filtering |
| `message_reads` | who read what |

### The 3 types

| Type | Who talks | Started by |
|---|---|---|
| `internal` | employees of one company | any employee |
| `project_client` | employees + the client | **auto**, when a portal link is generated (step 12) |
| `support` | tenant employees + ChantierOS staff | tenant `admin` only |

**Core rule:** a conversation always belongs to exactly **one** `tenant_id`. There is no way for two companies to share one. Support is "one tenant ↔ the platform", never "tenant ↔ tenant".

`project_id` is required when `type = 'project_client'`; `support_ticket_id` is required when `type = 'support'`. Both are DB check constraints. A partial unique index gives a project **at most one** client conversation, so regenerating a portal link reuses it rather than creating a second.

### Archive, never delete

Conversations and messages carry `is_archived`, never `is_active`. History must be kept for legal and audit reasons.

### Attachments

There is **no `attachments` column on `messages`.** Every attachment is a `media` row with `entity_type = 'message'` and `entity_id = messages.id` (step 03). Images and PDF only in chat.

## Modules to create

```
src/chat/
├── decorators/chat.swagger.ts
├── dto/create-conversation.dto.ts, send-message.dto.ts,
│       find-conversations-query.dto.ts, find-messages-query.dto.ts
├── entities/conversation.entity.ts, message.entity.ts
├── gateways/chat.gateway.ts              ← Socket.io, Redis adapter
├── handlers/create-conversation.handler.ts, find-conversations.handler.ts,
│            find-messages.handler.ts, send-message.handler.ts,
│            mark-read.handler.ts, unread-count.handler.ts,
│            archive-conversation.handler.ts, add-member.handler.ts,
│            ensure-project-conversation.handler.ts
├── helpers/chat-access.helper.ts         ← is this caller a member? one implementation
├── repositories/conversation.repository.ts, message.repository.ts, message-read.repository.ts
└── chat.service.ts / .controller.ts / .module.ts
```

`ensure-project-conversation.handler` is the find-or-create that step 12 calls. It must be idempotent — a regenerated portal link must not create a second thread.

## Routes

| Method | Path | Guard | Notes |
|---|---|---|---|
| `POST` | `/api/conversations` | `chat:create` | `internal` only from here |
| `GET` | `/api/conversations` | `chat:view` | `?type=&project_id=&archived=` |
| `GET` | `/api/conversations/:id` | `chat:view` | members included |
| `POST` | `/api/conversations/:id/members` | `chat:edit` | `internal` only |
| `PATCH` | `/api/conversations/:id/archive` | `chat:edit` | `is_archived = true` |
| `GET` | `/api/conversations/:id/messages` | `chat:view` | paginated, newest first |
| `POST` | `/api/conversations/:id/messages` | `chat:create` | `sender_type = 'employee'` |
| `POST` | `/api/conversations/:id/read` | `chat:view` | writes `message_reads` |
| `GET` | `/api/conversations/unread-count` | `chat:view` | per conversation |
| `POST` | `/api/admin/support/:ticketId/messages` | `AdminAuthGuard` | `sender_type = 'admin'`, **writes `audit_logs`** |
| `GET` | `/api/admin/support/:ticketId/messages` | `AdminAuthGuard` | the escape hatch above |

The client's portal messaging routes are step 12. They write `sender_type = 'client'` and identify the sender by `client_id` from the portal token — never a user account.

### WebSocket events

| Event | Direction | Payload |
|---|---|---|
| `join` | client → server | `conversation_id`, after an access check |
| `new_message` | server → room | the message |
| `message_read` | server → room | `message_id`, reader |

One Socket.io room per conversation. Use the **Redis adapter** so it still works with more than one API instance. The access check in `chat-access.helper.ts` runs on `join`, not only on the HTTP routes — an unchecked socket is a leak.

## DTOs

### `create-conversation.dto.ts`
`type` `@IsIn(['internal'])` — only internal is created from the API. `project_id` optional integer. `member_user_ids` array of integer, `@ArrayMinSize(1)`.

### `send-message.dto.ts`
`content` `@IsNotEmpty @MaxLength(5000)`. `media_ids` optional array of integer — already uploaded through step 03.

## Repository methods

```ts
// conversation.repository.ts
create(data, members, tx), findById(id), findMany(where, skip, take)
findByProject(projectId, type), setArchived(id, value), addMember(conversationId, member)
findMembers(conversationId)
isMember(conversationId, { userId?, clientId?, adminUserId? }): Promise<boolean>
findByTicketForAdmin(ticketId, tenantId)    // the escape hatch — unwrapped client + audit log

// message.repository.ts
create(data, tx), findMany(conversationId, skip, take), findById(id), setArchived(id, value)

// message-read.repository.ts
markRead(messageIds, reader, tx), countUnread(conversationId, reader)
```

## Handlers

| Handler | Rule it enforces |
|---|---|
| `create-conversation.handler` | `internal` only. Members must be active users of **this** tenant |
| `ensure-project-conversation.handler` | find-or-create for `(project_id, type='project_client')`. **Idempotent** — step 12 may call it repeatedly |
| `send-message.handler` | the caller must be a member. Sets `tenant_id` on the message. Links `media_ids` by setting their `entity_id`. Emits `new_message`, then queues notification + email (step 13) |
| `mark-read.handler` | one row per message per reader, first time only. Exactly one of `user_id` / `client_id` |
| `unread-count.handler` | messages in the conversation with **no** matching `message_reads` row for that reader |
| `archive-conversation.handler` | `is_archived = true`. **Never deletes** |
| admin support read | the escape hatch: unwrapped client, explicit `tenantId`, and an `audit_logs` row every time |

## Tasks

- [x] `chat` module, full shape
- [x] `chat-access.helper.ts` — membership check used by HTTP **and** the socket `join`
- [x] Socket.io gateway + the **Redis adapter**
- [x] `IoAdapter` registered in `main.ts` per `.instruction/main_file.txt`
- [x] `ensure-project-conversation` — idempotent, for step 12
- [x] `message_reads` + the unread count
- [x] Attachments through step 03's media, `entity_type = 'message'`, images + PDF only
- [x] Archive endpoints
- [x] The admin support escape hatch + its `audit_logs` write
- [x] `// TODO: step 13` at the new-message notification point
- [x] Decide the cross-tenant read question

## Acceptance

- [x] Create an internal conversation with 3 members → 3 `conversation_members` rows
- [x] Add a member from **another** tenant → refused
- [x] Send a message → row written, `tenant_id` set, `new_message` received by the other member's socket
- [x] A non-member calling `GET messages` → 403
- [x] A non-member sending `join` over the socket → refused
- [x] Attach 2 images → 2 `media` rows with `entity_type = 'message'`
- [x] Attach a .docx → rejected
- [x] Open the conversation → `message_reads` rows written once; opening again adds none
- [x] Unread count drops to 0 after reading
- [x] `ensure-project-conversation` called twice for one project → **one** conversation
- [x] `type = 'project_client'` with no `project_id` → rejected by the DB check
- [x] `type = 'support'` with no `support_ticket_id` → rejected
- [x] Archive → hidden from the default list, rows still present
- [x] A platform admin reads a support thread → works, **and** an `audit_logs` row exists
- [x] Tenant A cannot read tenant B's conversations or messages
- [x] Update `../WhereIStop/state.md`

## Notes to read

- [chat-conversations.md](../chat-conversations.md) — the 3 types, the isolation rule, `message_reads`
- [media-files.md](../media-files.md) — attachments
- [technical/phase-11-chat.md](../technical/phase-11-chat.md)
- [Schema Proposal.md](../../Schema%20Proposal.md) — § 9
