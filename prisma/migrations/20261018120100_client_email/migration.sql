-- Step 25 — email with clients (doc/notes/client-email.md), part 2.

-- CreateEnum
CREATE TYPE "email_inbox_kind" AS ENUM ('company', 'gmail');

-- CreateEnum
CREATE TYPE "email_inbox_status" AS ENUM ('active', 'disconnected', 'removed');

-- CreateEnum
CREATE TYPE "email_direction" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "email_transport" AS ENUM ('resend', 'gmail');

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "client_id" INTEGER,
ADD COLUMN     "contact_email" VARCHAR(255),
ADD COLUMN     "contact_name" VARCHAR(255),
ADD COLUMN     "inbox_id" INTEGER;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "topic_id" INTEGER,
ALTER COLUMN "sender_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "email_inboxes" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "kind" "email_inbox_kind" NOT NULL,
    "owner_user_id" INTEGER,
    "gmail_address" VARCHAR(255),
    "refresh_token_encrypted" TEXT,
    "scopes" TEXT,
    "status" "email_inbox_status" NOT NULL DEFAULT 'active',
    "last_error" TEXT,
    "forward_confirm_url" TEXT,
    "connected_at" TIMESTAMPTZ(6),
    "disconnected_at" TIMESTAMPTZ(6),
    "removed_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "last_received_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "email_inboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_addresses" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "inbox_id" INTEGER NOT NULL,
    "local_part" VARCHAR(64) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "email_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_emails" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "client_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_topics" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "subject" VARCHAR(998) NOT NULL,
    "project_id" INTEGER,
    "project_suggested" BOOLEAN NOT NULL DEFAULT false,
    "reply_token" VARCHAR(64) NOT NULL,
    "subject_code" VARCHAR(8) NOT NULL,
    "created_by" INTEGER,
    "last_message_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "conversation_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_emails" (
    "message_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "direction" "email_direction" NOT NULL,
    "transport" "email_transport",
    "inbox_id" INTEGER NOT NULL,
    "header_message_id" VARCHAR(998),
    "in_reply_to" VARCHAR(998),
    "references_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "from_address" VARCHAR(255) NOT NULL,
    "from_name" VARCHAR(255),
    "to_addresses" TEXT[] NOT NULL,
    "cc_addresses" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "subject" VARCHAR(998) NOT NULL,
    "html" TEXT,
    "text_full" TEXT,
    "skipped_attachments" JSONB NOT NULL DEFAULT '[]',
    "new_address" BOOLEAN NOT NULL DEFAULT false,
    "resend_email_id" VARCHAR(64),
    "gmail_message_id" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "message_emails_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "inbound_email_events" (
    "id" SERIAL NOT NULL,
    "resend_email_id" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL,
    "tenant_id" INTEGER,
    "processed_at" TIMESTAMPTZ(6),
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

CONSTRAINT "inbound_email_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_inboxes_tenant_id_id_key" ON "email_inboxes"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "email_addresses_inbox_id_idx" ON "email_addresses"("inbox_id");

-- CreateIndex
CREATE INDEX "client_emails_client_id_idx" ON "client_emails"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_topics_reply_token_key" ON "conversation_topics"("reply_token");

-- CreateIndex
CREATE INDEX "conversation_topics_tenant_id_project_id_idx" ON "conversation_topics"("tenant_id", "project_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_topics_conversation_id_subject_code_key" ON "conversation_topics"("conversation_id", "subject_code");

-- CreateIndex
CREATE INDEX "message_emails_tenant_id_header_message_id_idx" ON "message_emails"("tenant_id", "header_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_email_events_resend_email_id_key" ON "inbound_email_events"("resend_email_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_tenant_id_id_key" ON "clients"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "email_inboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "conversation_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_inboxes" ADD CONSTRAINT "email_inboxes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_inboxes" ADD CONSTRAINT "email_inboxes_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_addresses" ADD CONSTRAINT "email_addresses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_addresses" ADD CONSTRAINT "email_addresses_tenant_id_inbox_id_fkey" FOREIGN KEY ("tenant_id", "inbox_id") REFERENCES "email_inboxes"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_emails" ADD CONSTRAINT "client_emails_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_emails" ADD CONSTRAINT "client_emails_tenant_id_client_id_fkey" FOREIGN KEY ("tenant_id", "client_id") REFERENCES "clients"("tenant_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_topics" ADD CONSTRAINT "conversation_topics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_topics" ADD CONSTRAINT "conversation_topics_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_topics" ADD CONSTRAINT "conversation_topics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_topics" ADD CONSTRAINT "conversation_topics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_emails" ADD CONSTRAINT "message_emails_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_emails" ADD CONSTRAINT "message_emails_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_emails" ADD CONSTRAINT "message_emails_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "email_inboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- D2: email files may be up to 25 MB, every other file keeps the 10 MB limit.
ALTER TABLE "media" DROP CONSTRAINT "chk_media_file_size";
ALTER TABLE "media" ADD CONSTRAINT "chk_media_file_size" CHECK (
  "file_size" > 0 AND ("file_size" <= 10485760 OR ("entity_type" = 'email_attachment' AND "file_size" <= 26214400))
);

-- An inbox is either the company address or a Gmail.
ALTER TABLE "email_inboxes" ADD CONSTRAINT "chk_inbox_kind_fields" CHECK (
  ("kind" = 'company' AND "owner_user_id" IS NULL AND "gmail_address" IS NULL AND "refresh_token_encrypted" IS NULL)
  OR ("kind" = 'gmail' AND "owner_user_id" IS NOT NULL AND "gmail_address" IS NOT NULL)
);
CREATE UNIQUE INDEX "uq_inbox_company" ON "email_inboxes"("tenant_id") WHERE "kind" = 'company';
CREATE UNIQUE INDEX "uq_inbox_gmail" ON "email_inboxes"("owner_user_id", lower("gmail_address")) WHERE "status" <> 'removed';

-- Receiving addresses are unique app-wide; 'reply-' is kept for reply tokens.
ALTER TABLE "email_addresses" ADD CONSTRAINT "chk_email_local_part" CHECK (
  "local_part" ~ '^[a-z0-9][a-z0-9.-]{1,62}[a-z0-9]$' AND "local_part" NOT LIKE 'reply-%'
);
CREATE UNIQUE INDEX "uq_email_local_part" ON "email_addresses"(lower("local_part"));

CREATE UNIQUE INDEX "uq_client_emails" ON "client_emails"("tenant_id", lower("email"));

-- A client conversation = one chat with one client (or unknown contact) in one inbox.
ALTER TABLE "conversations" ADD CONSTRAINT "chk_client_conversation" CHECK (
  "type" <> 'client' OR ("inbox_id" IS NOT NULL AND ("client_id" IS NOT NULL OR "contact_email" IS NOT NULL))
);
CREATE UNIQUE INDEX "uq_client_conv_client" ON "conversations"("inbox_id", "client_id") WHERE "type" = 'client' AND "client_id" IS NOT NULL;
CREATE UNIQUE INDEX "uq_client_conv_contact" ON "conversations"("inbox_id", lower("contact_email")) WHERE "type" = 'client' AND "client_id" IS NULL;

-- Only an unknown contact sends without a sender id.
ALTER TABLE "messages" ADD CONSTRAINT "chk_message_sender" CHECK (("sender_type" = 'contact') = ("sender_id" IS NULL));

CREATE UNIQUE INDEX "uq_message_emails_resend" ON "message_emails"("resend_email_id") WHERE "resend_email_id" IS NOT NULL;
