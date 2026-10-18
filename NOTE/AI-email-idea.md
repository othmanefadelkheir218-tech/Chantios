# Idea — AI + client emails (not decided yet)

> Status: idea to discuss with the manager. Nothing is built.

## Context

- ChantierOS sends emails to clients with **Resend** (already connected).
- Resend can also **receive** emails sent to our own address (e.g. `p-123-xyz@reply.chantieros.be`). The client just clicks Reply.
- Resend (like Brevo) **never** reads anyone's mailbox. It only sees emails that pass through it. No Gmail access → no Google verification, no yearly audit, lower GDPR risk.

## Main idea: one conversation, two channels

The client can talk by **email** or by **portal message**. Both go into the **same project conversation** (`project_client` chat, see `doc/notes/chat-conversations.md`).

```
Client replies by email  ─┐
                          ├──►  project_client conversation  ──►  staff + AI see everything
Client writes in portal  ─┘
```

- Each message keeps a small label: `email` or `portal`.
- When staff reply, the reply goes back **by the same channel** the client used.
- The AI always sees the **full story** of the project, so it gives better help.

## The AI: two roles

### Role A — answer the client

**Draft only, never send by itself**, at least at the start.
The AI writes the reply, staff read it, edit it and click Send. One wrong answer about a price, a date or a discount can cost the company money, or a client.

### Role B — help the admin (the most valuable part)

- **Sort**: what kind of message is it (question, complaint, payment, new request, urgent)?
- **Summarize**: "The client is unhappy about the delay and asks for a new date."
- **Mood**: calm, unhappy or angry. It warns before things get bad.
- **Probability**: "This quote has a high chance of being accepted, because the client asked about the start date." Or "risk of a late payment".
- **Suggest the next action**: "Send the updated quote", "Call the client", "Plan the visit".
- **Search**: "Did Dupont ever accept the price for the tiles?"
- **Link to our data**: it sees the quote, the invoices still to pay, the project progress and the margin, so its advice is real and not generic.

## Suggested order

1. **Inbound email into the project conversation** (Resend). No AI yet, but already useful.
2. **AI helper for the admin (role B)**: summary, sorting, mood, next action.
3. **AI draft replies (role A)**: staff always click Send.
4. **Maybe later**: auto-send for very simple messages, only if the tenant turns it on.

Each step is useful alone, and the risky part comes last.

## Status (owner, 2026-10-18)

**The AI part is on hold.** First we build email with clients, without AI — see [EMAIL-CONNECTIONS-PLAN.md](EMAIL-CONNECTIONS-PLAN.md). The answers about emails (which emails come in, linking, who sees, attachments, price, keeping, language) are written there.

## Topics for later (when the AI part starts)

1. Role A, role B, or both? Which one first?
2. What the AI can read, and what it must never say (prices, discounts, promises).
3. Which plans get the AI, and a monthly AI limit per tenant.
