-- A staff admin may suspend or reactivate a company only if a super_admin allows it. Default: no.
ALTER TABLE "admin_users" ADD COLUMN "can_manage_tenants" BOOLEAN NOT NULL DEFAULT false;
