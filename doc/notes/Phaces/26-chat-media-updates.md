# Step 26 — Chat and media updates (4 small changes)

> Needs step 03 (media), step 11 (chat), step 24 (notes), step 25 (client email).
> Backend first, then frontend. Phases are ordered **easy → hard**. **A + B + C + D built 2026-10-20; live check by the owner still open.**

## 1. Goal

Four changes the owner asked for after the step 25 live tests:

| Phase | Change | Where |
|---|---|---|
| A | Project status badge in the email's project list | frontend only |
| B | Note files shown on `/media` to the note's owner and the tenant admin | backend + frontend |
| C | "Seen" ticks in the team chat (✓ sent, ✓✓ seen, "Vu par 2/5" in a group) | backend + frontend |
| D | Chat pages: fixed sections that scroll inside, the last 20 messages, "Charger plus", mobile | backend + frontend |

Worker login with name / password: **dropped by the owner** — not in this step.

## 2. Decide first

**Decided 2026-10-19 (owner).**

| # | Question | Answer |
|---|---|---|
| Q1 | Who sees note files on `/media`? | ✅ The note's owner **and the tenant admin**. The admin sees the **file only**, never the note itself (title, text, labels stay private — step 24 Q2 still holds) |
| Q2 | Status badge on the email's project list? | ✅ Yes — the statuses we already have. A cancelled project can still be chosen (rule unchanged) |
| Q3 | "Seen" in a group chat? | ✅ "Vu par 2/5" (readers / other members). In a 1-to-1: ✓ sent, ✓✓ seen |
| Q4 | Chat pages | ✅ Fixed height; topic list and messages scroll inside their own section; last 20 messages by default; "Charger plus" loads 20 older ones; works on mobile |
| Q5 | Worker login | ✅ Dropped — no change |

| Q6 | Where do the ticks show? | ✅ Only in the **team chat** between employees of the company (`/chat/[id]`, `/field/chat/[id]`). Not on client emails |
| Q7 | Ticks in the support chat (company ↔ platform team)? | ✅ No |
| Q8 | Who counts in "Vu par 2/5"? | ✅ Only **active** members who were in the group **when the message was sent**. A deactivated user never counts; a member added later does not count for older messages. The number never changes after sending |

Nothing left open.

## 3. Rule notes to update first

- [notes.md](../notes.md) — § Private: "note files are listed on `/media` for the owner and the tenant admin, file only, never the note".
- [chat-conversations.md](../chat-conversations.md) — § Read: ✓ / ✓✓ / "Vu par X/Y", who counts in Y.
- [client-email.md](../client-email.md) — project list shows the status badge; chat page paging (20 + load more).
- `A_progress-tracker.md` + `Schema Proposal.md` Open questions — add any question still open.

No migration expected in any phase.

## How to build — sessions (save tokens)

**No agents.** Each agent starts empty and reads the docs and the code again, so more agents = more tokens. Phases B, C, D touch the same chat / media code, so parallel agents would also clash.

**One new conversation per session, 3 sessions:**

| Session | Phases | Why |
|---|---|---|
| 1 | A + B (+ the rule notes of § 3) | both small |
| 2 | C | medium, alone |
| 3 | D | biggest, alone |

In each session:
1. Read only `WhereIStop/state.md`, this file, `.instruction/code_structure.txt`, and the files of that phase. Do not re-read the whole `doc/`.
2. Build, test, tick the tasks here.
3. Update `state.md` (what is done, what is next), so the next session starts fast.

---

## Phase A — Project status badge (easy)

**What we know:** the picker `app/[locale]/(tenant)/_components/client-chat/topics/TopicProjectSelect.tsx` already loads `useProjects(...)`; `/api/projects` already returns `status`. `components/shared/StatusBadge.tsx` already exists (used in `project-columns.tsx`).

Tasks:
- [x] A1 — `TopicProjectSelect.tsx`: show `<StatusBadge>` next to each project name (same colors as the projects list)
- [x] A2 — Same badge in `new-email/EmailProjectField.tsx` (new email dialog)
- [x] A3 — Check text width on mobile (long project name + badge)

Acceptance: each project in both pickers shows its status; a cancelled project shows "Annulé" and can still be chosen.

---

## Phase B — Note files on `/media` (easy → medium)

**What we know:** `src/media/helpers/media.helper.ts` → `PRIVATE_MEDIA_ENTITY_TYPES` + `NOT_PRIVATE_MEDIA` hide `note` (and `email_attachment`) files from every `/api/media` read (`media.repository.ts`).

Backend tasks:
- [x] B1 — Media list (`GET /api/media`): include `note` files when the caller is the **uploader** or the **tenant admin**. Other private types (`email_attachment`) stay hidden
- [x] B2 — `GET /api/media/:id` (file / download): same rule
- [x] B3 — A note file never carries note data: no title, no content, no `entity_id` link the admin can follow. `entity_type = note` is enough
- [x] B4 — `POST`/`DELETE` on `/api/media` with `entity_type = note` stay refused — notes manage their own images (`/api/notes/:id/images`)
- [x] B5 — Impersonation (platform admin as tenant): note files stay hidden (same as `/api/notes` → `403`)
- [x] B6 — Tests: owner sees own note file · admin sees it · manager B does not see manager A's file · `/api/notes/:id` still `404` for the admin

Frontend tasks:
- [x] B7 — `/media`: note files show with a "Note" type label; no "open the note" link for the admin; for the owner the link goes to `/notes`
- [x] B8 — Filter by type includes "Notes"; texts in `fr.json` only

Acceptance: as above (B6); the admin can view/download the image but every `/api/notes` route stays closed to them.

**Built 2026-10-20.** `media.helper.ts`: `NoteFileViewer`, `visibleMediaFilter`, `toVisibleMediaEntity` (note file → `entity_id = null`); `buildMediaFilter` takes the viewer, and an `entity_id` search never returns note files. `MediaRepository.findVisibleById`. `FindMediaHandler`: list + new `findVisible` (route `GET /:id`) read the role through `RolesService`; `findOne(id)` stays for internal callers (no note files). List DTO accepts `entity_type=note`; upload DTO unchanged (B4). Frontend: `MediaCard` "Note" badge, no checkbox on note files, "Ouvrir mes notes" link for the owner; filter "Notes". Phase A: `client-chat/ProjectOptionLabel.tsx` (name cut + badge) in both pickers.

---

## Phase C — "Seen" in the team chat (medium)

**What we know:** the backend already writes `message_reads` when a user opens a conversation (`mark-read.handler.ts` → `MessageReadRepository.markReadForUser`) and already sends the socket event `message_read` (`chat.gateway.ts` → `emitMessageRead`). What is missing is the **read info on each message** and the **UI**.

Backend tasks:
- [x] C1 — `GET /api/conversations/:id/messages`: on the caller's **own** messages, add `read_count` (readers who are not the sender) and `member_count` (members minus the sender). Counted in one query, not per message
- [x] C2 — Check that a message arriving while the reader has the chat open is marked read (the frontend calls mark-read again, or the socket does it) and that `message_read` is sent
- [x] C3 — `member_count` (Q8): only **active** members (deactivated users never count) who were in the group **when the message was sent** (`conversation_members.joined_at <= message.created_at`). A member added later does not count for older messages. `read_count` uses the same people
- [x] C4 — Tests: 1-to-1 (0 → 1 reader), group "2/5", own messages never counted, other tenant never counted

Frontend tasks:
- [x] C5 — Message bubble (own messages only): ✓ = sent, ✓✓ = seen by all (1-to-1: the other person). Group: "Vu par 2/5" under the last own message, or on hover/tap
- [x] C6 — Listen to `message_read` and update the count live (no reload)
- [x] C7 — Same in `/field/chat/[id]` (worker)
- [x] C8 — Texts in `fr.json`

Acceptance: user A sends, user B opens the chat → A sees ✓✓ without a reload; in a 6-person group, after 2 reads A sees "Vu par 2/5".

**Built 2026-10-20.** `helpers/read-receipt.helper.ts`: `hasReadReceipts` (type `internal` only) + `countReadReceipts` — the one Q8 rule (user members, not the sender, active, `joined_at <= created_at`; `read_count` = those people who read). `ReadReceiptsHandler.forMessages(conversation, messages)`: two queries per batch (`UsersService.findActiveWithRole` + `MessageReadRepository.findUserReads`). Used by `FindMessagesHandler` (own messages only), `SendMessageHandler` (the sent message) and `MarkReadHandler` (`message_read` now carries `read_count` / `member_count` in the team chat; `MessageRepository.findByIds`). C2: the frontend already calls mark-read on every `new_message` while the chat is open (`use-conversation-room.ts`). Frontend: `components/shared/chat/ReadTicks.tsx` (✓ / ✓✓, "Vu par X/Y" under the last own message, tooltip on the others), `use-read-receipts.ts` (patches the cached pages on `message_read`). `MessageList` is shared, so `/chat/[id]`, the chat dock and `/field/chat/[id]` all get it (C7). No migration. Note: a member removed from the group, or deactivated later, leaves Y (Q8: a deactivated user never counts).

---

## Phase D — Chat pages: scroll inside + load more + mobile (hard)

Pages: `/chat/clients/[id]` (client email: topic list + messages) and `/chat/[id]` (team chat). Also `/field/chat/[id]` and `/projects/[id]/chat` if they use the same parts.

**What we know:** messages are already paged newest first (`PaginationQueryDto`, default 20, max 100) on `/api/conversations/:id/messages` and `/api/client-chats/:id/topics/:topicId/messages`. The **topic list** comes inside `GET /api/client-chats/:id`, **not paged**.

Backend tasks:
- [x] D1 — Topic list paged: `GET /api/client-chats/:id/topics?page=&limit=` (newest activity first), or a `topics` page inside `GET /api/client-chats/:id`. Pick one, keep the response shape for the first 20
- [x] D2 — Tests for D1 (order, page 2, tenant isolation)

Frontend tasks:
- [x] D3 — Page layout: full height of the screen (`h-[100dvh]` minus the header); the page itself never scrolls; each section (`topics`, `messages`) has its own scroll
- [x] D4 — Messages: load the last 20, open at the bottom. "Charger plus" button at the top loads 20 older ones and **keeps the scroll position** (no jump)
- [x] D5 — Topic list: first 20, "Charger plus" at the bottom
- [x] D6 — New message (socket) adds at the bottom without reloading the list; scroll down only if the user was already at the bottom
- [x] D7 — Mobile (< `md`): one panel at a time — topic list → tap → messages with a back button; the composer stays fixed at the bottom (also with the phone keyboard open)
- [x] D8 — Same layout for `/chat/[id]` (conversation list + messages) and `/field/chat/[id]`
- [x] D9 — Texts in `fr.json` ("Charger plus", "Plus de messages")
- [ ] D10 — Check: 100+ messages, 30+ topics, phone width 375 px, desktop

Acceptance: with 60 messages, the page opens on the last 20, the page does not grow, "Charger plus" shows 20 more without a jump; with 30 topics, the list scrolls inside; on a phone, list and chat show one at a time.

**Built 2026-10-20.** D1 choice: **both** — `GET /api/client-chats/:id` keeps `topics` (first 20 email topics, newest activity first, + all portal chats, same shape) and adds `topics_total`; `?topic_id=` also returns that topic when it is older (a link from the project's Emails tab). New `GET /api/client-chats/:id/topics?page=&limit=` (email topics only, same shape) for page 2+. One place: `FindChatTopicsHandler.page` (`ConversationRepository.findTopicsPage`). D2: 4 tests (order + page 1, page 2 skip, other tenant / Gmail of someone else → `404`, older linked topic added, topic of another chat not). Frontend: chat pages listed in `lib/chat/full-height-routes.ts` → the shells use `h-dvh`, no footer, no page scroll. `use-thread-scroll.ts` (opens at the bottom, "Charger plus" keeps the position, new message scrolls only if already at the bottom, `overflow-anchor: none`). `MessageList` has its own scroll (page, dock, Field). Team chat: a new message (socket or my send) is put into the cached first page, no refetch (`lib/chat/message-pages.ts`: `withNewMessage`, `oldestFirst` removes the double an offset page brings, `forViewer` drops the sender's counts for the others). Email topics still refetch quietly (the email details come only from the API). `/chat/[id]`: conversation list on the left (desktop, `ConversationSideList`, "Charger plus"). `/chat/clients/[id]`: phone = list, or the topic (URL `?topic=`) with a back button. Viewport `interactive-widget=resizes-content` (Android keyboard shrinks the page, the composer stays visible). Messages page size 30 → 20. Texts `chat.loadMore`, `chat.noMore`. No migration.

---

## 4. End of step

- [x] Backend `tsc`, lint, jest pass; frontend `tsc`, lint pass
- [ ] Live check on port 5300 (owner runs the server)
- [x] Update `state.md` + both `state.md` files, tick tasks here
- [ ] Commit (ask the owner before pushing)
