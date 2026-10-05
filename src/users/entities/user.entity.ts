import { ApiProperty } from '@nestjs/swagger';

/** Response shape of a team member. Keys are snake_case on the wire. Never
 * carries `password_hash`, `mobile_pin_hash` or `failed_pin_count`. */
export class UserEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

  @ApiProperty({ example: 1, description: '1-7, see roles-permissions.md' })
  role_id: number;

  @ApiProperty({ example: 'Jean Dupont' })
  name: string;

  @ApiProperty({ example: 'jean@renovation-dupont.be' })
  email: string;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Money is a string', example: '18.50' })
  hourly_rate: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty({ nullable: true, description: 'null = not verified' })
  email_verified_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
