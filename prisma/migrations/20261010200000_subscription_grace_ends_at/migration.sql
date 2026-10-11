-- End of the trial: the day a company whose trial ended is blocked if it has not paid.
-- Only set while status = past_due (doc/notes/subscription-plans.md, The end of the trial).
ALTER TABLE "tenant_subscriptions" ADD COLUMN "grace_ends_at" TIMESTAMPTZ(6);
