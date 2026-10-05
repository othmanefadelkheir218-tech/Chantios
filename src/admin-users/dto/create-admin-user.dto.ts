import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export const ADMIN_ROLES = ['super_admin', 'staff'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export class CreateAdminUserDto {
  @ApiProperty({
    description: 'Login email. Unique.',
    example: 'staff@chantieros.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Sara Staff' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'At least 12 characters', minLength: 12 })
  @IsString()
  @MinLength(12)
  password: string;

  @ApiProperty({ enum: ADMIN_ROLES })
  @IsIn(ADMIN_ROLES)
  role: AdminRole;
}
