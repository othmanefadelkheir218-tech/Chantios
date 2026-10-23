-- Step 25 — email with clients (doc/notes/client-email.md), part 1.
-- New enum values get their own migration: Postgres cannot use a value added
-- in the same transaction (the CHECKs and partial indexes of part 2 use them).

-- AlterEnum
ALTER TYPE "conversation_type" ADD VALUE 'client';

-- AlterEnum
ALTER TYPE "media_entity_type" ADD VALUE 'email_attachment';

-- AlterEnum
ALTER TYPE "permission_module" ADD VALUE 'email';

-- AlterEnum
ALTER TYPE "sender_type" ADD VALUE 'contact';
