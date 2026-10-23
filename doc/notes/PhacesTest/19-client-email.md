# Phase 19 — Email with clients (test plan)

> Rules: [../client-email.md](../client-email.md). Build: [../Phaces/25-client-email.md](../Phaces/25-client-email.md). **Status:** in progress. Company used: **"Eya Jarraya"** (the only company left after the reset of 2026-10-19).

## How to use this file

Each test says:

- **Who** — the person who does the action, and from which mailbox or account
- **Do** — what to click or what email to send
- **Look** — where to check
- **You should see** — what is correct

When the test is correct, tick the box: `- [ ]` → `- [x]`. If not, leave it open and write what you saw under it.

🤖 = a technical check (the API or the database). You don't do it: ask Claude, "run test 1.3".

---

## The cast

### Company A — "Eya Jarraya"

| Name in this file | Logs in with | Role |
| --- | --- | --- |
| **Eya** | `eyajarraya771@gmail.com` | boss (admin) |
| **Manager** | `manager_eyajarraya771@gmail.com` | manager |
| **Sales** | `sales_eyajarraya771@gmail.com` | sales |
| **Accountant** | `accountant_eyajarraya771@gmail.com` | accountant (no email right) |
| **Ahmed** | his login code, on the phone | worker (never email) |

The Manager, Sales and Accountant emails are not real mailboxes: emails sent **to** them never arrive. Logging in works.

### Company A's two mailboxes

| Mailbox | Address | Who reads it in the app |
| --- | --- | --- |
| **Company address** | `jarraya@mail.zouadev.com` | Eya, Manager, Sales (shared) |
| **Eya's Gmail** | `eyajarraya771@gmail.com` | **Eya only** (private) |

Both work at the same time.

### Outside people

| Name in this file | Email | Who they are |
| --- | --- | --- |
| **Othmane** | `othmanefadelkheir218@gmail.com` | a client of Eya (client "othmane"), 2 open projects: **"Rénovation complète salle de bain parentale"** and **"TEST Cuisine"** |
| **Othmane (work)** | `othmanefadelkheir218+work@gmail.com` | Othmane's second address. Gmail delivers it to Othmane's normal inbox |
| **Winu** | `winucardit@gmail.com` | a stranger, not a client |
| **Zakariya** | `zakariyazouazou@gmail.com` | boss of **another** company ("hubchoose") |

---

## 0. Before the tests

Every time, before you test:

- [ ] 

- \[ \]
- \[ \]
- \[ \]
- \[ \]
- \[ \]
- \[ \]
- The API runs in your terminal (port 5300)
- ngrok runs on port 5300, and the Resend webhook points to the ngrok address
- You are logged in on the website as the person the test names

- [x] **0.1 — Delete the old test chats** — done 2026-10-19 (4 chats deleted)

- [x] **0.2 — Create the client "othmane"** with `othmanefadelkheir218@gmail.com`

- [x] **0.3 — Create his 2 projects** (prospect or in progress)

- [x] **0.4 — Create Manager, Sales, Accountant, and company B for Zakariya**

---

## 1. Who can use email

- [x] **1.1 — The "Email" right exists**

  - Who: Eya
  - Do: menu **Paramètres → Rôles**
  - You should see: a row **Email**. Admin, Manager, Sales = full. Accountant and Worker = no access
  - *Done 2026-10-18*

- [x] **1.2 — The company address is set**

  - Who: Eya
  - Do: **Paramètres → Email**
  - You should see: **Adresse de l'entreprise** = `jarraya@mail.zouadev.com`
  - *Done 2026-10-19*

- [x] **1.3 — Another company cannot take the same address**

  - Who: Zakariya (company B)
  - Do: **Paramètres → Email** → in "Nom de l'adresse" type `jarraya` → **Choisir**. Then try `Jarraya` (capital J)
  - You should see: the error "Cette adresse est déjà prise." both times

- [x] **1.4 — A bad address name is refused**

  - Who: Zakariya
  - Do: same place, try `ab` (too short), then `a b` (a space), then `reply-test` (reserved word)
  - You should see: "Adresse non valide." each time

- [x] **1.5 — The Manager cannot change the company address**

  - Who: Manager
  - Do: open **Paramètres**
  - You should see: no **Email** settings page, or no **Changer** button

- [x] **1.6 — The Accountant and Ahmed have no email**

  - Who: Accountant, then Ahmed on the phone
  - Do: open **Messages**
  - You should see: no **Clients** tab, and no **Paramètres → Email**

- [x] **1.7 — Sales sees the company address but not Eya's Gmail**

  - Who: Sales
  - Do: **Paramètres → Email**, then **Messages → Clients**
  - You should see: the company address. **Nothing** from Eya's Gmail

- [ ] **1.8 — Only the admin can connect a Gmail by default** _(new 2026-10-19)_
  - Who: Manager, then Sales
  - Do: **Paramètres → Email**
  - You should see: **no** "Mon Gmail" card and **no** "Connecter mon Gmail" button. They still see the company address, and still answer clients in **Messages → Clients**
  - And: Eya (admin) still sees **Connecter un autre Gmail**

- [ ] **1.9 — The admin gives the right to a role**
  - Who: Eya
  - Do: **Paramètres → Rôles** → role **Manager** → row **Connecter un Gmail** → turn it on
  - Then: the Manager reloads **Paramètres → Email**
  - You should see: the "Mon Gmail" card with **Connecter mon Gmail**. Turn it off again after the test → the button is gone

- [ ] **1.10 — The worker can never get it**
  - Who: Eya
  - Do: **Paramètres → Rôles** → role **Worker** → try to turn on **Connecter un Gmail**
  - You should see: refused

## 2. Security of the incoming door

- [x] **2.1 — 🤖 A fake email call is refused** — *done 2026-10-18*

- [x] **2.2 — 🤖 The same email sent twice is saved once** (click "Resend" on a delivery in the Resend dashboard)

  - *Done 2026-10-19: replay answered* `200`*, log "already on file"; email* `4fe1f0d8…` *= 1 event, 1 message*

## 3. A client writes to the company address

- [x] **3.1 — Othmane writes to the company**

  - Who: Othmane, in his Gmail
  - Do: send an email **to** `jarraya@mail.zouadev.com`. Subject: `TEST Question carrelage`. Text: "Bonjour, quelle couleur ?". Attach a small photo (JPG)
  - Look: Eya → **Messages → Clients**
  - You should see: a chat **othmane** with a topic **TEST Question carrelage**, the text and the photo

- [x] **3.2 — Everyone with the email right sees it**

  - Who: Eya, then Manager, then Sales
  - Look: **Messages → Clients**
  - You should see: the chat **othmane** for all 3, with an unread badge

- [x] **3.3 — The topic asks to choose a project**

  - Look: the topic **TEST Question carrelage**
  - You should see: the label **À lier** (Othmane has 2 open projects, so the app does not guess)

- [x] **3.4 — The right people get the bell alert**

  - Look: the bell 🔔 of Eya, Manager, Sales, then of the Accountant
  - You should see: "new email" for Eya, Manager and Sales. **Nothing** for the Accountant

- [x] **3.5 — Alert email only when you are not in the app**

  - Do: close the app for Eya. Keep the Manager's tab open. Othmane sends a new email to the company address
  - Look: Eya's Gmail inbox
  - You should see: Eya gets an alert email. The Manager gets only the bell (no email)

- [x] **3.6 — Office files are kept**

  - Who: Othmane
  - Do: send to the company address a Word file (.docx), an Excel file (.xlsx), a .zip, and a big PDF (about 15 MB)
  - You should see: the 4 files in the chat

- [x] **3.7 — Dangerous or too big files are not kept**

  - Who: Othmane
  - Do: send a file renamed `setup.exe`, and a file bigger than 25 MB (if Gmail refuses, skip the big one)
  - You should see: the email is there, with "non enregistré pour la sécurité" for setup.exe and "non enregistré (plus de 25 Mo)" for the big file

- [x] **3.8 — Holiday auto-replies are ignored**

  - Who: Othmane — turn on "Vacation responder" in his Gmail settings
  - Do: Eya → **Nouvel email** → Envoyer depuis: **Mon Gmail** → to Othmane. His Gmail answers by itself (send from **Mon Gmail**: Gmail sends vacation answers to the technical bounce address of a company-address email, so that answer never reaches the app)
  - You should see: the automatic answer does **not** appear in the app, and no bell alert
  - Then: turn the vacation responder off
  - *Done 2026-10-19: answer "vacation message Re: test_gmail" reached the app and was skipped ("ignored: auto-reply"), no message, no alert*

- [x] **3.9 — 🤖 An email to an unknown address of ours is dropped** (Othmane sends to `nobody-xyz@mail.zouadev.com`; Claude checks the logs)

  - *Done 2026-10-19: "unknown address", nothing saved*

- [ ] **3.10 — Our own alert emails never loop** *(fixed 2026-10-19, test again)*

  - Do: Eya's Gmail forwards everything. Close the app for Eya (so alerts go by email). Othmane sends an email to Eya's Gmail
  - Look: **Messages → Clients** and the bell, for 1 minute
  - You should see: Othmane's email once, one bell alert, and **no** chat "noreply@zouadev.com" growing. (Before the fix: a new topic every 5 seconds until Resend's daily limit)

## 4. The company answers from the company address

- [x] **4.1 — The Manager replies**

  - Who: Manager
  - Do: open topic **TEST Question carrelage**, write "TEST Blanc ou gris ?", click **Envoyer**
  - Look: Othmane's Gmail
  - You should see: the email comes **from "Eya Jarraya"** `jarraya@mail.zouadev.com`, and it is **in the same Gmail conversation** as his first email

- [x] **4.2 — The Manager replies with files**

  - Who: Manager
  - Do: same topic, click **Joindre un fichier**, add a JPG, a PNG and a .txt, write a short text, **Envoyer**
  - Look: Othmane's Gmail
  - You should see: the 3 files attached. In the app: the 3 files under the message

- [x] **4.3 — Othmane replies, and it lands in the same topic**

  - Who: Othmane, in his Gmail
  - Do: click **Reply** on the Manager's email, write "Gris merci", send
  - Look: Eya → the topic **TEST Question carrelage**
  - You should see: "Gris merci" in the **same topic**, without the old quoted text

- [x] **4.4 — Eya writes a new email from a project page**

  - Who: Eya
  - Do: open project **TEST Cuisine** → tab **Emails** → **Nouvel email**. Envoyer depuis: **Adresse entreprise**. Objet: `TEST Devis cuisine`. Write a text, **Envoyer**
  - You should see: a **new topic** in the same chat **othmane**, already linked to **TEST Cuisine**

- [x] **4.5 — Othmane replies to it**

  - Who: Othmane, **Reply** in his Gmail
  - You should see: the answer in topic **TEST Devis cuisine**, still linked to **TEST Cuisine**

- [x] **4.6 — Othmane replies from his second address**

  - Who: Othmane, from `othmanefadelkheir218+work@gmail.com` (in Gmail: choose this address in "From", or use another mail app)
  - Do: **Reply** on the "TEST Devis cuisine" email
  - You should see: the answer in the same topic, with the warning "⚠️ Écrit depuis une adresse inconnue pour ce client." and a button **Ajouter cette adresse**

- [x] **4.7 — Eya adds the second address**

  - Who: Eya
  - Do: click **Ajouter cette adresse**
  - You should see: "…ajoutée au client." Then a **new** email from `+work` goes straight into Othmane's chat

- [x] **4.8 — The reply goes to the address the client used last**

  - Who: Eya, reply in that topic
  - Look: who receives it
  - You should see: it is sent to `othmanefadelkheir218+work@gmail.com`

## 5. Linking topics to projects

- [x] **5.1 — The Manager links a topic**

  - Who: Manager
  - Do: topic **TEST Question carrelage** → **Lier à un projet** → choose **Rénovation complète salle de bain parentale**
  - You should see: "Projet enregistré." and the label **À lier** is gone

- [x] **5.2 — Sales cannot link**

  - Who: Sales
  - Do: try the same on another topic
  - You should see: no **Lier à un projet** button, or an error

- [x] **5.3 — Only Othmane's projects can be chosen**

  - Who: Manager
  - Do: open **Lier à un projet**
  - You should see: only Othmane's 2 projects in the list, not "Cuisine Peeters" or other clients' projects

- [x] **5.4 — With one open project, the app suggests it**

  - Do: Eya cancels project **TEST Cuisine**. Then Othmane sends a **new** email (new subject `TEST Nouvelle question`) to the company address
  - You should see: the new topic shows **Rénovation complète salle de bain parentale** with the word **suggéré** and a **Confirmer** button

- [ ] **5.5 — The project page shows only its emails**

  - Who: Eya
  - Do: open project **Rénovation complète salle de bain parentale** → tab **Emails**
  - You should see: only the topics linked to this project (3.1 and 5.4)

## 6. A stranger writes

- [x] **6.1 — Winu writes to the company**

  - Who: Winu, from `winucardit@gmail.com`
  - Do: send any email to `jarraya@mail.zouadev.com`
  - Look: **Messages → Clients**
  - You should see: a chat marked **Contact inconnu**

- [x] **6.2 — The Manager makes him a client**

  - Who: Manager
  - Do: open that chat → **Créer le client**. Name and email are filled. Add a phone → **Créer le client**
  - You should see: "Client créé…". The chat now shows the client name. A new email from Winu goes into this chat

- [x] **6.3 — The Accountant cannot do it**

  - Who: Accountant
  - You should see: he cannot even open client chats

## 7. Eya connects her Gmail

Eya's Gmail is already connected, so 7.2 to 7.6 are done. To test them again: **Retirer** first (test 9.3), then start at 7.1.

- [x] **7.1 — A warning comes before Google**

  - Who: Eya
  - Do: **Paramètres → Email → Connecter un autre Gmail**
  - You should see: the window **"Avant de connecter votre Gmail"** (all your emails will arrive; advice: a company Gmail or a filter). **Annuler** closes it. **J'ai compris, continuer** opens Google

- [x] **7.2 — Without the "send" permission, it refuses**

  - Do: at Google, do **not** tick "Envoyer des e-mails en votre nom"
  - You should see: "Cochez « Envoyer des emails en votre nom » chez Google, puis recommencez."
  - *Done 2026-10-19*

- [x] **7.3 — With the permission, it connects**

  - Do: tick the box
  - You should see: "Votre Gmail est connecté." and the status 🟢 **Connecté**
  - *Done 2026-10-19*

- [x] **7.4 — Gmail checks the forward address**

  - Who: Eya, in Gmail
  - Do: Gmail → Settings → **Forwarding and POP/IMAP** → **Add a forwarding address** → paste the address shown in the app → open the confirm link (in the app or in the bell) → **Confirm**
  - You should see: "Confirmation Success!"
  - *Done 2026-10-19*

- [x] **7.5 — Turn the forward on**

  - Do: reload Gmail → **Forward a copy of incoming mail to** → choose the address in the list → **Save Changes**
  - *Done 2026-10-19*

- [x] **7.6 — The setup steps hide by themselves**

  - Look: **Paramètres → Email**, after the first forwarded email
  - You should see: "Transfert actif…" and a **Voir la configuration** button
  - *Done 2026-10-19*

## 8. Emails through Eya's Gmail

- [x] **8.1 — Othmane writes to Eya's Gmail**

  - Who: Othmane
  - Do: send an email **to** `eyajarraya771@gmail.com`
  - You should see: a chat in Eya's **Messages → Clients**, filter **Mon Gmail**. Bell alert for Eya **only**
  - *Done 2026-10-19*

- [x] **8.2 — Nobody else sees Eya's Gmail**

  - Who: Manager, then Sales
  - Look: **Messages → Clients**
  - You should see: **no** chat from Eya's Gmail

- [x] **8.3 — Eya replies, and it stays in the same conversation** *(fixed 2026-10-19, test again)*

  - Who: Eya
  - Do: reply in that Gmail topic, **Envoyer**
  - Look: Othmane's Gmail, and Eya's Gmail **Sent** folder
  - You should see: the email comes **from** `eyajarraya771@gmail.com`, **in the same conversation** as Othmane's email, subject "Re: …" **without** a code like `[#K7Q2M9]`. It is also in Eya's **Sent**

- [x] **8.4 — Eya replies with files** *(fixed 2026-10-19, test again)*

  - Who: Eya
  - Do: same topic, **Joindre un fichier** → a JPG and a PNG → **Envoyer**
  - You should see: Othmane receives both files

- [x] **8.5 — Othmane's answer comes back to the same topic**

  - Who: Othmane, **Reply** in his Gmail
  - You should see: the answer in the same topic in the app (it also stays in Eya's Gmail)

- [x] **8.6 — Eya starts a new email from her Gmail**

  - Who: Eya
  - Do: **Nouvel email** → Envoyer depuis: **Mon Gmail** → À: Othmane → Objet `TEST Visite mardi` → **Envoyer**
  - Look: Othmane's Gmail
  - You should see: from Eya's Gmail, subject `TEST Visite mardi [#XXXXXX]` (a short code at the end). In the app the subject shows **without** the code

- [x] **8.7 — Othmane's reply finds this topic**

  - Who: Othmane, **Reply** on "TEST Visite mardi"
  - You should see: the answer in topic **TEST Visite mardi**

- [x] **8.7b — Eya's 2nd reply stays in the same conversation** *(fixed 2026-10-19, test again)*

  - Who: Eya, after 8.7
  - Do: reply again in topic **TEST Visite mardi**, **Envoyer**
  - Look: Othmane's Gmail
  - You should see: the email is **in the same conversation**, subject `Re: TEST Visite mardi [#XXXXXX]` (the code stays). Before the fix: the code was gone and Gmail opened a new conversation

- [x] **8.8 — Two topics with the same subject do not mix**

  - Do: Eya starts a 2nd email "TEST Visite mardi". Othmane replies to the **first** one
  - You should see: the answer goes to the **first** topic
  - Then: on any received email, click **Déplacer vers un autre sujet** → choose the other topic → **Déplacer**. It moves

- [x] **8.9 — A brand new email with the same subject is a new topic**

  - Who: Othmane
  - Do: write a **new** email (not Reply) to Eya's Gmail with subject `TEST Visite mardi`
  - You should see: a **new** topic (the app never guesses by subject)

- [x] **8.10 — Personal emails also arrive (the warning of 7.1)**

  - Do: any newsletter or other sender writes to Eya's Gmail
  - You should see: it appears in Eya's chats as **Contact inconnu**. Only Eya sees it

- [x] **8.11 — The company address still works**

  - Who: Othmane
  - Do: send an email to `jarraya@mail.zouadev.com`
  - You should see: it lands in the **company** mailbox (Manager and Sales see it), not in Eya's Gmail

## 9. Disconnecting Gmail

- [x] **9.1 — Google access removed**

  - Who: Eya
  - Do: go to myaccount.google.com → Security → **Third-party apps** → ChantierOS → remove access. Then in the app, reply in a Gmail topic
  - You should see: an error "Envoi impossible…", status 🔴 **Déconnecté**, a bell alert and an email. Nothing is sent from the company address instead

- [x] **9.2 — Reconnect**

  - Do: **Paramètres → Email → Reconnecter** (no warning window this time)
  - You should see: 🟢 **Connecté** again, the old chats are back

- [x] **9.3 — Retirer (disconnect for good)**

  - Do: **Retirer** → confirm
  - You should see: "Gmail retiré." The old chats stay, read only
  - Then: in Gmail, turn the forward off yourself (the app cannot do it)

- [x] **9.4 — A deactivated employee loses their Gmail**

  - Do: Eya first gives **Connecter un Gmail** to the Sales role (test 1.9). Sales connects any spare Gmail (it must be a Google test user). Then Eya deactivates Sales in **Équipe**
  - You should see: Sales' Gmail shows **Retiré** in Eya's mailbox list. Nobody can read Sales' chats, not even Eya

- [x] **9.5 — The Manager cannot remove Eya's Gmail**

  - Who: Manager
  - You should see: no **Retirer** button for Eya's Gmail

## 10. Delete, other company, billing

- [x] **10.1 — The Manager cannot delete a whole chat**

  - Who: Manager
  - Do: open a client chat
  - You should see: no **Supprimer (RGPD)** button

- [x] **10.2 — Eya deletes a whole chat (GDPR)**

  - Do: open a chat → **Supprimer (RGPD)** → **Supprimer pour toujours**
  - You should see: the chat, its emails and its files are gone
  - *Done 2026-10-19 (the 4 old chats, files gone from ImageKit too)*

- [x] **10.3 — The other company sees nothing**

  - Who: Zakariya (company B)
  - Look: **Messages → Clients**
  - You should see: an empty list. None of Eya's chats

- [x] **10.4 — 🤖 The company id cannot be forced in a request** (Claude checks)
  - _Done 2026-10-19: as Eya, `tenant_id: 16` (company B) in a new email, a reply and the chat list → `400` "property tenant_id should not exist" each time; nothing sent_

- [ ] **10.5 — The 2nd Gmail is billed**

  - Do: Eya connects a **second** Gmail (it is allowed, never blocked). Then Claude moves Eya's Stripe test clock past **30 April 2027** (the first full month on the new plan)
  - Look: **Paramètres → Facturation → Historique**
  - You should see: a line **Boîtes Gmail: 2 / 1** and **€2.00** extra. The months before do not have this line (the old plan had no Gmail limit)

## 11. Screens to look at

- [ ] **11.1 — Paramètres → Email**: company address with **Copier** and **Changer**; **Mon Gmail** with 🟢 status and **Retirer**; for Eya also **Toutes les boîtes Gmail**

- [ ] **11.2 — Messages → Clients**: the list of chats, unread badges, **Contact inconnu**, filters **Boîte** and **Expéditeur**

- [ ] **11.3 — Inside a chat**: topics on the left (subject, project, **À lier**, **Nouvelle adresse**); **Voir l'email d'origine** / **Voir le texte**; files you can open

- [ ] **11.4 — Nouvel email**: on the client page and on a project page; the choice **Envoyer depuis**; on a project page the project is already chosen

- [ ] **11.5 — A refused file shows a clear message**, never nothing

- [ ] **11.6 — Bell**: "new email" opens the right chat and topic

- [ ] **11.7 — Paramètres → Facturation**: storage shows like **1 Mo / 1 Go** (not 0.00094… / 1), and a **Boîtes Gmail** row

---

## Google errors you may see (not app bugs)

| You see | Why | Fix |
| --- | --- | --- |
| `redirect_uri_mismatch` | Google does not know the return address | Google Cloud → Credentials → add `http://localhost:5300/api/email-inboxes/gmail/callback` |
| "n'a pas terminé la procédure de validation" (403) | This Gmail is not a test user | Google Cloud → Audience → Test users → add the Gmail |
| "Your account is temporarily unavailable" | Google blocked the account for a while | Wait, try in a private window |
| Gmail: "Invalid forwarding address" | The address was typed in the box | Use **Add a forwarding address**, confirm, then pick it in the list |
| The Gmail disconnects after 7 days | Google's limit for apps in test mode | Click **Reconnecter** |

## Result

In progress. Done: 0.1–0.4, 1.1, 1.2, 2.1, 7.2–7.6, 8.1, 10.2. To test again after the fixes of 2026-10-19: 4.2, 8.3, 8.4.

## Problems found — waiting to fix

- [x] **P3 — In a topic Eya started from her Gmail, her 2nd reply opened a new conversation** (found in test 8.7, fixed 2026-10-19)

  - What happened: the rule "a reply to the client has no code" also removed the code in a thread **we** started, so the subject changed and Othmane's Gmail split the conversation
  - Fix: keep the subject the thread already has — if the client's last email carries our `[#code]`, the reply keeps it (`threadHasCode`)
  - To do: restart the API, then run 8.7b (and check 8.3 again: a topic Othmane started still has **no** code)

- [x] **P2 — Alert emails came back in a loop** (found 2026-10-19, fixed the same day)

  - What happened: the app emailed Eya an alert → her Gmail forwarded it → the app saw a new email from `noreply@zouadev.com` → a new alert → … 57 junk topics, then Resend's daily limit stopped it
  - Fix: an email from our own sender address is ignored, like an auto-reply (`isOwnEmail` in `email-parse.helper.ts`)
  - To do by hand: delete the chat "noreply@zouadev.com" (**Supprimer (RGPD)**), then run 3.10

- [x] **P1 — Project → Emails: every topic opens the same topic** (found in test 5.5, fixed 2026-10-19)

  - What you see: on a project page → tab **Emails**, the list is correct, but clicking any topic always opens the same one (the old choice, or the first topic "test subject")
  - Why: the link is right (`/chat/clients/<id>?topic=<topicId>`), but the chat page reads `?topic=` only once, when the page is first created (`ClientChatClient.tsx` line 27, `useState(asked …)`). With `cacheComponents: true` (Next.js 16) the page stays alive between visits, so the new `?topic=` is ignored
  - Fix (frontend, \~3 lines): follow `?topic=` every time the URL changes; clicking a topic in the left column keeps working
  - Fixed: the URL is now the only source of the chosen topic; a click on the left also writes `?topic=` (`ClientChatClient.tsx`)
  - After the fix: run 5.5 again (and 11.6, the bell also opens a topic with `?topic=`)