import { ApiProperty } from '@nestjs/swagger';
import { ClientType } from '@prisma/client';

/** Response shape of a client. Keys are snake_case on the wire. */
export class ClientEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

  @ApiProperty({ enum: ClientType })
  type: ClientType;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  contact_name: string | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ nullable: true })
  phone_secondary: string | null;

  @ApiProperty({
    nullable: true,
    description: "Required when type = 'professional'",
  })
  vat_number: string | null;

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

  @ApiProperty({
    nullable: true,
    description: 'Internal only — never shown in the portal',
  })
  note: string | null;

  @ApiProperty({ description: 'false = archived, never deleted' })
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
