import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';

/** Every field of `CreateTenantDto`, all optional. */
export class UpdateTenantDto extends PartialType(CreateTenantDto) {}
