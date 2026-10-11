import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { UpdateTenantProfileDto } from '../tenants/dto/update-tenant-profile.dto';
import { TenantsService } from '../tenants/tenants.service';
import { GetCompanyProfileHandler } from './handlers/get-company-profile.handler';

/**
 * Orchestration only. The profile rules (editable fields, audit) live in
 * `tenants`; this module adds the logo URL from `media`. It exists because
 * `tenants` is imported by `media` and must not import it back.
 */
@Injectable()
export class CompanyProfileService {
  constructor(
    private readonly tenants: TenantsService,
    private readonly getProfile: GetCompanyProfileHandler,
  ) {}

  findMine(tenantId: number) {
    return this.getProfile.execute(tenantId);
  }

  async updateMine(
    dto: UpdateTenantProfileDto,
    actor: AuthenticatedUser,
    ip: string | null,
  ) {
    const updated = await this.tenants.updateProfile(dto, actor, ip);
    return this.getProfile.withLogoUrl(updated);
  }
}
