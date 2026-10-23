import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, Tenant, VatNumberStatus } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { env } from '../../config/env.config';
import { VatRatesService } from '../../vat-rates/vat-rates.service';
import {
  isEuVatNumber,
  isValidVatNumberFormat,
  normalizeVatNumber,
} from '../helpers/vat-number.helper';

export interface TaxFieldsInput {
  /** undefined = not sent (an update that leaves it). */
  country?: string | null;
  vatNumber?: string | null;
}

/**
 * Step 27 — the two company fields the TVA on the subscription depends on,
 * checked the same way on signup, super-admin create / edit and the profile:
 * - country: required, never emptied, an ACTIVE country of the TVA table
 *   (an unchanged old value is accepted) — Q6, Q11;
 * - TVA number: normalized, format-checked, VIES status reset (Q9). The VIES
 *   call itself runs after the save (`CheckVatNumberHandler`).
 * Returns the Prisma data to merge into the write.
 */
@Injectable()
export class PrepareTaxFieldsHandler {
  constructor(
    @InjectPinoLogger(PrepareTaxFieldsHandler.name)
    private readonly logger: PinoLogger,
    private readonly vatRates: VatRatesService,
  ) {}

  async execute(
    input: TaxFieldsInput,
    current: Tenant | null,
  ): Promise<Prisma.TenantUpdateInput> {
    const data: Prisma.TenantUpdateInput = {};

    if (input.country !== undefined || !current) {
      const country = input.country?.trim().toUpperCase();
      if (!country) {
        this.logger.warn('Refused: the company country is required');
        throw new BadRequestException('country is required');
      }
      await this.vatRates.assertSelectableCountry(country, current?.country);
      data.country = country;
    }

    if (input.vatNumber !== undefined) {
      Object.assign(data, this.vatNumberData(input.vatNumber, current));
    }
    return data;
  }

  private vatNumberData(
    raw: string | null,
    current: Tenant | null,
  ): Prisma.TenantUpdateInput {
    const vatNumber = normalizeVatNumber(raw);
    if (!vatNumber) {
      return {
        vatNumber: null,
        vatNumberStatus: null,
        vatNumberCheckedAt: null,
      };
    }
    // Unchanged: keep its VIES status (an old number is never re-refused).
    if (current && normalizeVatNumber(current.vatNumber) === vatNumber) {
      return { vatNumber };
    }
    if (!isValidVatNumberFormat(vatNumber)) {
      this.logger.warn(`Refused TVA number ${vatNumber}: wrong format`);
      throw new BadRequestException(
        'vat_number is not valid (country code then number, e.g. BE0123456789)',
      );
    }
    return {
      vatNumber,
      vatNumberStatus: this.firstStatus(vatNumber),
      vatNumberCheckedAt: null,
    };
  }

  /**
   * A non-EU number → no status (VIES cannot check it, and it never gives the
   * reverse charge). An EU number → `off`: counts as valid; else asked to VIES next.
   */
  private firstStatus(vatNumber: string): VatNumberStatus | null {
    if (!isEuVatNumber(vatNumber)) return null;
    return env.VAT_NUMBER_CHECK === 'off' ? 'not_checked' : 'pending';
  }
}
