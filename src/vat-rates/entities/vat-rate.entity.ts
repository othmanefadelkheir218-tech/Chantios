import { ApiProperty } from '@nestjs/swagger';

export class VatRateEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'BE' })
  country_code: string;

  @ApiProperty({ description: 'Percent, a string', example: '21.00' })
  rate: string;

  @ApiProperty()
  is_eu: boolean;

  @ApiProperty({ description: 'false = closed: no new payment from it' })
  is_active: boolean;

  @ApiProperty({ example: 'txr_123' })
  stripe_tax_rate_id: string;

  @ApiProperty({ nullable: true, example: 'txr_456' })
  stripe_reverse_charge_tax_rate_id: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
