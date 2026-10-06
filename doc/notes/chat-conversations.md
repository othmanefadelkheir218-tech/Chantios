# ChantierOS — Chat & Conversations

> Status: v1 (working draft). See [[business-logic-overview]] and [[client-portal]] for context.

## The 3 chat types

| Type | Who talks | Started by |
|---|---|---|
| `internal` | Employees only (same company) | Any employee |
| `project_client` | Employees + client | Auto-created when portal link is generated |
| `support` | Employees + ChantierOS admin | Tenant `admin` role only |

All conversations are **scoped by `tenant_id`** — a message can never cross companies.

---

## Core rule

> A conversation always belongs to exactly one `tenant_id`. There is no way for two different companies to share a conversation.

`super_admin` can read across tenants — for support only — and every such access is logged in `audit_logs`.

**How that read is built (decided 2026-10-06).** Conversations are a business table, so the Prisma tenant extension scopes every normal query to one tenant. The platform's read goes through **one explicit repository method** that takes a `tenantId` argument and runs on the **unwrapped** Prisma client. It is called only from a handler behind `AdminAuthGuard`, and that handler writes an `audit_logs` row on every call. There is no general "disable the extension" flag, anywhere — the bypass is one method that can be reviewed.

---

## 1. Internal chat

Team communication inside the company.

- Any employee can start a conversation
- Members are `users` only (same `tenant_id`)
- Not linked to any project — general purpose
- Or can be linked to a project for team discussion on that site

---

## 2. Project ↔ Client chat

Company staff and the client talk about one specific project.

- **Auto-created** when the company generates a portal link for a project
- Client joins via their `portal_token` — no login, no account needed
- Client is identified by `client_id`, not a user account
- Scoped to one project — client only sees messages for their project
- Company staff replies from the dashboard

---

## 3. Support chat

Tenant opens a ticket to the ChantierOS platform.

- Only the tenant `admin` role can open a support ticket
- Members: tenant `users` + `admin_users` (platform staff)
- Linked to a `support_ticket_id`
- Tenant only sees their own support conversations

---

## Tables

### `conversations`

| Field | Meaning |
|---|---|
| `tenant_id` | Which company (required) |
| `type` | `internal` / `project_client` / `support` |
| `project_id` | Required when type = `project_client` |
| `support_ticket_id` | Required when type = `support` |
| `is_archived` | `true` = hidden from the list. Never deleted |

### `conversation_members`

One row per member. Exactly one of these is set per row:

| Field | Who |
|---|---|
| `user_id` | A tenant employee |
| `client_id` | The client (portal only) |
| `admin_user_id` | ChantierOS platform staff (support only) |

### `messages`

| Field | Meaning |
|---|---|
| `conversation_id` | Which conversation |
| `tenant_id` | Denormalized — for fast tenant-scoped filtering |
| `sender_type` | `employee` / `client` / `admin` |
| `sender_id` | Points to the right table based on `sender_type` |
| `content` | Message text |
| `is_archived` | Messages are never deleted |

---

### `message_reads`

Who has read what. One row per message per reader — written the first time that person opens the conversation.

| Field | Meaning |
|---|---|
| `message_id` | Which message |
| `user_id` | Reader, when an employee — nullable |
| `client_id` | Reader, when the client in the portal — nullable |
| `read_at` | When |

The primary key is `id`. Uniqueness is `UNIQUE (message_id, user_id, client_id)`, plus a check that **exactly one** of `user_id` / `client_id` is set — one row cannot have two primary keys.

Unread count for a conversation = messages with no matching row for that reader.

## File attachments

There is **no `attachments` column on `messages`.** Every attachment is a `media` row with `entity_type = 'message'` and `entity_id = messages.id`. One mechanism for files in the whole app — see [[media-files]].

Allowed types in chat: **images + PDF only**.

---

## Archive, not delete

Conversations and messages are **never deleted** — only archived. Both carry `is_archived`; neither carries `is_active`. History must be kept for legal and audit reasons.

---

## Notifications

New message → notification + email to all members of that conversation. See [[alerts]] for full delivery rules.

---

## Related notes
- [[business-logic-overview]]
- [[client-portal]]
- [[alerts]]
- [[media-files]]
