# Phase 19 — Email with clients

> Read [00-START-HERE.md](00-START-HERE.md) first. Build: [../Phaces/25-client-email.md](../Phaces/25-client-email.md). Rules: [NOTE/EMAIL-CONNECTIONS-PLAN.md](../../../NOTE/EMAIL-CONNECTIONS-PLAN.md) (or `doc/notes/client-email.md` once step 25 task A1 is done).
>
> **Status: todo** — run after step 25 is built.

## Goal

Prove every rule of email with clients: the company address (shared inbox), a personal Gmail (private inbox), one chat per client with project-tagged topics, replies in the same thread, alerts, access, disconnection and GDPR delete.

## Before you start

| Thing | Value |
|---|---|
| API | `http://localhost:5300/api` — **the owner starts it**, never the test runner |
| Public URL | ngrok on port 5300 (`ngrok http 127.0.0.1:5300`). The free URL changes at each restart → update the Resend webhook |
| Resend | Domain `mail.<domain>` verified (send + receive). Webhook `email.received` → `<ngrok>/api/webhooks/resend-inbound`. Secret in `RESEND_WEBHOOK_SECRET` |
| Google | Project in **Testing**, scope `gmail.send`, test users = the Gmail accounts below. Redirect URI = `GOOGLE_REDIRECT_URI` |
| Env | `EMAIL_TOKEN_ENCRYPTION_KEY`, `INBOUND_EMAIL_DOMAIN` set |
| Database | `docker exec chantieros_postgres psql -U chantieros -d chantieros` |

### The people (company A)

| Who | Email | Role | In this phase |
|---|---|---|---|
| Owner | `othmanefadelkheir218@gmail.com` | admin | Shared inbox, admin actions. **Also connects this Gmail** (personal inbox) |
| Manager | `zakariyazouazou@gmail.com` | manager | Shared inbox, tags |
| Sales | `zakariyazouazou+sales@gmail.com` | sales | Has `email` by default |
| Accountant | `zakariyazouazou+accountant@gmail.com` | accountant | **No** `email` → must be refused |
| Worker | `winucardit@gmail.com` | worker | **Never** `email` |
| Client of A | `gryehirir@gmail.com` | client with 2 projects | Known client |
| Unknown contact | `eyajarraya771@gmail.com` | not a client | Unknown sender, then "Create client" |
| Company B owner | `industrytechnology198@gmail.com` | admin of B | Isolation |

Before section 3: client `gryehirir@gmail.com` has **2 open projects** (`TEST Salle de bain`, `TEST Cuisine`). Create the second one if missing. Every record created starts with `TEST`.

### The "you check" tags (same as the other phases)

**[CHECK EMAIL]** open the inbox, find the email · **[SEND EMAIL]** send the email described from the named inbox · **[REPLY]** click Reply in the named inbox on the named email · **[GMAIL SETTING]** do the step in Gmail settings · **[CHECK SCREEN]** look at the frontend page.

---

## 1. Setup and permission

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-01 | `GET /api/roles/permissions` as the owner | `email` module listed; defaults admin/manager/sales full, others none, worker none; 7 roles × 20 modules | todo |
| EML-02 | Owner `PATCH /api/email-inboxes/company { local_part: "test-alpha" }` | `200`, address `test-alpha@mail.<domain>`, `is_primary true` | todo |
| EML-03 | Same as B owner `{ local_part: "test-alpha" }`; `"reply-x"`; `"A B"`; `"ab"` | `409`; `400`; `400`; `400` | todo |
| EML-04 | Manager `PATCH /api/email-inboxes/company` (no `settings` edit) | `403` | todo |
| EML-05 | Accountant and worker: `GET /api/email-inboxes`, `GET /api/client-chats` | `403` each | todo |
| EML-06 | `GET /api/email-inboxes` as sales | `200`, company inbox, no Gmail inbox yet | todo |

## 2. Webhook security

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-07 | `POST /api/webhooks/resend-inbound` with no svix headers; with a wrong signature | `400`, `400`, no row in `inbound_email_events` | todo |
| EML-08 | Resend dashboard → webhook → **Resend** the same delivery twice (after EML-10) | `200` both times, **one** event row, **one** message | todo |

## 3. Company inbox — receive

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-09 | **[SEND EMAIL]** from `gryehirir@gmail.com` to `test-alpha@mail.<domain>`, subject `TEST Question carrelage`, text "Bonjour, quelle couleur ?" + a small JPEG | Log `process-inbound-email` done. One `client` conversation (inbox = company, `client_id` = the client), **one topic** `TEST Question carrelage` | todo |
| EML-10 | `GET /api/client-chats` as owner, manager, sales | the chat is listed for all 3 (shared inbox), unread 1 | todo |
| EML-11 | `GET /api/client-chats/:id/topics/:topicId/messages` | `content` = clean text only, `email.html` present, 1 attachment (the JPEG, `media.entity_type = message`) | todo |
| EML-12 | Topic tag (client has **2** open projects) | `project_id null`, alert `new_email` payload `needs_project: true` | todo |
| EML-13 | DB `notifications` | one `new_email` row for owner, manager, sales — none for accountant / worker | todo |
| EML-14 | **[CHECK EMAIL]** alert email: owner has the app **closed** (no socket) → gets it; manager keeps a tab open (socket connected) → **no** email, in-app only | as stated | todo |
| EML-15 | **[SEND EMAIL]** from `gryehirir@gmail.com`, attachments: a `.docx` and a 12 MB PDF | Message saved; `email.skipped_attachments` lists both with a reason; nothing in media for them (D2) | todo |
| EML-16 | Auto-reply: **[SEND EMAIL]** from an inbox with a holiday auto-reply on, or send with header `Auto-Submitted: auto-replied` (Resend send script) | event processed, **no** message, **no** alert | todo |
| EML-17 | **[SEND EMAIL]** to `nobody-xyz@mail.<domain>` | event row `error` "unknown address", no message anywhere | todo |

## 4. Company inbox — send and thread

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-18 | Manager `POST /api/client-chats/topics/:topicId/reply { content: "TEST Blanc ou gris ?" }` | `201`; message `direction outbound`, `transport resend` | todo |
| EML-19 | **[CHECK EMAIL]** `gryehirir@gmail.com` | From **"TEST Alpha Renovation"** `<test-alpha@mail.<domain>>`, in the **same Gmail thread**, Reply-To `reply-…@mail.<domain>` | todo |
| EML-20 | **[REPLY]** from `gryehirir@gmail.com` on that email: "Gris merci" | lands in the **same topic**, quoted text cut off, `content` = "Gris merci" | todo |
| EML-21 | Owner on the project page context: `POST /api/client-chats/emails { to: "gryehirir@gmail.com", subject: "TEST Devis cuisine", content: "…", project_id: <Cuisine> }` | `201`, **new topic** in the **same client chat**, tagged `TEST Cuisine` | todo |
| EML-22 | **[REPLY]** to EML-21's email | same topic, tag `TEST Cuisine` kept (no `needs_project`) | todo |
| EML-23 | **[SEND EMAIL]** from a second address of the client (e.g. `gryehirir+work@gmail.com`) as **Reply** on EML-21's thread | same topic; message flagged `new_address`; **no** `client_emails` row yet | todo |
| EML-24 | `POST /api/client-chats/:id/add-address { email: "gryehirir+work@gmail.com" }` | `201`, `client_emails` row; a **new** email from that address now matches the client | todo |
| EML-25 | Reply in EML-23's topic | goes to `gryehirir+work@gmail.com` (the client's **last** address in that topic) | todo |

## 5. Project tags

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-26 | Manager `PATCH /api/client-chats/topics/<EML-09 topic>/project { project_id: <Salle de bain> }` | `200`, tag set, `project_suggested false` | todo |
| EML-27 | Sales same call (no `projects` edit) | `403` | todo |
| EML-28 | `project_id` of another client's project; of company B | `400`; `404` | todo |
| EML-29 | Archive `TEST Cuisine` (client now has **1** open project). **[SEND EMAIL]** new subject from the client | new topic **suggested** `TEST Salle de bain`, `project_suggested true`, `needs_project false` | todo |
| EML-30 | `GET /api/projects/<Salle de bain>/email-topics` | EML-09 and EML-29 topics only | todo |
| EML-31 | `GET /api/client-chats/:id` | topics = the email topics **plus** the client's portal conversation(s) as 💬 (if a portal link exists) | todo |

## 6. Unknown contact

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-32 | **[SEND EMAIL]** from `eyajarraya771@gmail.com` to the company address | `client` conversation with `client_id null`, `contact_email` set, `sender_type contact`; listed with `?unknown=true` | todo |
| EML-33 | `POST /api/client-chats/:id/create-client` as manager | `201` client `TEST`-named from the email; the conversation now has `client_id`; a new email from Eya lands in it | todo |
| EML-34 | Same as accountant | `403` | todo |

## 7. Personal Gmail inbox

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-35 | Owner `POST /api/email-inboxes/gmail/connect` → open `url`, log in as `othmanefadelkheir218@gmail.com`, **leave the send box unchecked** | callback redirects with `?gmail=error`, no inbox row | todo |
| EML-36 | Again, **check the box** | redirect `?gmail=connected`; inbox `kind gmail`, `status active`; `refresh_token_encrypted` is **not** readable text in the DB; forward address `test-alpha.<random>` | todo |
| EML-37 | **[GMAIL SETTING]** in that Gmail: Forwarding → add the forward address | Gmail's confirmation arrives: inbox `forward_confirm_url` set, owner alert `email_forward_confirm` → open the link → confirm. Then turn forwarding on | todo |
| EML-38 | **[SEND EMAIL]** from `eyajarraya771@gmail.com` to `othmanefadelkheir218@gmail.com` | forwarded → a chat in the **owner's Gmail inbox**; alert to the owner **only** | todo |
| EML-39 | Manager and sales: `GET /api/client-chats` | the Gmail chat is **not** listed; `GET /:id` → `404`; socket `join` → `404` | todo |
| EML-40 | Owner replies in that topic | `transport gmail`; **[CHECK EMAIL]** Eya gets it **from `othmanefadelkheir218@gmail.com`**, same thread; it is in the owner's Gmail **Sent** | todo |
| EML-41 | **[REPLY]** from Eya | back through the forward into the **same topic** | todo |
| EML-42 | Owner sets the tag on this topic; manager tries | `200`; `404` | todo |
| EML-43 | `GET /api/email-inboxes` as owner (admin) | sees all Gmail inboxes of the company with status, no content | todo |

## 8. Disconnection

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-44 | Revoke at Google: myaccount.google.com → Security → Third-party apps → ChantierOS → remove. Then owner replies in the Gmail topic | `409` "Your Gmail is disconnected"; inbox `disconnected`; alert `email_mailbox_disconnected` (in-app + **[CHECK EMAIL]**); **nothing sent** from the company address | todo |
| EML-45 | Reconnect (EML-36 again) | same inbox back to `active`, old chats readable again | todo |
| EML-46 | Connect sales' Gmail (`zakariyazouazou+sales@gmail.com` must be a Google test user, or use another test Gmail). Owner `DELETE /api/users/<sales>` | sales' Gmail inbox `removed`, token wiped; their chats readable by nobody (owner `404`) | todo |
| EML-47 | Manager `DELETE /api/email-inboxes/<owner's Gmail>` | `403`; owner (admin) deleting another user's inbox → `200` | todo |

## 9. GDPR delete, isolation, billing

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-48 | Manager `DELETE /api/client-chats/<Eya chat>` | `403` | todo |
| EML-49 | Owner same | `200`; conversation, topics, messages, `message_emails`, reads and media gone (DB + **[CHECK IMAGEKIT]**); one `audit_logs` row `gdpr_delete` | todo |
| EML-50 | B owner: `GET /api/client-chats` → `total 0`; A's chat, topic messages, reply, tag, delete → `404` | no foreign row written | todo |
| EML-51 | Body with `tenant_id` on `POST /api/client-chats/emails` | `400` | todo |
| EML-52 | **(only if D1 = feature key)** super-admin plan version with `email_mailboxes` 1 / `5.00`; company has 2 Gmail inboxes not removed → run renewal (`POST /api/admin/billing/run-renewal/:tenantId`) | snapshot `email_mailboxes` actual 2, overage `5.00`; connecting the 2nd Gmail was **not** blocked | todo |

## 10. Frontend (owner, in the browser)

| ID | Do | Expected | Result |
|---|---|---|---|
| EML-UI-01 | **[CHECK SCREEN]** `/fr/settings/email` as owner | company address + change, "Connecter mon Gmail", forward address with copy button and the Gmail steps, list of mailboxes with status | todo |
| EML-UI-02 | `/fr/chat` → tab **Clients** | chats with 📧/💬, unread badge, "Contact inconnu" for Eya before EML-33 | todo |
| EML-UI-03 | Open the client chat | topics column (subject, tag, "À lier", ⚠️ new address); thread with the original email (style) and the clean text switch; attachments with preview | todo |
| EML-UI-04 | "Nouvel email" on the client page and on a project page | send-from choice (company / my Gmail); project pre-filled on the project page | todo |
| EML-UI-05 | Project → tab **Emails** | only that project's topics | todo |
| EML-UI-06 | Bell | `new_email` with the right icon and text; click opens the chat on the topic | todo |
| EML-UI-07 | Log in as accountant and worker | no Clients tab, no Emails tab, no Settings → Email | todo |
| EML-UI-08 | Settings → Roles | row "Email" (label from `fr.json`) | todo |

---

## Result

Not run yet.
