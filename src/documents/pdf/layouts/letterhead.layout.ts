import { Client, Tenant } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import type { Content } from 'pdfmake';

/**
 * The plain data `DocumentsService.renderQuotePdf`/`renderInvoicePdf` take
 * for the letterhead — never a Prisma `Tenant` row directly, so this module
 * stays a leaf (doc/notes/Phaces/15-documents.md: "DocumentsService must
 * never import quotes/invoices/media/clients/tenants"). `logoUrl` is
 * resolved by the caller (the `quotes`/`invoices` render/freeze handlers,
 * which DO have `MediaService`) — `tenants.logo_media_id` is only an FK,
 * `media.file_url` lives in a table this module never touches.
 */
export interface LetterheadTenant {
  name: string;
  legalName: string | null;
  vatNumber: string | null;
  registrationNumber: string | null;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  currency: string;
  logoUrl: string | null;
}

export interface LetterheadClient {
  name: string;
  contactName: string | null;
  email: string;
  phone: string;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}

/** Pure mapper — the `quotes`/`invoices` handlers build this from their own `TenantsService` read. */
export function toLetterheadTenant(
  tenant: Tenant,
  logoUrl: string | null,
): LetterheadTenant {
  return {
    name: tenant.name,
    legalName: tenant.legalName,
    vatNumber: tenant.vatNumber,
    registrationNumber: tenant.registrationNumber,
    email: tenant.email,
    phone: tenant.phone,
    addressLine1: tenant.addressLine1,
    addressLine2: tenant.addressLine2,
    postalCode: tenant.postalCode,
    city: tenant.city,
    country: tenant.country,
    currency: tenant.currency,
    logoUrl,
  };
}

/** Pure mapper — the `quotes`/`invoices` handlers build this from their own `ClientsService` read. */
export function toLetterheadClient(client: Client): LetterheadClient {
  return {
    name: client.name,
    contactName: client.contactName,
    email: client.email,
    phone: client.phone,
    addressLine1: client.addressLine1,
    addressLine2: client.addressLine2,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
  };
}

function addressLines(entity: {
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
}): string[] {
  const line2 = [entity.postalCode, entity.city].filter(Boolean).join(' ');
  return [
    entity.addressLine1,
    entity.addressLine2,
    line2,
    entity.country,
  ].filter((value): value is string => !!value && value.length > 0);
}

/**
 * Fetches the tenant logo (an ImageKit CDN URL already resolved by the
 * caller) and base64-encodes it for pdfmake, which — per the installed
 * 0.3.11 types (`ContentImage.image`) — accepts a plain data URL string
 * directly, no separate image dictionary needed. Any failure (no URL, a
 * non-OK response, a non-image content type, a network error) is caught and
 * logged as a warning; the letterhead then falls back to the company name as
 * text (doc/notes/Phaces/15-documents.md acceptance: "a tenant with no logo
 * -> renders with the company name, no crash").
 */
export async function fetchLogoDataUri(
  logoUrl: string | null,
  logger: PinoLogger,
): Promise<string | null> {
  if (!logoUrl) return null;
  try {
    const response = await fetch(logoUrl);
    if (!response.ok) {
      logger.warn(`Logo fetch failed (${response.status}): ${logoUrl}`);
      return null;
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      logger.warn(
        `Logo URL did not return an image (${contentType}): ${logoUrl}`,
      );
      return null;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${bytes.toString('base64')}`;
  } catch (err: unknown) {
    logger.warn(
      { err },
      `Logo fetch threw for ${logoUrl} — rendering text only`,
    );
    return null;
  }
}

/** Logo (or the company name as text fallback) + tenant block, side by side at the top of the page. */
export function buildLetterheadHeader(
  tenant: LetterheadTenant,
  logoDataUri: string | null,
): Content {
  const identity: Content = logoDataUri
    ? { image: logoDataUri, fit: [160, 70] }
    : { text: tenant.name, style: 'companyName' };

  const tenantLines = [
    tenant.legalName && tenant.legalName !== tenant.name
      ? tenant.legalName
      : null,
    ...addressLines(tenant),
    tenant.vatNumber ? `VAT ${tenant.vatNumber}` : null,
    tenant.registrationNumber ? `Reg. ${tenant.registrationNumber}` : null,
    tenant.email,
    tenant.phone,
  ].filter((value): value is string => !!value);

  return {
    columns: [
      identity,
      {
        text: tenantLines.join('\n'),
        style: 'tenantBlock',
        alignment: 'right',
      },
    ],
  };
}

/** "Billed to" block. */
export function buildClientBlock(client: LetterheadClient): Content {
  const lines = [
    client.name,
    client.contactName,
    ...addressLines(client),
    client.email,
    client.phone,
  ].filter((value): value is string => !!value && value.length > 0);

  return {
    stack: [
      { text: 'Billed to', style: 'sectionLabel' },
      { text: lines.join('\n') },
    ],
    margin: [0, 20, 0, 0],
  };
}

export function buildFooter(tenant: LetterheadTenant): Content {
  const parts = [
    tenant.name,
    tenant.vatNumber ? `VAT ${tenant.vatNumber}` : null,
  ].filter((value): value is string => !!value);
  return {
    text: parts.join(' — '),
    style: 'footer',
    alignment: 'center',
  };
}
