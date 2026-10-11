# To be considered when you build the front end

> Things the API does that the frontend must handle. Add a line here each time you find one.

## Links in emails
- `APP_URL` (in `.env`) is the base of the frontend pages. Now `http://localhost:5300/i`. In production it must be the real frontend address (the API refuses to start with localhost).
- **Invitation email:** the link is `APP_URL/invitations/accept?token=XXXX`. The frontend must build this page (name, password, then call the API).
- **Password reset email** and **verify email:** the API sends a **6-digit code** in a big box, with no link. The user types the code on a page. The frontend needs a "enter the code" page for each. If you prefer a link, change the API first.

## Errors the frontend must show
- **File upload fails** (`POST /api/media` → `502`): message "The file service is not available, please try again". Show it with a **Try again** button. The API already retried 2 times.

## Permissions and buttons
- Read `GET /api/roles/permissions` and hide the buttons the user cannot use. A **worker** is view only on tasks and reports (own rows): no "Create task" or "New report" button. A worker can log own hours, upload own files and chat.
- A refused action gives `403` with a generic text, for example `No canCreate access to tasks`. Do not show this text to the user. Show your own message, for example "You do not have the right to do this".

## Languages and emails
- Languages: `fr` (default), `en`, `nl`. Arabic is removed. The company's `locale` (set at registration) chooses the language of every email. An unknown language gives English.
- Every email uses one layout (see `DESIGN.md` § 6): black header with the ChantiOs wordmark, orange button, black footer. Every email also has a plain-text version.
- The invitation link is `APP_URL/invitations/accept?token=...`. The client portal link comes from `PORTAL_BASE_URL`.

## Emails landing in Spam (before real users)
- Test emails from `noreply@zouadev.com` land in the Gmail Spam folder. Resend says `delivered`, so they are not blocked. The domain is set up right: DKIM, SPF verified. DMARC is `p=none` (monitor only).
- Likely cause: a new domain with little sending history, and test emails sent in bursts. There is no code fix.
- On the pages that wait for an email (verify email, reset password, invitation), tell the user: "Check your Spam folder if you do not see the email", and offer a "Send again" button.
- Before real users: send from your real brand domain, warm it up with low volume, and move DMARC to `p=quarantine` when all mail is stable.
