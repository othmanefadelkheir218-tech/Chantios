-- Adding a team member without the invitation email (doc/notes/auth-tokens.md § 2b).

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "login_code" VARCHAR(8);
ALTER TABLE "users" ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "users_login_code_key" ON "users"("login_code");

-- A user with no email is a worker who logs in with a login code.
ALTER TABLE "users" ADD CONSTRAINT "chk_users_email_or_worker_code"
  CHECK ("email" IS NOT NULL OR ("role_id" = 5 AND "login_code" IS NOT NULL));
