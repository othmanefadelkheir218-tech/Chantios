import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

export class PaginatedUsersDto {
  @ApiProperty({ type: () => [UserEntity] })
  data: UserEntity[];

  @ApiProperty({ description: 'Total number of users found', example: 42 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages: number;
}
