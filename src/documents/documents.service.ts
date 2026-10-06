import { Injectable } from '@nestjs/common';
import { DocumentType } from '@prisma/client';
import { TenantTransactionClient } from '../common/prisma/tenant-prisma.service';
import { formatDocumentNumber } from './helpers/document-number.helper';
import { DocumentCounterRepository } from './repositories/document-counter.repository';

/**
 * The shared door `quotes` and `invoices` (and step 07's `purchase_invoices`)
 * call to get their next number — one lock, one format, one implementation
 * (doc/notes/Phaces/06-quotes-invoices.md). `tx` is required: this must run
 * inside the document's own creation transaction or the row lock is pointless.
 */
@Injectable()
export class DocumentsService {
  constructor(private readonly counters: DocumentCounterRepository) {}

  async allocateNumber(
    documentType: DocumentType,
    tx: TenantTransactionClient,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const lastNumber = await this.counters.nextNumber(documentType, year, tx);
    return formatDocumentNumber(documentType, year, lastNumber);
  }
}
