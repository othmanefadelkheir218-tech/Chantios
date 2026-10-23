-- Step 27 — TVA on the subscription (doc/notes/subscription-plans.md § TVA on the subscription).
-- Platform table, no tenant_id. Created by the super-admin, never seeded.

-- CreateTable
CREATE TABLE "subscription_vat_rates" (
    "id" SERIAL NOT NULL,
    "country_code" CHAR(2) NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "is_eu" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "stripe_tax_rate_id" TEXT NOT NULL,
    "stripe_reverse_charge_tax_rate_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_vat_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_vat_rates_country_code_key" ON "subscription_vat_rates"("country_code");

-- Rate between 0 and 100, country code upper case.
ALTER TABLE "subscription_vat_rates"
  ADD CONSTRAINT "subscription_vat_rates_rate_check" CHECK ("rate" >= 0 AND "rate" < 100),
  ADD CONSTRAINT "subscription_vat_rates_country_code_check" CHECK ("country_code" ~ '^[A-Z]{2}$');
