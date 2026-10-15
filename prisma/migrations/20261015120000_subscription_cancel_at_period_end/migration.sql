-- Step 21: the tenant admin cancelled the card subscription; it ends at period_end (doc/notes/subscription-plans.md § Paying by card).
ALTER TABLE "tenant_subscriptions" ADD COLUMN "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false;
