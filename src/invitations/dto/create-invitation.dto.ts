import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: 'jean@renovation-dupont.be' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jean Dupont' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    minimum: 1,
    maximum: 7,
    description: 'See roles-permissions.md for the 7 fixed roles',
  })
  @IsInt()
  @Min(1)
  @Max(7)
  role_id: number;
}
