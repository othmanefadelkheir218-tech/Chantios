import { BadRequestException } from '@nestjs/common';
import { Prisma, Quote, QuoteLine, QuoteStatus } from '@prisma/client';
import { VatLine } from '../../documents/helpers/document-totals.helper';
import { MediaService } from '../../media/media.service';

/** What may leave the module. */
export function toQuoteEntity(quote: Quote, lines?: QuoteLine[]) {
  return {
    id: quote.id,
    tenantId: quote.tenantId,
    clientId: quote.clientId,
    projectId: quote.projectId,
    number: quote.number,
    status: quote.status,
    issueDate: quote.issueDate,
    validUntil: quote.validUntil,
    defaultVatRate: quote.defaultVatRate,
    amountExclVat: quote.amountExclVat,
    vatAmount: quote.vatAmount,
    amountInclVat: quote.amountInclVat,
    note: quote.note,
    sentAt: quote.sentAt,
    acceptedAt: quote.acceptedAt,
    refusedAt: quote.refusedAt,
    createdBy: quote.createdBy,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    ...(lines && { lines: lines.map(toQuoteLineEntity) }),
  };
}

export function toQuoteLineEntity(line: QuoteLine) {
  return {
    id: line.id,
    tenantId: line.tenantId,
    quoteId: line.quoteId,
    serviceId: line.serviceId,
    description: line.description,
    unit: line.unit,
    quantity: line.quantity,
    unitPriceExclVat: line.unitPriceExclVat,
    vatRate: line.vatRate,
    totalExclVat: line.totalExclVat,
    position: line.position,
  };
}

export function toVatLine(line: QuoteLine): VatLine {
  return { totalExclVat: line.totalExclVat, vatRate: line.vatRate };
}

/** Builds the Prisma filter for the quotes list: project, client, status. */
export function buildQuoteFilter(
  projectId?: number,
  clientId?: number,
  status?: QuoteStatus,
): Prisma.QuoteWhereInput {
  return {
    ...(projectId !== undefined && { projectId }),
    ...(clientId !== undefined && { clientId }),
    ...(status !== undefined && { status }),
  };
}

/** `quantity` must be non-zero — backed by the DB CHECK too. */
export function assertNonZeroQuantity(value: string): void {
  if (Number(value) === 0) {
    throw new BadRequestException('quantity cannot be zero');
  }
}

/**
 * `valid_until` hard-blocks acceptance once it has passed (decided,
 * doc/notes/Phaces/06-quotes-invoices.md). Date-only comparison: a quote
 * valid *until* today is still acceptable today, only a date strictly
 * before today is expired.
 */
export function isPastValidUntil(validUntil: Date | null): boolean {
  if (!validUntil) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return validUntil.getTime() < today.getTime();
}

/**
 * Step 15: `tenants.logo_media_id` is only an FK — the ImageKit URL lives on
 * the `media` row. Shared by `render-quote-pdf.handler` and
 * `freeze-quote-pdf.handler` so this lookup (and its not-found fallback)
 * isn't written twice inside this module. A missing/deleted logo row is not
 * an error — the PDF falls back to the company name as text.
 */
export async function resolveLogoUrl(
  media: MediaService,
  logoMediaId: number | null,
): Promise<string | null> {
  if (!logoMediaId) return null;
  const logo = await media.findOne(logoMediaId).catch(() => null);
  return logo?.fileUrl ?? null;
}
