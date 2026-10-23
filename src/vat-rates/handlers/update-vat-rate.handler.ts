import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AUDIT_SKIP_KEY } from '../../audit/helpers/audit.helper';
import { AppEventsService } from '../../common/events/app-events.service';
import { StripeService } from '../../stripe/stripe.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { UpdateVatRateDto } from '../dto/update-vat-rate.dto';
import { VatRateRepository } from '../repositories/vat-rate.repository';

@Injectable()
export class UpdateVatRateHandler {
  constructor(
    @InjectPinoLogger(UpdateVatRateHandler.name)
    private readonly logger: PinoLogger,
    private readonly vatRates: VatRateRepository,
    private readonly moduleRef: ModuleRef,
    private readonly events: AppEventsService,
    private readonly cls: ClsService,
  ) {}

  /** From `ModuleRef`, not module imports: see `VatRatesModule`. */
  private get stripe(): StripeService {
    return this.moduleRef.get(StripeService, { strict: false });
  }

  private get subscriptions(): SubscriptionsService {
    return this.moduleRef.get(SubscriptionsService, { strict: false });
  }

  /**
   * - New rate → a new Stripe TaxRate, the old one archived. Invoices already
   *   made keep their rate; billing re-points the card subscriptions of the
   *   country in the background (from the next invoice).
   * - EU flag on → the 0 % reverse-charge TaxRate is made if missing.
   * - Close → refused while a company of the country pays by card (Q10).
   */
  async execute(id: number, dto: UpdateVatRateDto) {
    this.logger.info(`Updating TVA rate ${id}`);

    const row = await this.vatRates.findById(id);
    if (!row) {
      this.logger.warn(`Cannot update: TVA rate ${id} not found`);
      throw new NotFoundException('TVA rate not found');
    }

    const rateChanged =
      dto.rate !== undefined && !new Prisma.Decimal(dto.rate).eq(row.rate);
    const euChanged = dto.is_eu !== undefined && dto.is_eu !== row.isEu;
    const activeChanged =
      dto.is_active !== undefined && dto.is_active !== row.isActive;
    if (!rateChanged && !euChanged && !activeChanged) {
      this.cls.set(AUDIT_SKIP_KEY, true);
      return row;
    }

    if (activeChanged && dto.is_active === false) {
      const paying = await this.subscriptions.findCardTenantIds(
        row.countryCode,
      );
      if (paying.length > 0) {
        this.logger.warn(
          `Cannot close ${row.countryCode}: ${paying.length} company(ies) pay by card`,
        );
        throw new ConflictException('Companies of this country pay by card');
      }
    }

    const data: Prisma.SubscriptionVatRateUpdateInput = {};
    let oldTaxRateId: string | null = null;
    if (rateChanged) {
      data.rate = dto.rate;
      data.stripeTaxRateId = await this.stripe.createTaxRate({
        countryCode: row.countryCode,
        rate: dto.rate!,
        reverseCharge: false,
      });
      oldTaxRateId = row.stripeTaxRateId;
    }
    if (euChanged) {
      data.isEu = dto.is_eu;
      if (dto.is_eu && !row.stripeReverseChargeTaxRateId) {
        data.stripeReverseChargeTaxRateId = await this.stripe.createTaxRate({
          countryCode: row.countryCode,
          rate: '0',
          reverseCharge: true,
        });
      }
    }
    if (activeChanged) data.isActive = dto.is_active;

    const updated = await this.vatRates.update(id, data);
    await this.stripe.archiveTaxRate(oldTaxRateId);

    if (rateChanged || euChanged) {
      this.events.emit('vat_rate.changed', {
        countryCode: updated.countryCode,
      });
    }
    this.logger.info(
      `TVA rate updated: ${updated.countryCode} ${updated.rate.toString()}% ` +
        `(EU: ${updated.isEu}, active: ${updated.isActive})`,
    );
    return updated;
  }
}
