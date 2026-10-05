-- AlterTable
ALTER TABLE "one_time_codes" ADD COLUMN     "tenant_id" INTEGER;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "email_verified_at" TIMESTAMPTZ(6);

-- AddForeignKey
ALTER TABLE "one_time_codes" ADD CONSTRAINT "one_time_codes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
