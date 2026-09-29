# ChantierOS — Issues found while testing (live app)

1. If a client/company already has a subscription, can they change plans with the current code? Based on the audit, this isn't confirmed — only the initial Stripe checkout at signup was found. No dedicated "change plan" flow exists.
2. How does a regular employee fill in their timesheet in the app — do they get their own account/access?
3. How are employees defined/onboarded from the start?
4. Bug: signup forces you to set the number of users upfront. Most SaaS apps only ask for this after registration and payment, and let you add users afterward from inside the app — where permissions can be managed at the same time. This needs to change.
5. When adding a project from a client's page (e.g. `https://chantier-os.fadelkheir.eu/clients/12`), the app redirects to `https://chantier-os.fadelkheir.eu/projets/nouveau` and forces you to select the client again. This is bad UX — the client context should carry over automatically.
6. The project start date should default to today's date. (Not required — just a note.)
7. Bug: when creating a project, the end date can be set earlier than the start date. This is a real data-integrity bug and needs validation.
8. The project status can be changed freely to any value, with no validation and no consideration of business impact.
9. On `https://chantier-os.fadelkheir.eu/sous-traitance`: there's no way to edit/update a subcontractor after creation, and the phone number field has no format validation (accepts invalid input). (This point got cut off in the original — please complete what else happens "after creation.")
10. It's currently possible to create an invoice/devis with no client selected, and the total price shows as `NaN`. There's also no way to edit a devis after it's created.
11. In the devis screen, selecting a product from the catalogue breaks the total price and shows `NaN`.
12. On `https://chantier-os.fadelkheir.eu/bibliotheque`, only manually-added products appear — the default/pre-built catalogue items are missing. The app also needs proper language/localization handling.
13. We have products in the catalogue (Bibliothèque de prestations) — we need the ability to select from that catalogue when adding stock/materials, so the two are linked instead of disconnected.
14. Inconsistency: signup forces you to set a number of users upfront, but the app also lets you add new users later from "Équipe" — these two mechanisms contradict each other.
15. Pointages (time tracking) must be recorded per individual employee. We need a simple mobile-friendly interface so employees can fill in their own timesheets.