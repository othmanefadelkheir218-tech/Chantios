import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppEventsService } from '../../common/events/app-events.service';
import { env } from '../../config/env.config';
import { normalizeVatNumber } from '../helpers/vat-number.helper';
import { checkWithVies } from '../helpers/vies.helper';
import { TenantRepository } from '../repositories/tenant.repository';

/**
 * Step 27 (Q9) — asks VIES about a company's TVA number while its status is
 * `pending`: right after it is saved, then every 30 min (retry job) while VIES
 * is busy. Never blocks anything: busy / down keeps `pending` (normal rate).
 * `VAT_NUMBER_CHECK=off` → `not_checked`, no call.
 *
 * A new status changes the TVA → `tenant.tax_profile_changed` (billing
 * re-syncs Stripe), unless the caller sends that event itself (`emit: false`).
 */
@Injectable()
export class CheckVatNumberHandler {
  constructor(
    @InjectPinoLogger(CheckVatNumberHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly events: AppEventsService,
  ) {}

  async execute(tenantId: number, emit = true): Promise<Tenant | null> {
    const tenant = await this.tenants.findById(tenantId);
    const vatNumber = normalizeVatNumber(tenant?.vatNumber);
    // `not_checked` (saved in test mode) is asked to VIES too once the check is on.
    const toCheck =
      tenant?.vatNumberStatus === 'pending' ||
      (tenant?.vatNumberStatus === 'not_checked' &&
        env.VAT_NUMBER_CHECK !== 'off');
    if (!tenant || !vatNumber || !toCheck) return tenant;

    this.logger.info(
      `Checking TVA number of tenant ${tenantId} (${vatNumber})`,
    );
    const status =
      env.VAT_NUMBER_CHECK === 'off'
        ? 'not_checked'
        : await checkWithVies(vatNumber);
    if (status === 'pending') {
      this.logger.warn(
        `VIES busy or down for tenant ${tenantId}: still pending, retried later`,
      );
      return tenant;
    }

    const updated = await this.tenants.update(tenantId, {
      vatNumberStatus: status,
      vatNumberCheckedAt: new Date(),
    });
    this.logger.info(`TVA number of tenant ${tenantId}: ${status}`);
    if (emit) this.events.emit('tenant.tax_profile_changed', { tenantId });
    return updated;
  }
}
