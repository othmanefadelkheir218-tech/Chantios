-- Step 19 — bulk import of materials and stock (doc/notes/bulk-import.md).

-- CreateEnum
CREATE TYPE "import_type" AS ENUM ('materials', 'stock');

-- CreateEnum
CREATE TYPE "import_status" AS ENUM ('pending', 'processing', 'done', 'failed');

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "import_batch_id" INTEGER;

-- CreateTable
CREATE TABLE "import_batches" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "type" "import_type" NOT NULL,
    "status" "import_status" NOT NULL DEFAULT 'pending',
    "file_name" TEXT NOT NULL,
    "rows_hash" TEXT NOT NULL,
    "row_count" INTEGER NOT NULL,
    "rows" JSONB NOT NULL,
    "errors" JSONB,
    "created_count" INTEGER NOT NULL DEFAULT 0,
    "updated_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),

    CONSTRAINT "import_batches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_batches_tenant_id_created_at_idx" ON "import_batches"("tenant_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_import_batch_id_fkey" FOREIGN KEY ("import_batch_id") REFERENCES "import_batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- A batch holds 1..500 rows.
ALTER TABLE "import_batches" ADD CONSTRAINT "chk_import_row_count"
  CHECK ("row_count" BETWEEN 1 AND 500);

-- The same rows can't be imported twice; a failed batch may be sent again.
CREATE UNIQUE INDEX "uq_import_batches_hash" ON "import_batches" ("tenant_id", "type", "rows_hash")
  WHERE "status" <> 'failed'::"import_status";

-- One description per company, case-insensitive, archived rows included.
CREATE UNIQUE INDEX "uq_materials_tenant_description" ON "materials" ("tenant_id", lower(btrim("description")));
