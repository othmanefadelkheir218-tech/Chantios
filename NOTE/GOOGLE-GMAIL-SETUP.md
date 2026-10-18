# Email setup — Google "Connect Gmail" + Resend receiving

> What to do, step by step, to make the email feature work **in production**.
> Tested locally on 2026-10-18: receive by forward ✅, reply in the same thread ✅, send as the tenant's Gmail ✅.

---

## The mailboxes

| Mailbox | Receive | Send | Status |
|---|---|---|---|
| Default — ChantierOS address | Client writes to `company-x@mail.<our-domain>` | Resend, from `company-x@mail.<our-domain>` | Build now |
| Personal Gmail | Gmail **forward** → the user's personal forward address `company-x.<token>@mail.<our-domain>` | **Gmail API** (`gmail.send`), from their Gmail | Build now |
| Own domain | Mailbox **forward** | Resend, after they add DNS records (SPF/DKIM) | Not built — keep in mind |

Rules and prices: [EMAIL-CONNECTIONS-PLAN.md](EMAIL-CONNECTIONS-PLAN.md).

We **never read** the tenant's mailbox. We only get what they forward, and we only ask Google for **send**.

---

## Part A — Resend (receiving)

Local test used `mail.zouadev.com`. In production, use the real domain.

1. **Resend → Domains → Add domain** → `mail.<real-domain>` (a **subdomain**, never the root domain — the root MX would break the company's normal mailbox).
2. Add every DNS record Resend shows (SPF, DKIM, **MX**) at the domain provider.
3. Click **Verify**. Wait for "ready to send and receive".
4. **Resend → Webhooks → Add endpoint:**
   - URL: `https://<api-domain>/api/webhooks/resend-inbound`
   - Event: **`email.received`**
5. Copy the **signing secret** → `.env`: `RESEND_WEBHOOK_SECRET=whsec_...`
6. The **Resend API key** must have **Full access** (the backend reads the full email with `email_id`).

**Test:** send an email to `test@mail.<real-domain>` → it shows in Resend → Emails → Receiving, and the webhook answers `200`.

---

## Part B — Google Cloud (sending as the tenant's Gmail)

### B1. Project and API
1. [console.cloud.google.com](https://console.cloud.google.com) → log in with the **company account** that will own the app (not a personal one).
2. **New project** (or reuse the test one).
3. **APIs & Services → Library → Gmail API → Enable.**

### B2. Consent screen (left menu: **OAuth consent screen** = Google Auth Platform)
1. **Branding:**
   - App name: `ChantierOS`
   - Support email
   - **Logo** (needed for verification)
   - **App home page:** `https://<real-domain>`
   - **Privacy policy:** `https://<real-domain>/privacy`
   - **Terms of service:** `https://<real-domain>/terms`
   - **Authorized domains:** `<real-domain>`
2. **Audience:** External.
3. **Data access → Add or remove scopes:**
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/gmail.send` ← the only Gmail scope. **Never add read scopes** (that would need a yearly paid audit).

### B3. Production keys
1. **Clients → Create client → Web application.**
2. Name: `ChantierOS production`.
3. **Authorized redirect URI:**
   `https://<api-domain>/api/email-connections/google/callback`
   (must match `GOOGLE_REDIRECT_URI` exactly — same `https`, same path, no trailing `/`).
4. Copy the **Client secret right away** (or Download JSON) — Google may not show it again.
5. Production `.env`:
   ```
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   GOOGLE_REDIRECT_URI=https://<api-domain>/api/email-connections/google/callback
   ```

### B4. Prove we own the domain
**Google Search Console** → add `<real-domain>` → verify it (DNS TXT record). Use the **same Google account** as the Cloud project. Google refuses verification without this.

### B5. Publish and ask Google for verification
1. **Audience → Publish app** (from Testing to In production).
2. Google asks for verification because `gmail.send` is a **sensitive** scope. Prepare:
   - **Why we need it** (short text): "ChantierOS lets a construction company answer its clients from the app. We only send the replies the user writes and clicks Send on. We never read the mailbox."
   - **Demo video** (YouTube, can be unlisted): show login → Connect Gmail → the consent screen with the URL bar → write a reply in ChantierOS → Send → the email arriving.
   - The privacy policy must say what we do with Google data (only send, nothing stored except the token, no sharing, no AI training on it).
3. Wait — a few days to a few weeks. Answer Google's emails fast.
4. **No yearly security audit (CASA)** — that is only for restricted scopes (reading Gmail).

---

## Good to know

| Topic | Rule |
|---|---|
| **Testing mode** | Only the test users (max 100) can connect, they see "Google hasn't verified this app" → Continue, and the connection **expires every 7 days**. |
| **Permission checkbox** | Google shows "Send email on your behalf" as a checkbox. If the user leaves it unchecked, the callback refuses with a clear message. |
| **Refresh token** | Store it **encrypted** in the database, one per tenant connection. The test version keeps it in memory only. |
| **User removes access** | The user can revoke at myaccount.google.com → the next send fails → mark the connection as broken and ask them to reconnect. |
| **Gmail send limits** | About 500 emails/day for a free Gmail, about 2,000/day for Google Workspace. |
| **Microsoft 365** | Blocks forwarding to outside addresses **by default** — their IT must allow it once. |
| **Gmail forward confirmation** | Gmail sends a confirmation **link** to our address. It arrives through Resend → show it to the tenant in the app. |
| **Threading** | The forward keeps the client's original `Message-ID`. Reply with `In-Reply-To` + `References` = that id → same thread on the client side. |

---

## Test code today (replace before going live)

| File | What |
|---|---|
| `src/inbound-email/` | `POST /api/webhooks/resend-inbound` — checks the signature, fetches the full email, **logs only** |
| `src/email-connections/` | `GET /api/email-connections/google/connect`, `/callback`, `POST /test-send` — tokens in memory, `x-test-key` header |

Both are public test routes. Before production: save to the database, queue jobs, tenant auth on `connect` and send, encrypt tokens, remove `test-send`.

Idea and AI roles: see [AI-email-idea.md](AI-email-idea.md).
