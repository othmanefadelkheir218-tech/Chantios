import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsBIC, IsIBAN, IsOptional } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

/**
 * `PATCH /api/tenant` — what a company may edit about itself
 * (doc/notes/roles-permissions.md § Company profile). `email` and `currency`
 * are fixed by the backend: sending them is refused by the global
 * `forbidNonWhitelisted` validation. `status` and the dates are platform-admin only.
 */
export class UpdateTenantProfileDto extends PartialType(
  PickType(CreateTenantDto, [
    'name',
    'legal_name',
    'vat_number',
    'registration_number',
    'phone',
    'address_line1',
    'address_line2',
    'postal_code',
    'city',
    'country',
    'default_vat_rate',
    'default_payment_days',
    'locale',
    'timezone',
    'end_of_day_reminder_time',
  ] as const),
) {
  @ApiPropertyOptional({
    description:
      'Printed in the invoice payment block. Spaces allowed. null clears it.',
    example: 'BE68 5390 0754 7034',
    nullable: true,
  })
  @IsOptional()
  @IsIBAN({}, { message: 'iban is not a valid IBAN' })
  iban?: string | null;

  @ApiPropertyOptional({
    description: 'Bank code, printed next to the IBAN. null clears it.',
    example: 'GKCCBEBB',
    nullable: true,
  })
  @IsOptional()
  @IsBIC({ message: 'bic is not a valid BIC' })
  bic?: string | null;
}
