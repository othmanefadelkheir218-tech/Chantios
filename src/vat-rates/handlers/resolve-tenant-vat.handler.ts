import { Injectable } from '@nestjs/common';
import { env } from '../../config/env.config';
import {
  resolveSubscriptionVat,
  SubscriptionVat,
  VatCompany,
} from '../helpers/subscription-vat.helper';
import { VatRateRepository } from '../repositories/vat-rate.repository';

/**
 * Reads the company's TVA-table row and applies THE rule. The caller passes
 * the company (country, TVA number, VIES status): `vat-rates` never reads
 * `tenants` itself, because `tenants` already depends on this module.
 */
@Injectable()
export class ResolveTenantVatHandler {
  constructor(private readonly vatRates: VatRateRepository) {}

  async execute(company: VatCompany): Promise<SubscriptionVat> {
    const country = company.country?.trim().toUpperCase();
    const row = country ? await this.vatRates.findByCountry(country) : null;
    return resolveSubscriptionVat(
      company,
      env.SELLER_COUNTRY,
      row && {
        rate: row.rate.toFixed(2),
        isEu: row.isEu,
        isActive: row.isActive,
        stripeTaxRateId: row.stripeTaxRateId,
        stripeReverseChargeTaxRateId: row.stripeReverseChargeTaxRateId,
      },
      env.VAT_NUMBER_CHECK === 'off',
    );
  }
}
