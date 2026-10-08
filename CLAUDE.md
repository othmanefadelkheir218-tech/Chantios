# Rules

## Language
- Speak English at B2 level: simple words, clear sentences.
- Keep answers short.

## Docs
- Project documents are in `doc/`. Read them for context before big tasks.

## Start of every conversation
Before doing any work on this project, read these three, in this order:

1. `doc/notes/WhereIStop/state.md` — where the last session stopped and what comes next
2. `doc/notes/Phaces/00-START-HERE.md` — the build guide and the API conventions
3. `.instruction/code_structure.txt` — the module architecture every file must follow

Then read the step file named in `state.md`. Do not re-audit the whole `doc/` folder to find work — `state.md` is the entry point.

## Source of truth — in this order
1. `doc/notes/*.md` — the business rules. **Newest. If anything disagrees with a note, the note wins.**
2. `doc/Schema Proposal.md` — the DDL, generated from the notes. Single source for the database.
3. `doc/notes/Phaces/*.md` — how to build, step by step, in build order.
4. `.instruction/*.txt` — the code architecture. Non-negotiable.

`doc/notes/technical/*.md` is older reference. On **how to build**, `Phaces/` wins. On a **rule**, `doc/notes/*.md` wins.

## Open questions
The only two lists are the `⬜ To do` section of `doc/notes/A_progress-tracker.md` and the `Open questions` section of `doc/Schema Proposal.md`. They are kept in step.

When asked what is missing or unclear, answer from those two lists. Do not re-derive a fresh gap list — that produced a different answer every time and wasted several sessions. If something genuinely new is found, add it to both lists.

**Never invent an answer to an open question.** Ask, decide, write the decision into the matching note, then build.

## Writing code
- Follow `.instruction/code_structure.txt`: controller → service → handler → repository. Prisma only in a repository.
- One module = one repository file.
- A module never touches another module's repository — go through that module's service.
- A business rule is implemented once. Search before writing it again.
- `tenant_id` is never a route param, query param or body field. It comes from the JWT through `nestjs-cls`.

## Telegram notifications during multi-phase work
When working through a build with several phases/steps, each holding several tasks:
- Notify by Telegram **when starting a phase**.
- Notify by Telegram **when each task inside the phase finishes**.
- Notify by Telegram **when the whole phase finishes**.

How: write `{"message": "..."}` to `push.json` in the project root. A running `node telegram-bot.js` process (started from this project's root) watches that file and sends the message, then resets `push.json` back to `{}`. Wait a couple seconds and check that it reset — that confirms delivery.

If `push.json` does **not** reset after a few seconds, the bot's file-watcher has stalled (a known flakiness, not a config problem). Fix: stop the existing `telegram-bot.js` process and start a fresh one in the background, then retry the write. Don't keep retrying against a stalled instance.

### Reading the owner's replies from Telegram
When something is needed from the owner (a code, a token, "ok" on a check), ask on Telegram **and read the answer from Telegram** — the owner replies there, not always in the chat.
- Every Telegram message the owner sends is written by the bot to `inbox.json` in the project root: `{"chatId": ..., "message": "..."}`. Only the **last** message is kept.
- **Before asking the owner again, read `inbox.json`** — the answer may already be there.
- After reading, reply through `outbox.json`: write `{"status": "ready", "reply": "Got it: ..."}`. The bot sends it and blocks other messages until a reply comes (5 min timeout), so always answer.
- Then reset `inbox.json` to `{"status": "empty"}` so the next message is easy to spot.
- To wait for an answer, poll `inbox.json` in the background (e.g. a loop until `message` appears) instead of ending the turn.

## Git push at the end of each phase
When a phase/step is finished (build done, verified, docs updated, `state.md` updated): commit the changes with a clear, descriptive commit message and push to `main` on GitHub. Do this every time a phase finishes — no need to ask first, this is the standing instruction.

## End of every session
Update `doc/notes/WhereIStop/state.md`: current step, status, next action, and anything that broke.
