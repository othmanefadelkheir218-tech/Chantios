import { ApiProperty } from '@nestjs/swagger';
import { TenantEntity } from '../../tenants/entities/tenant.entity';

/** `GET /api/tenant` — the company profile, with the logo ready to show. */
export class CompanyProfileEntity extends TenantEntity {
  @ApiProperty({ nullable: true, description: 'null when no logo is set' })
  logo_url: string | null;
}
