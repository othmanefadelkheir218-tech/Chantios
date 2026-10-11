-- A staff admin may change plans and billing only if a super_admin allows it. Default: no.
ALTER TABLE "admin_users" ADD COLUMN "can_manage_billing" BOOLEAN NOT NULL DEFAULT false;
