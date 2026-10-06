import { Injectable } from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { TenantTransactionClient } from '../../common/prisma/tenant-prisma.service';

/**
 * The only place where the `documents` module talks to the database:
 * `document_counters`, the shared row lock behind `quotes`, `invoices` and
 * (step 07) `purchase_invoices` (doc/notes/document-numbering.md).
 *
 * `tx` is **required**, not optional — called outside the document's own
 * transaction, the row lock is lost and the race the whole table exists to
 * prevent comes back. Always run as raw SQL (not the Prisma model API) so
 * the single `INSERT ... ON CONFLICT DO UPDATE ... RETURNING` is one
 * round-trip, one lock, no read-then-write gap.
 */
@Injectable()
export class DocumentCounterRepository {
  constructor(private readonly tenantContext: TenantContextService) {}

  async nextNumber(
    documentType: DocumentType,
    year: number,
    tx: TenantTransactionClient,
  ): Promise<number> {
    const tenantId = this.currentTenantId();
    const rows = await tx.$queryRaw<{ last_number: number }[]>`
      INSERT INTO document_counters (tenant_id, document_type, year, last_number)
      VALUES (${tenantId}, ${documentType}::"document_type", ${year}, 1)
      ON CONFLICT (tenant_id, document_type, year)
      DO UPDATE SET last_number = document_counters.last_number + 1
      RETURNING last_number
    `;
    return rows[0].last_number;
  }

  private currentTenantId(): number {
    const tenantId = this.tenantContext.tenantId;
    if (tenantId === undefined) {
      throw new Error(
        'DocumentCounterRepository ran with no tenant in context',
      );
    }
    return tenantId;
  }
}
