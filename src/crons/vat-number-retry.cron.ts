import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TenantsService } from '../tenants/tenants.service';

/**
 * Step 27 (Q9) — every 30 min: asks VIES again about each TVA number still
 * `pending` (VIES was busy or down when it was saved). A good answer changes
 * the TVA from the next invoice; the tenants module tells billing.
 */
@Injectable()
export class VatNumberRetryCron {
  constructor(
    @InjectPinoLogger(VatNumberRetryCron.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantsService,
  ) {}

  @Cron('*/30 * * * *')
  async run(): Promise<number> {
    let checked = 0;
    try {
      const ids = await this.tenants.findPendingVatIds();
      for (const id of ids) {
        await this.tenants.checkVatNumber(id);
        checked += 1;
      }
    } catch (err: unknown) {
      this.logger.error({ err }, 'TVA number retry cron failed');
    }
    if (checked > 0) {
      this.logger.info(`TVA number retry cron: ${checked} number(s) asked`);
    }
    return checked;
  }
}
