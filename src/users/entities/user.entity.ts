import { ApiProperty } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({
    description: 'Unique id of the user (UUID)',
    example: '3f8a1c52-9d2e-4b7a-8f61-2c5e7a9b0d14',
  })
  id: string;

  @ApiProperty({ description: 'First name', example: 'Othmane' })
  name: string;

  @ApiProperty({ description: 'Last name', example: 'Fadelkheir' })
  lastName: string;

  @ApiProperty({
    description: 'Phone number in international format (E.164). Unique.',
    example: '+212612345678',
  })
  phone: string;

  @ApiProperty({
    description: 'Creation date',
    example: '2026-09-25T20:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2026-09-25T20:30:00.000Z',
  })
  updatedAt: Date;
}
