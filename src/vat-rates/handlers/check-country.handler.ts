import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { VatRateRepository } from '../repositories/vat-rate.repository';

/**
 * Q11: a company's country must be an ACTIVE country of the TVA table — at
 * signup, on the profile, when the super-admin creates a company. An
 * unchanged old value is accepted (a country closed after the company chose it).
 */
@Injectable()
export class CheckCountryHandler {
  constructor(
    @InjectPinoLogger(CheckCountryHandler.name)
    private readonly logger: PinoLogger,
    private readonly vatRates: VatRateRepository,
  ) {}

  async execute(
    country: string,
    currentCountry: string | null = null,
  ): Promise<void> {
    if (currentCountry && country === currentCountry) return;
    const row = await this.vatRates.findByCountry(country);
    if (!row?.isActive) {
      this.logger.warn(`Refused country ${country}: not an active TVA country`);
      throw new BadRequestException('This country is not available');
    }
  }
}
