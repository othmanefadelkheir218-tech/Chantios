# Failed tests to fix — phase 03 (2026-10-08)

Found during the full test run ([doc/notes/PhacesTest/RESULTS.md](doc/notes/PhacesTest/RESULTS.md)). Nothing is fixed yet.

---

## 1. REG-04: the verification email is always in English

- **Problem:** company A is French, but its "verify your email" email came in English.
- **Why:** [tenant-email-verification.template.ts](src/email/templates/tenant-email-verification.template.ts) has only English text and no `locale` option. The note says every email template must take one ([alerts.md:99](doc/notes/alerts.md)).
- **Fix:** add a `locale` option and French, English and Arabic text to this template. Then pass the company's language from the 2 places that send it: [register-tenant.handler.ts](src/auth/handlers/register-tenant.handler.ts) and [send-tenant-verification-email.handler.ts](src/tenants/handlers/send-tenant-verification-email.handler.ts). It's small; the reset and invitation emails already work this way.

## 2. SUS-01: a suspended company can still open 3 routes

- **Problem:** after company B was suspended, its owner was blocked on `/users` and `/clients`. But `/auth/me`, `/auth/sessions` and `/roles` still answered `200`.
- **Why:** these 3 routes don't run the guard that checks "is this company suspended?" ([subscription.guard.ts](src/auth/guards/subscription.guard.ts)). The note says a suspended company gets "no access at all".
- **Real risk:** low. It lasts at most 15 minutes, until the access cookie expires, and it shows only the user's own profile and the role list.
- **Fix:** add the suspension check to these routes too.

## 3. 2FA-02: no limit on wrong 2FA codes

- **Problem:** after a platform admin's password is accepted, they must type a 6-digit code from their phone app. I sent 4 wrong codes, then the right one, and it still logged in. The note says the limit is 3 wrong tries.
- **Why:** [verify-2fa.handler.ts](src/auth/handlers/verify-2fa.handler.ts) counts nothing. A decision on 2026-10-05 removed the database row that held the counter, and the limit was lost with it.
- **Real risk:** medium. Without a limit, someone with the password can keep guessing codes for 5 minutes. Today no admin has 2FA turned on (there is no route to enable it yet), so nobody is exposed right now.
- **Fix:** keep a counter of wrong tries. After 3, the login try is dead and the admin must log in again.

---

## Advice

Fix all 3 now, like PLN-06, then re-run only these 3 tests.

**Open question:** fix 1 needs French and Arabic text for the email. Should Claude write that text?
