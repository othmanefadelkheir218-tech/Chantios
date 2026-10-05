import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsEventEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  tenant_id: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  user_id: string | null;

  @ApiProperty({ example: 'quote_sent' })
  event_name: string;

  @ApiProperty({ nullable: true, type: Object })
  payload: unknown;

  @ApiProperty()
  created_at: Date;
}
