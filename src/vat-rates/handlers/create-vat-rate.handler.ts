import { ConflictException, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { StripeService } from '../../stripe/stripe.service';
import { CreateVatRateDto } from '../dto/create-vat-rate.dto';
import { VatRateRepository } from '../repositories/vat-rate.repository';

@Injectable()
export class CreateVatRateHandler {
  constructor(
    @InjectPinoLogger(CreateVatRateHandler.name)
    private readonly logger: PinoLogger,
    private readonly vatRates: VatRateRepository,
    private readonly moduleRef: ModuleRef,
  ) {}

  /** From `ModuleRef`, not a module import: see `VatRatesModule`. */
  private get stripe(): StripeService {
    return this.moduleRef.get(StripeService, { strict: false });
  }

  /**
   * One country of the TVA table. The Stripe TaxRate(s) are made first — the
   * normal one, and the 0 % reverse-charge one for an EU country. Stripe fails
   * → nothing is saved (an already-made TaxRate is archived again).
   */
  async execute(dto: CreateVatRateDto) {
    const countryCode = dto.country_code;
    const isEu = dto.is_eu ?? true;
    this.logger.info(`Creating TVA rate ${countryCode} ${dto.rate}%`);

    if (await this.vatRates.findByCountry(countryCode)) {
      this.logger.warn(`Cannot create TVA rate: ${countryCode} exists`);
      throw new ConflictException('This country is already in the TVA table');
    }

    const stripeTaxRateId = await this.stripe.createTaxRate({
      countryCode,
      rate: dto.rate,
      reverseCharge: false,
    });
    let stripeReverseChargeTaxRateId: string | null = null;
    if (isEu) {
      try {
        stripeReverseChargeTaxRateId = await this.stripe.createTaxRate({
          countryCode,
          rate: '0',
          reverseCharge: true,
        });
      } catch (error) {
        await this.stripe.archiveTaxRate(stripeTaxRateId);
        throw error;
      }
    }

    const row = await this.vatRates.create({
      countryCode,
      rate: dto.rate,
      isEu,
      stripeTaxRateId,
      stripeReverseChargeTaxRateId,
    });
    this.logger.info(
      `TVA rate created: ${row.id} (${countryCode} ${dto.rate}%, EU: ${isEu})`,
    );
    return row;
  }
}
