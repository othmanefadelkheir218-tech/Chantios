-- Step 24 — private notes like Google Keep (doc/notes/notes.md).

-- AlterEnum
ALTER TYPE "media_entity_type" ADD VALUE 'note';

-- AlterEnum
ALTER TYPE "permission_module" ADD VALUE 'notes';

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT,
    "content" JSONB,
    "content_text" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'default',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_labels" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_label_links" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "note_id" INTEGER NOT NULL,
    "label_id" INTEGER NOT NULL,

    CONSTRAINT "note_label_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notes_user_id_deleted_at_idx" ON "notes"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "notes_tenant_id_id_key" ON "notes"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "note_labels_user_id_idx" ON "note_labels"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "note_labels_tenant_id_id_key" ON "note_labels"("tenant_id", "id");

-- CreateIndex
CREATE INDEX "note_label_links_label_id_idx" ON "note_label_links"("label_id");

-- CreateIndex
CREATE UNIQUE INDEX "note_label_links_note_id_label_id_key" ON "note_label_links"("note_id", "label_id");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_labels" ADD CONSTRAINT "note_labels_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_labels" ADD CONSTRAINT "note_labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_label_links" ADD CONSTRAINT "note_label_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_label_links" ADD CONSTRAINT "note_label_links_tenant_id_note_id_fkey" FOREIGN KEY ("tenant_id", "note_id") REFERENCES "notes"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_label_links" ADD CONSTRAINT "note_label_links_tenant_id_label_id_fkey" FOREIGN KEY ("tenant_id", "label_id") REFERENCES "note_labels"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;


-- A label name is not blank, and unique per user (case and spaces ignored).
ALTER TABLE "note_labels" ADD CONSTRAINT "chk_note_labels_name" CHECK (btrim("name") <> '');
CREATE UNIQUE INDEX "uq_note_labels_user_name" ON "note_labels"("user_id", lower(btrim("name")));
