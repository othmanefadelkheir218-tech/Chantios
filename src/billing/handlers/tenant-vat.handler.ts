import { Injectable } from '@nestjs/common';
import {
  isEuVatNumber,
  normalizeVatNumber,
} from '../../tenants/helpers/vat-number.helper';
import { TenantsService } from '../../tenants/tenants.service';
import { SubscriptionVat } from '../../vat-rates/helpers/subscription-vat.helper';
import { VatRatesService } from '../../vat-rates/vat-rates.service';

export interface TenantVat {
  vat: SubscriptionVat;
  /** The company's EU TVA number, to print on the Stripe invoice. null = none. */
  euVatNumber: string | null;
}

/**
 * Step 27 — which TVA this company pays on its subscription, from its
 * country, TVA number and VIES status. The rule itself is in `vat-rates`
 * (`resolveSubscriptionVat`); this only reads the company.
 */
@Injectable()
export class TenantVatHandler {
  constructor(
    private readonly tenants: TenantsService,
    private readonly vatRates: VatRatesService,
  ) {}

  async execute(tenantId: number): Promise<SubscriptionVat> {
    return (await this.withNumber(tenantId)).vat;
  }

  async withNumber(tenantId: number): Promise<TenantVat> {
    const tenant = await this.tenants.findForBilling(tenantId);
    const vat = await this.vatRates.resolve({
      country: tenant?.country ?? null,
      vatNumber: tenant?.vatNumber ?? null,
      vatNumberStatus: tenant?.vatNumberStatus ?? null,
    });
    const number = normalizeVatNumber(tenant?.vatNumber);
    return {
      vat,
      euVatNumber: number && isEuVatNumber(number) ? number : null,
    };
  }
}

/** The `vat` block of `GET /api/billing/subscription` — never the Stripe ids. */
export function toVatBlock(vat: SubscriptionVat) {
  if (vat.kind === 'missing') return { kind: vat.kind, reason: vat.reason };
  return {
    kind: vat.kind,
    country: vat.country,
    rate: vat.rate,
    reverse_charge: vat.kind === 'reverse_charge',
  };
}
