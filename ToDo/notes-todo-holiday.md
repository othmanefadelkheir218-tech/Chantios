# To do — notes, todo and holidays

Ideas kept for later. Not built. Decide before building.

## Notes (like Google Keep) — next to build

Good idea. It is cheap to build and users understand it right away.

- **UI:** a "Take a note…" bar, a card grid, colors, pin, archive, labels, search. Checklist notes and images too.
- **Editor:** Tiptap is a good choice. It is light and fits React. Save the content as JSON, plus a plain-text copy for search.
- **The real value:** Google Keep already exists. What makes ours better is linking a note to a project or client ("note for chantier X").
- **Decided:** rules are now in `doc/notes/notes.md` (permission per role, private notes, worker too).

## Later

- **Todo page.** Tasks for the user. A task can have a reminder, only if the user turns it on for that task.
- **Holiday page.** Its own feature, with its own logic. Not part of the todo or the notes.
