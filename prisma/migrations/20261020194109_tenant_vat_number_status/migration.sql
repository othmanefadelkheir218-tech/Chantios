-- Step 27 — the VIES check of a company TVA number (doc/notes/subscription-plans.md § TVA on the subscription).

-- CreateEnum
CREATE TYPE "vat_number_status" AS ENUM ('valid', 'invalid', 'pending', 'not_checked');

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "vat_number_checked_at" TIMESTAMPTZ(6),
ADD COLUMN     "vat_number_status" "vat_number_status";

-- A TVA number saved before this step was never checked: the retry job checks it.
UPDATE "tenants" SET "vat_number_status" = 'pending' WHERE "vat_number" IS NOT NULL AND btrim("vat_number") <> '';
