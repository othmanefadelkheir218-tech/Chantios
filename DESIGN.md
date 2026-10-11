# ChantiOs — Design guide

> One guide for every screen the client sees: **emails**, the **client portal**, and later the app.
> Status: **plan only, nothing is built yet.** Colors and sizes can change before the build.

## 1. Brand

- **Name / logo (for now):** the text **ChantiOs**, as a wordmark. No image file yet.
  - `Chanti` in white (on black) or black (on white), `Os` in orange.
  - A real logo file can replace it later. Keep the wordmark in one place so it is easy to swap.
- **Feeling:** strong, clean, professional. A site-work tool, not a toy.
- **Two colors only:** **black** and **orange**. Play between them. Everything else is white or grey.

## 2. Colors

| Token | Hex | Use |
|---|---|---|
| `black` | `#0B0B0C` | Header, footer, dark sections, main text |
| `ink` | `#1C1C1F` | Cards on a dark background |
| `orange` | `#FF6A00` | Buttons, links, highlights, numbers that matter |
| `orange-dark` | `#E05A00` | Button on hover or press |
| `orange-soft` | `#FFF1E6` | Light orange background (notes, highlights) |
| `white` | `#FFFFFF` | Page background, text on black |
| `grey-100` | `#F4F4F5` | Page background behind cards |
| `grey-300` | `#D4D4D8` | Lines and borders |
| `grey-600` | `#52525B` | Small and secondary text |

Status colors (only for status, never as decoration): green `#16A34A` ok, red `#DC2626` error or refused, amber `#F59E0B` warning.

**Contrast rules (must follow)**
- Text on an **orange** button is **black**, not white. White on this orange is too hard to read.
- Orange **text** goes on black or on `ink`, not on white. On white, use black text and keep orange for lines, icons and buttons.
- Normal text needs contrast 4.5:1 or more.

**How to play with the two colors**
- Black header with an orange line (4 px) under it.
- White body. Black text. One orange button per screen or email.
- A black "big number" block (amount, total) with the number in orange.

## 3. Type

- **Web (portal):** `Inter`, fallback `system-ui, sans-serif`.
- **Email:** `Arial, Helvetica, sans-serif` (email programs do not load web fonts reliably).
- Sizes: title 24 px bold, text 16 px, small text 13 px. Line height 1.5.
- Money and numbers: bold, with a space for thousands, and 2 decimals.

## 4. Components

- **Button:** orange background, black bold text, radius 8 px, height 48 px, padding 0 24 px. One main button per screen.
- **Secondary button:** black border, black text, white background.
- **Card:** white, radius 12 px, 1 px `grey-300` border, soft shadow.
- **Badge (status):** small rounded pill. Sent = orange-soft + black text. Accepted = green. Refused = red. Expired = grey.
- **Spacing:** steps of 4 px (4, 8, 16, 24, 32). Side gutter 16 px on phone.
- **Phone first.** The client opens the portal and the emails on a phone.

## 5. Languages

- **fr** (default), **en**, **nl** (Dutch, Belgium).
- Arabic is **removed** from the plan.
- Every text lives in one dictionary per language. No hard-coded text in a template.
- A missing or unknown language falls back to English (rule from `doc/notes/alerts.md`).
- Dates: `dd/mm/yyyy`. Money: euro, `1 234,50 €` in fr and nl, `€1,234.50` in en.

## 6. Emails

**Layout (width 600 px, one column)**
1. Black header: wordmark **ChantiOs**, orange line under it.
2. White body: title, 1–3 short sentences, **one** orange button.
3. If there is a code (verification): a big box, orange-soft background, code in black bold, letter spacing.
4. Grey small text: "If this was not you, ignore this email."
5. Black footer: company name, `© ChantiOs`, small grey text.

**Rules**
- Build with tables and inline styles (email programs ignore most modern CSS).
- Always add a plain-text version.
- Test in Gmail (web and phone) and in dark mode. Keep contrast in both.
- Subject line: short, in the user's language, starts with the action.
- The link must open a **frontend page** (`APP_URL`), never the API.

**Emails to restyle** (all of them, same layout)
- Invitation, password reset, email verification.
- Margin alerts, subscription payment failed, renewal upcoming, and every other alert email.
- "You have a reply" (client portal chat).
- Quote and invoice sent to the client.

## 7. Client portal (frontend job)

The portal has **no login**. The link is the key. The API gives the data. The frontend builds the pages.

**Pages**
1. **Overview:** project name, status badge, progress bar (orange), counts of quotes and invoices, link expiry date.
2. **Quotes:** list with status badge and total. Detail: lines, VAT block, total incl. VAT. Buttons **Accept** (orange) and **Refuse** (secondary).
3. **Invoices:** list, due date, status, download PDF.
4. **Documents / photos:** grid of site photos, download of PDFs.
5. **Messages:** chat with the company. The company is shown as "company", never an employee name.
6. **Expired link:** one calm page, "This link is no longer valid. Ask the company for a new one."

**Rules**
- Header: black, company name and logo on the left, language switch (FR / EN / NL) on the right.
- Phone first, one column. Big touch targets (48 px).
- Never show an internal id, an employee name or a cost price.
- Accept and Refuse ask for a confirmation before sending.
- Show a clear message if an action fails (the API gives `403`, `404`, `502`); never show the raw API text.

## 8. Build plan (when we start)

1. Write the design tokens once (colors, type, spacing).
2. Build one email layout, then restyle each template with it, in fr / en / nl.
3. Send test emails and check them in Gmail, light and dark.
4. Hand this file to the frontend for the portal. Add the exact API data per page.
5. ~~Remove Arabic from the code and add Dutch~~ — done 2026-10-09.
