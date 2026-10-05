# Phase 11 — Chat & Conversations

> Depends on Phase 02 (users send messages), Phase 03 (project conversations), Phase 10 (portal triggers client chat).

## Tables

- `conversations` — a thread container
- `conversation_members` — who is in a conversation
- `messages` — one row per message
- `message_reads` — who has read which message

## Key relations

```
projects ──── conversations ──── messages ──── media (attachments)
users   ──── conversation_members
clients ──── conversation_members (for project_client type)
```

## Conversation types

| Type | Created by | Who is in it |
|---|---|---|
| `internal` | Any team member | Team only — client never sees |
| `project_client` | Auto (when portal token generated) | Team + client |
| `support` | Admin | Platform admin + tenant admin |

### Auto-creation rule
Portal token generated → `project_client` conversation created automatically (one per project).

## Key rules

### No deletion
- Conversations are archived only (`is_archived = true`) — there is no `is_active` on chat tables
- Messages are never deleted, only archived (`messages.is_archived`)

### Attachments
- There is **no `attachments` column on `messages`**
- Every attachment is a `media` row with `entity_type = 'message'` and `entity_id = messages.id`
- One mechanism for files in the whole app — images and PDF only in chat

### Real-time
- New message → Socket.io pushes to all participants
- New message also sends email notification (if participant is offline)

### Read/unread tracking
- A `message_reads` table: `message_id` + (`user_id` **or** `client_id`) + `read_at`
- Primary key is `id`, with `UNIQUE (message_id, user_id, client_id)` and a check that exactly one reader column is set
- One row written the first time that person opens the conversation
- Unread count = messages in the conversation with no matching row for that reader
- The client in the portal is tracked by `client_id`, since they have no user account

## What to build

- `conversations` CRUD
- `messages` CRUD + attachments through `media`
- `message_reads` writer + unread count query
- Auto-create `project_client` conversation when portal token is generated
- Socket.io event: `new_message` → push to room
- Email notification for new messages (via Resend)
- Archive conversation (sets `is_archived = true`)

## Dependencies

- Phase 02 (users)
- Phase 09 (media for attachments)
- Socket.io, Resend

Build this **before** Phase 10 — generating a portal token auto-creates the `project_client` conversation, so the chat must already exist.

## See also
- [[chat-conversations]]
- [[client-portal]]
- [[alerts]]
