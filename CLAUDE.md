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

## End of every session
Update `doc/notes/WhereIStop/state.md`: current step, status, next action, and anything that broke.
