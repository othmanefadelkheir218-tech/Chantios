import { ApiProperty } from '@nestjs/swagger';

export class NotificationEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true, description: 'NULL = a platform alert' })
  tenant_id: number | null;

  @ApiProperty({ example: 'low_stock' })
  type: string;

  @ApiProperty({ nullable: true, type: Object })
  payload: unknown;

  @ApiProperty()
  is_read: boolean;

  @ApiProperty()
  created_at: Date;
}

export class UnreadCountEntity {
  @ApiProperty({ example: 3 })
  unread: number;
}
