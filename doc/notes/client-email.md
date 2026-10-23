# ChantierOS — Email with clients

> Decided by the owner 2026-10-18. Build: [Phaces/25-client-email.md](Phaces/25-client-email.md). Tests: [PhacesTest/19-client-email.md](PhacesTest/19-client-email.md). Production setup (Resend + Google): `NOTE/GOOGLE-GMAIL-SETUP.md`. AI on emails: on hold (`NOTE/AI-email-idea.md`).

## What it is

Company staff talk with **clients by email, from ChantierOS**. Emails and portal messages show **together in one chat per client** — on **our side only**.

We **never read** a mailbox. We receive only what is sent or forwarded to our address, and we send only what the user writes and clicks Send on.

## Mailboxes (inboxes)

| | Company address (default) | Personal Gmail | Own domain |
|---|---|---|---|
| Address | `company-x@mail.<our-domain>`, one per company | The user's own Gmail | e.g. `contact@companyx.be` |
| Receive | Clients write to it directly (Resend) | **Gmail forward** to the user's personal forward address (Resend) | Mailbox forward |
| Send | Resend, from the company address with the company name | Gmail API (`gmail.send` only), from the user's real Gmail | Resend, after DNS (SPF/DKIM) |
| Who reads it | **Shared inbox** — everyone with the `email` permission | **Only the owner** — not the admin either | — |
| Price | Free, always on, every plan | Billed per mailbox, like employees | — |
| Status | Built | Built | **Not built** — the design stays open for it |

**Each Gmail has its own forward address** (`company-x.<random>@mail.<our-domain>`). A forwarded email arrives with the client as sender; the forward address is the only way to know whose mailbox it came from, so a private email never lands in the shared inbox.

**Before a first Gmail connect, a warning:** a full forward brings **every** received email into ChantierOS, not only the clients' (they stay private to the owner). The advice shown: use a Gmail made for the company, or forward only the clients' emails with a Gmail filter. A reconnect shows no warning.

**Connecting a Gmail never turns off the company address.** Both stay active: the company address is the shared inbox of the team, the Gmail is private to its owner, and clients keep replying to the address they used.

**Outlook / Microsoft 365** mailboxes: later, not built.

## The two email permissions

Two separate rights, both set per role by the admin like every other module ([roles-permissions.md](roles-permissions.md)). Every plan.

| Right | What it allows | Default |
|---|---|---|
| **`email`** | Use email: read the shared inbox (company address), answer clients, send | admin, manager, sales `full` · others none · **worker never** |
| **`email_gmail`** ("Connecter un Gmail") | Connect (and reconnect) a **personal** Gmail — each mailbox is billed to the company | **admin only** · others none · **worker never** |

- An employee can answer clients from the company address (`email`) **without** being able to add a Gmail. The admin turns `email_gmail` on per role when he wants that role to connect its own Gmail.
- `email_gmail` is useful only together with `email` (the Gmail chats are read with `email`).
- Removing the right never removes a Gmail already connected: it stays (and stays billed) until it is removed.

## Who does what with a mailbox

| Action | Who |
|---|---|
| Choose who can connect | The admin, through the `email_gmail` permission per role |
| Connect a Gmail | A user with `email_gmail` (and `email`), **for their own Gmail only** (the owner must log in at Google). One user can connect several Gmails. **Never blocked** |
| Disconnect a mailbox | The owner (their own) **and** a user with `settings` edit (anyone's). Disconnecting never gives read access |
| Change the company address | A user with `settings` edit |

- **Company address:** the admin picks the name (`company-x`). It can change later; **the old address keeps working** so clients who still use it are not lost.
- **User deactivated** → their Gmail mailboxes are removed automatically (access revoked at Google, token wiped). Their private chats stay **locked**: nobody reads them.
- The Google refresh token is stored **encrypted** (AES-256-GCM, key in `.env`).

## Billing — like employees (D1)

- Each plan has the feature **`email_mailboxes`**: how many Gmail mailboxes are included + the price of each extra one, set by the super-admin per plan.
- At each renewal the app counts the Gmail mailboxes **not removed** and bills the extra ones ([subscription-plans.md](subscription-plans.md)).
- A **disconnected** mailbox still counts until it is removed.
- **No "buy" button**, connecting is never blocked. A plan without the key does not bill mailboxes.

## Who reads what

- **Company address:** everyone whose role has `email` view.
- **Personal Gmail:** **only the owner**, and only while the owner is active. Same privacy rule as private notes ([notes.md](notes.md)). Another user gets `404`, the admin too.
- The same rule applies to the HTTP routes **and** the live socket.

## Which emails come in

**All of them:** replies to our emails, new emails written to the company address, and emails forwarded from a personal Gmail.

Not saved as a message: **auto-replies** (holiday replies, `Auto-Submitted`, `X-Autoreply`, `Precedence: bulk / auto_reply`) and email to an **unknown address** (kept as an error event only). Also **our own emails coming back** (sender = the app's sender address, e.g. an alert forwarded by a personal Gmail): kept as an event only, never a message or an alert — otherwise each alert would create a new alert, in a loop.

The **Gmail forward confirmation** email (from `forwarding-noreply@google.com`) is not a message: its link is stored on the mailbox and shown to the owner, with an alert.

## One chat per client, with topics

```
💬 Eya Jarraya                                    ← ONE chat per client (per inbox)
 ├── 💬 Portal – Salle de bain        🏷️ Salle de bain Namur
 ├── 📧 "Devis salle de bain"          🏷️ Salle de bain Namur
 ├── 📧 "Question facture"             🏷️ Cuisine Liège
 └── 📧 "Re: Devis" (from eya@work.com ⚠️)
```

- **One chat per client in each inbox.** All emails with that client in that inbox land in it; the client's portal chats show in it too.
- **A topic** = one email thread (one subject), or the portal chat of one project.
- **Each topic has a project tag** (or "No project"). The tag is on the topic, not on the chat: one client can talk about several projects.

## The project tag — in this order

1. **Reply in an existing topic** → same tag.
2. **Topic started from a project** (staff click "New email" on the project page) → that project.
3. **Portal message** → the project of the portal link.
4. **The client opens a new email topic:**

   | The client has | What happens |
   |---|---|
   | 0 open projects, or unknown sender | No project, nothing to ask |
   | 1 open project | **Suggested** — "Link to <project>?" (the tag is set, marked suggested) |
   | 2+ open projects | No tag + the alert asks "Link it to a project?" |

5. **The tag can always be changed.** Shared inbox → a user with `email` edit **and** `projects` edit (admin and manager by default). Personal Gmail → the owner only. The project must belong to the chat's client. The project list (in the topic and in the New email dialog) shows each project's **status badge**; a cancelled project can still be chosen.

"Open project" = `prospect` or `in_progress`.

## Who is the client

- **Portal** → the client of the portal link.
- **Email** → the client whose email address matches (`clients.email` or one of its extra addresses), case-insensitive.
- A client can have **several email addresses**.
- **Reply from another address** (e.g. `eya@work.com`) → the thread tells us the topic, so it lands in Eya's chat, marked ⚠️ "New address for Eya — add it?". A new address is **never added automatically**; a user with `clients` edit confirms.
- **Unknown sender** → "Unknown contact" chat, with a **Create client** button (decided 2026-10-19): it opens the normal client form with the name and email already filled in; the user adds the phone (a client always needs one) and creates. Needs `clients` create. The chat then moves to that client. If the user changed the email in the form, the contact's address is kept as an extra address of the client.

## Replying — by the channel and address the client used

| The client wrote from | Our reply goes to | The client sees it in |
|---|---|---|
| `eya@gmail.com` | `eya@gmail.com` | Her Gmail |
| `eya@work.com` | `eya@work.com` | Her work mailbox |
| The portal | The portal | The portal |

- A reply in a topic goes to the address of the client's **last** email in that topic, from the **same inbox** as the topic.
- The client sees each channel separately. Only ChantierOS shows everything together.
- When Google access is gone, sending from that Gmail **stops with a clear message**. It is **never** sent from another address.

## How a client's reply finds its topic (D3)

Resend and Gmail both **replace** the email id (`Message-ID`) we set (tested 2026-10-18), and the send-only Gmail permission cannot read the id Gmail gives. So we never rely on the id of an email **we** sent. We do know the ids of the emails we **receive**.

- **Company address:** our emails carry a hidden reply address `reply-<token>@mail.<our-domain>`. The reply always lands in the right topic.
- **Personal Gmail:** no special reply address. The client's reply goes to the user's Gmail (they see it there too) and comes back by the forward. **Every email we start from a personal Gmail ends its subject with the topic code**: `Devis cuisine [#K7Q2M9]`. The client's reply keeps it. **Our replies keep the subject the thread already has**, because Gmail groups a conversation by subject too, and changing it splits the thread on the client's side:
  - a topic **the client** started has no code → our replies have **no** code (`Re: Devis cuisine`); the client's next reply finds the topic by `References` (step 2 below);
  - a topic **we** started has the code → **every** email in it keeps the code, our replies included (`Re: Devis cuisine [#K7Q2M9]`). We know it from the client's last email in the topic: it still carries our code.
- **Order — company address:** 1. the reply token · 2. the client's earlier emails in the thread (`References` / `In-Reply-To` match an email we received in this inbox) · 3. else a **new topic**.
- **Order — personal Gmail:** 1. the `[#code]` in the subject (a topic of this inbox) · 2. the client's earlier emails in the thread · 3. else a **new topic**.
- **No guessing by subject.**
- The code is in the email only, **never shown** in ChantierOS. The topic subject is stored without it, and without `Re:`, `Fwd:`, `TR:`, `AW:`, `Antw:`.
- A wrongly placed **received** email can be **moved** to another topic of the same chat (same right as setting the tag on that inbox).
- Our replies keep the thread on the client's side: `Re: <topic subject>` and `In-Reply-To` / `References` = the client's emails in this topic.

## Starting a conversation

- **Messages → New email**, or **project page → New email** (tagged with that project), or the client page.
- Type the address, subject, message → **Send**.
- **Send from:** the company address (default), or the user's own Gmail if connected and active.

## Where it shows

- **Messages page:** the client chats, with topics, 📧 / 💬, and "Link to project". The quoted old text of each email is cut off; the original is one click away. The page has a fixed height: the topic list and the messages each scroll in their own section. It opens on the **last 20 messages**; "Charger plus" loads 20 older ones. The topic list shows 20 topics, "Charger plus" for more. A search box at the top of the topic list filters by subject (any case); it searches all the topics of the client, not only the loaded ones. On a phone, one panel at a time (topics → messages, with a back button).
- **Project page:** an **Emails** tab with only the topics tagged with that project that the user may read.
- **Bell 🔔:** an alert `new_email` for every incoming email — company address → every active user whose role has `email` view; personal Gmail → the owner only.
  - Recipient **online** in the app (an open socket) → **in-app only**.
  - Recipient **not online** → **in-app + email**.
- Other alerts: `email_mailbox_disconnected` (to the owner + users with `settings` view, in-app + email), `email_forward_confirm` (to the owner).

## What we save

- The email **as it was**: original HTML + clean text + full text + subject, from, to, cc, `Message-ID`, `In-Reply-To`, `References`.
- **Attachments** and inline images → **media**, type **`email_attachment`** (D2):
  - Accepted: PDF, images (JPEG, PNG, WebP, GIF), Word, Excel, PowerPoint (doc, docx, xls, xlsx, ppt, pptx, odt, ods), ZIP, TXT, CSV — **up to 25 MB** each (Gmail's limit).
  - **Blocked** (dangerous): `.exe .bat .cmd .com .msi .scr .js .vbs .ps1 .jar .sh .apk` — checked by name **and** by type. Not saved; the message lists their name: "not saved for security". A file over 25 MB or of another type is listed the same way.
  - Staff attachments on an email we send use the same type and the same limits (max 10 files, 25 MB in total).
  - They count in the company's **storage**, like every file ([media-files.md](media-files.md)).
- **Kept**, no automatic delete.
- **GDPR:** when a client asks to delete their data, a user with `settings` delete (the admin) deletes that client's chat: topics, messages, email details, reads and files, with an audit row `gdpr_delete`. This is the only delete of messages in the app.

## Language

Emails we send **automatically** (alerts) follow the company language, like our other emails. What a user writes by hand is sent as written.

## Security

- The Google `state` carries the tenant and the user, **signed**, valid 10 minutes. The callback refuses when "Send email on your behalf" was not granted.
- The Resend webhook checks the signature (`400` if wrong) and is idempotent on the Resend email id.
- Reply tokens and forward addresses are long and random.

## Related notes
- [[chat-conversations]]
- [[client-portal]]
- [[alerts]]
- [[subscription-plans]]
- [[media-files]]
- [[roles-permissions]]
