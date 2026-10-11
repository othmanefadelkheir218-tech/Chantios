import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { CreateTenantDto } from '../../tenants/dto/create-tenant.dto';

/**
 * `POST /api/admin/tenants` — the company, plus its boss. The boss gets an
 * invitation and sets their own password: the super-admin never chooses a
 * password for anyone (doc/notes/subscription-plans.md).
 */
export class AdminCreateTenantDto extends CreateTenantDto {
  @ApiProperty({
    description: 'Name of the company boss (first admin user)',
    example: 'Jean Dupont',
  })
  @IsString()
  @IsNotEmpty()
  owner_name: string;

  @ApiProperty({
    description:
      'Email of the boss. Must not be a user or have an open invitation anywhere.',
    example: 'jean@renovation-dupont.be',
  })
  @IsEmail()
  owner_email: string;
}
