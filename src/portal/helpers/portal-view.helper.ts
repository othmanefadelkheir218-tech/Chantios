import { Invoice, Prisma, Quote, QuoteLine } from '@prisma/client';
import { isPastValidUntil } from '../../quotes/helpers/quote.helper';

/**
 * THE ALLOW-LIST of the client portal (doc/notes/Phaces/12-client-portal.md).
 *
 * Every function here builds its output field by field, from named picks.
 * NEVER serialise an entity and strip fields afterwards: the next person who
 * adds a column to `quotes` or `projects` would leak it to a client. A new
 * field reaches the portal only when someone writes it into this file.
 *
 * Never visible, and so never mentioned below: margins, costs, subcontractors,
 * suppliers, purchase invoices, employee names or ids, hours, stock, internal
 * notes (`clients.note`, `projects.description`, `quotes.note`), user ids,
 * `created_by`, `tenant_id`, `service_id`.
 */

/** A file the client may open: only its id (the download route) and its name. */
interface DocumentSource {
  id: number;
  fileName: string;
}

export function toPortalDocuments(files: DocumentSource[] = []) {
  return files.map((file) => ({ id: file.id, file_name: file.fileName }));
}

export function toPortalQuote(
  quote: Quote & { lines: QuoteLine[] },
  documents: DocumentSource[] = [],
) {
  return {
    id: quote.id,
    number: quote.number,
    status: quote.status,
    issue_date: quote.issueDate,
    valid_until: quote.validUntil,
    amount_excl_vat: quote.amountExclVat,
    vat_amount: quote.vatAmount,
    amount_incl_vat: quote.amountInclVat,
    accepted_at: quote.acceptedAt,
    // The one thing the client can DO: accept or refuse a quote that is still open.
    can_respond: quote.status === 'sent' && !isPastValidUntil(quote.validUntil),
    lines: quote.lines.map((line) => ({
      description: line.description,
      unit: line.unit,
      quantity: line.quantity,
      unit_price_excl_vat: line.unitPriceExclVat,
      vat_rate: line.vatRate,
      total_excl_vat: line.totalExclVat,
    })),
    documents: toPortalDocuments(documents),
  };
}

/** One invoice's live balance, from the `invoice_balance` view. */
export interface PortalBalance {
  amountPaid: Prisma.Decimal;
  balanceDue: Prisma.Decimal;
  isLate: boolean;
}

export function toPortalInvoice(
  invoice: Invoice,
  balance: PortalBalance | null,
  documents: DocumentSource[] = [],
) {
  const isLate = balance?.isLate ?? false;
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    amount_excl_vat: invoice.amountExclVat,
    vat_amount: invoice.vatAmount,
    amount_incl_vat: invoice.amountInclVat,
    amount_paid: balance?.amountPaid ?? new Prisma.Decimal(0),
    balance_due: balance?.balanceDue ?? invoice.amountInclVat,
    // A late invoice shows a red label; `late` is calculated, never a stored status.
    is_late: isLate,
    label: isLate ? 'late' : null,
    documents: toPortalDocuments(documents),
  };
}

/** What a chat message looks like to the client: who it is from — never a name or an id. */
interface MessageSource {
  id: number;
  senderType: string;
  content: string;
  createdAt: Date;
  attachments: { id: number; fileName: string; fileType: string }[];
}

export function toPortalMessage(message: MessageSource) {
  return {
    id: message.id,
    // The employee's name is internal: the client only sees "the company" or "you".
    from: message.senderType === 'client' ? 'you' : 'company',
    content: message.content,
    created_at: message.createdAt,
    attachments: message.attachments.map((file) => ({
      id: file.id,
      file_name: file.fileName,
      file_type: file.fileType,
    })),
  };
}

interface ProjectSource {
  name: string;
  status: string;
  city: string | null;
  startDate: Date | null;
  endDate: Date | null;
}

export function toPortalOverview(input: {
  companyName: string;
  project: ProjectSource;
  progress: { progressPct: number; reportDate: Date | null };
  photos: { id: number; fileName: string; fileUrl: string; createdAt: Date }[];
  quotes: { total: number; open: number };
  invoices: { total: number; late: number };
  linkExpiresAt: Date;
}) {
  return {
    company_name: input.companyName,
    project: {
      name: input.project.name,
      status: input.project.status,
      city: input.project.city,
      start_date: input.project.startDate,
      end_date: input.project.endDate,
    },
    progress: {
      progress_pct: input.progress.progressPct,
      report_date: input.progress.reportDate,
    },
    photos: input.photos.map((photo) => ({
      id: photo.id,
      file_name: photo.fileName,
      file_url: photo.fileUrl,
      created_at: photo.createdAt,
    })),
    quotes: input.quotes,
    invoices: input.invoices,
    link_expires_at: input.linkExpiresAt,
  };
}
