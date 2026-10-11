import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MediaService } from '../../media/media.service';
import { TenantsService } from '../../tenants/tenants.service';

type TenantProfile = Awaited<ReturnType<TenantsService['findOne']>>;

/**
 * `GET /api/tenant` — the caller's own company + its logo URL. Every user of
 * the tenant may read it: the app shows the company name and logo in its
 * sidebar (doc/notes/roles-permissions.md § Company profile).
 */
@Injectable()
export class GetCompanyProfileHandler {
  constructor(
    @InjectPinoLogger(GetCompanyProfileHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantsService,
    private readonly media: MediaService,
  ) {}

  async execute(tenantId: number) {
    return this.withLogoUrl(await this.tenants.findOne(tenantId));
  }

  /** Adds `logoUrl` to a tenant entity — also used after an update. */
  async withLogoUrl(tenant: TenantProfile) {
    return { ...tenant, logoUrl: await this.findLogoUrl(tenant.logoMediaId) };
  }

  /** A deleted or missing logo file is not an error: the app shows no logo. */
  private async findLogoUrl(
    logoMediaId: number | null,
  ): Promise<string | null> {
    if (logoMediaId === null) return null;
    try {
      return (await this.media.findOne(logoMediaId)).fileUrl;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Company logo media ${logoMediaId} not found`);
        return null;
      }
      throw error;
    }
  }
}
