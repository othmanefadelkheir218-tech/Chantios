# To do — emails and payments

Ideas kept for later. Not built. Decide before building.

## Later

- **"Pay now" button in the payment emails.** Add an orange "Payer maintenant" button to *payment failed* and *renewal soon*, which opens the Billing page (or the Stripe payment page of the unpaid invoice).
- **Link to the Stripe invoice PDF.** In the *payment received* email, add a link "Télécharger la facture (PDF)". Stripe gives it on the paid invoice (`invoice_pdf` / `hosted_invoice_url`).

## Not needed now

- **Super admin emails in French.** The 6 platform emails (new company, payment received, payment failed, company status changed, support ticket opened, usage spike) are English only, by rule. Change only if the team wants French.
- **Turn off Stripe's own receipt.** ChantierOS now sends its own *payment received* email. To avoid two emails per payment: Stripe Dashboard → Settings → Customer emails → turn off "Successful payments". Do it once our email has been checked on a real payment.

## To remember for production

- The Stripe webhook endpoint must also send the **`invoice.paid`** event (Stripe Dashboard → Developers → Webhooks → the endpoint → events). `stripe listen` in dev already sends every event.
