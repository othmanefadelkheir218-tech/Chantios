import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';

/** Response shape of a company. Keys are snake_case on the wire. */
export class TenantEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'Rénovation Dupont' })
  name: string;

  @ApiProperty({ nullable: true })
  legal_name: string | null;

  @ApiProperty({ nullable: true })
  vat_number: string | null;

  @ApiProperty({ nullable: true })
  registration_number: string | null;

  @ApiProperty({ example: 'contact@renovation-dupont.be' })
  email: string;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ nullable: true })
  address_line1: string | null;

  @ApiProperty({ nullable: true })
  address_line2: string | null;

  @ApiProperty({ nullable: true })
  postal_code: string | null;

  @ApiProperty({ nullable: true })
  city: string | null;

  @ApiProperty({ nullable: true, example: 'BE' })
  country: string | null;

  @ApiProperty({ nullable: true })
  logo_media_id: number | null;

  @ApiProperty({ description: 'Money and rates are strings', example: '21.00' })
  default_vat_rate: string;

  @ApiProperty({ example: 30 })
  default_payment_days: number;

  @ApiProperty({ example: 'fr' })
  locale: string;

  @ApiProperty({ example: 'EUR' })
  currency: string;

  @ApiProperty({ example: 'Europe/Brussels' })
  timezone: string;

  @ApiProperty({ description: 'HH:mm', example: '18:00' })
  end_of_day_reminder_time: string;

  @ApiProperty({ enum: TenantStatus })
  status: TenantStatus;

  @ApiProperty({
    nullable: true,
    description: 'Soft delete. null = not deleted',
  })
  deleted_at: Date | null;

  @ApiProperty({
    nullable: true,
    description: 'Not required at creation. null = not verified',
  })
  email_verified_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
