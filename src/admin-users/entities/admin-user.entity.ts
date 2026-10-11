import { ApiProperty } from '@nestjs/swagger';

/** Response shape. The password hash and the TOTP secret are never returned. */
export class AdminUserEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'staff@chantieros.com' })
  email: string;

  @ApiProperty({ example: 'Sara Staff' })
  name: string;

  @ApiProperty({ enum: ['super_admin', 'staff'] })
  role: string;

  @ApiProperty({ description: 'false = deactivated, cannot log in' })
  is_active: boolean;

  @ApiProperty({
    description:
      'true = a staff admin may change plans and billing (a super_admin always may)',
  })
  can_manage_billing: boolean;

  @ApiProperty({
    description:
      'true = a staff admin may suspend or reactivate a company (a super_admin always may)',
  })
  can_manage_tenants: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
