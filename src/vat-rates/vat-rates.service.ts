import { Injectable } from '@nestjs/common';
import { CheckCountryHandler } from './handlers/check-country.handler';
import { ResolveTenantVatHandler } from './handlers/resolve-tenant-vat.handler';
import { VatCompany } from './helpers/subscription-vat.helper';
import { VatRateRepository } from './repositories/vat-rate.repository';

/**
 * Orchestration only, READ side. Used by billing (which TVA a company pays),
 * tenants and auth (which countries can be chosen). Step 27.
 *
 * Never import the write handlers here: they load `StripeService` /
 * `SubscriptionsService`, whose files reach `tenants` again — a file-load
 * cycle for every module that imports this service. Writes live in
 * `VatRatesAdminService`.
 */
@Injectable()
export class VatRatesService {
  constructor(
    private readonly vatRates: VatRateRepository,
    private readonly resolveTenantVat: ResolveTenantVatHandler,
    private readonly checkCountry: CheckCountryHandler,
  ) {}

  /** The whole table, active rows first. */
  findAll() {
    return this.vatRates.findAll();
  }

  /** Active country codes only — never the Stripe ids. */
  activeCountries() {
    return this.vatRates.findActiveCountryCodes();
  }

  /** 400 unless `country` is an active TVA country (or the unchanged `currentCountry`). */
  assertSelectableCountry(country: string, currentCountry?: string | null) {
    return this.checkCountry.execute(country, currentCountry ?? null);
  }

  /** Which TVA this company pays on its subscription. */
  resolve(company: VatCompany) {
    return this.resolveTenantVat.execute(company);
  }
}
