-- Step 18 — API additions for the frontend.

-- 1. Bank details printed on the invoice. Editable in the company profile.
ALTER TABLE "tenants" ADD COLUMN "iban" TEXT;
ALTER TABLE "tenants" ADD COLUMN "bic" TEXT;

-- 2. A company created by the super-admin: its first admin is invited by a platform admin.
--    Exactly one of invited_by / invited_by_admin_user_id is set.
ALTER TABLE "user_invitations" ALTER COLUMN "invited_by" DROP NOT NULL;
ALTER TABLE "user_invitations" ADD COLUMN "invited_by_admin_user_id" INTEGER;
ALTER TABLE "user_invitations" ADD CONSTRAINT "user_invitations_invited_by_admin_user_id_fkey"
  FOREIGN KEY ("invited_by_admin_user_id") REFERENCES "admin_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "user_invitations" ADD CONSTRAINT "chk_invitation_one_inviter"
  CHECK (num_nonnulls("invited_by", "invited_by_admin_user_id") = 1);

-- 3. Payment corrections: a negative row is a correction and needs a note.
ALTER TABLE "payments" DROP CONSTRAINT "chk_payment_positive";
ALTER TABLE "payments" ADD COLUMN "note" TEXT;
ALTER TABLE "payments" ADD CONSTRAINT "chk_payment_not_zero"
  CHECK ("amount" <> 0);
ALTER TABLE "payments" ADD CONSTRAINT "chk_payment_correction_note"
  CHECK ("amount" > 0 OR "note" IS NOT NULL);
