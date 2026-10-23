-- Step 25 — the "Connecter un Gmail" right (doc/notes/client-email.md § The two
-- email permissions): connecting a personal Gmail is separate from using email.
-- Default admin only (code matrix); no row is seeded.

-- AlterEnum
ALTER TYPE "permission_module" ADD VALUE 'email_gmail';
