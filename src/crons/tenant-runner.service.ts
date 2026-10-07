import { Injectable } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { TenantContextService } from '../common/cls/tenant-context.service';
import { TenantsService } from '../tenants/tenants.service';

/**
 * Runs a cron's work once per active company, with that company in the
 * tenant context — so the handlers and repositories the cron calls are
 * scoped exactly like a request. One company failing is logged and skipped;
 * it never stops the others.
 */
@Injectable()
export class TenantRunner {
  constructor(
    @InjectPinoLogger(TenantRunner.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantsService,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async forEachTenant(
    job: string,
    work: (tenant: Tenant) => Promise<void>,
  ): Promise<number> {
    const tenants = await this.tenants.findAllActive();
    let done = 0;
    for (const tenant of tenants) {
      try {
        await this.cls.run(async () => {
          this.tenantContext.setTenantId(tenant.id);
          await work(tenant);
        });
        done += 1;
      } catch (err: unknown) {
        this.logger.error({ err }, `${job} failed for tenant ${tenant.id}`);
      }
    }
    return done;
  }
}
