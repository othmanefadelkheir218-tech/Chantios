import { ApiProperty } from '@nestjs/swagger';

export class RoleEntity {
  @ApiProperty({ example: 1, description: '1-7, SMALLINT' })
  id: number;

  @ApiProperty({ example: 'admin' })
  name: string;

  @ApiProperty({ example: 'Main Manager' })
  label: string;

  @ApiProperty()
  is_active: boolean;
}
