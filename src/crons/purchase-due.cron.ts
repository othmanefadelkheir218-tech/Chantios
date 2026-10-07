import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotificationsService } from '../notifications/notifications.service';
import { PurchaseInvoicesService } from '../purchase-invoices/purchase-invoices.service';
import { TenantRunner } from './tenant-runner.service';

/** A bill due within this many days (overdue ones too) raises the alert. */
export const PURCHASE_DUE_DAYS = 7;
/** The same bill alerts again only after this many days. */
const REPEAT_DAYS = 3;

/**
 * Every morning, per company: the unpaid supplier bills due within a week
 * (`purchase_due`, billing staff only). Reads the very query behind
 * `GET /api/purchase-invoices/due-soon`.
 */
@Injectable()
export class PurchaseDueCron {
  constructor(
    @InjectPinoLogger(PurchaseDueCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly purchaseInvoices: PurchaseInvoicesService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron('0 8 * * *')
  async run(): Promise<{ alerts: number }> {
    let alerts = 0;
    try {
      await this.runner.forEachTenant('purchase-due', async (tenant) => {
        const bills = await this.purchaseInvoices.dueSoon(PURCHASE_DUE_DAYS);
        for (const bill of bills) {
          await this.notifications.dispatch('purchase_due', {
            tenantId: tenant.id,
            dedupeDays: REPEAT_DAYS,
            payload: {
              entity_id: bill.id,
              invoice_id: bill.id,
              invoice_ref: bill.number,
              due_date: bill.dueDate?.toISOString().slice(0, 10),
            },
          });
          alerts += 1;
        }
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Purchase-due cron failed');
    }
    this.logger.info(`Purchase-due cron: ${alerts} bill(s)`);
    return { alerts };
  }
}
