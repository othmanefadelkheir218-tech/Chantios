import { ApiProperty } from '@nestjs/swagger';

/** Response shape. The password hash and the TOTP secret are never returned. */
export class AdminUserEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'staff@chantieros.com' })
  email: string;

  @ApiProperty({ example: 'Sara Staff' })
  name: string;

  @ApiProperty({ enum: ['super_admin', 'staff'] })
  role: string;

  @ApiProperty({ description: 'false = deactivated, cannot log in' })
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
