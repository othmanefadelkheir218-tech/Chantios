import { ApiProperty } from '@nestjs/swagger';

export class AnalyticsEventEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

  @ApiProperty({ nullable: true })
  user_id: number | null;

  @ApiProperty({ example: 'quote_sent' })
  event_name: string;

  @ApiProperty({ nullable: true, type: Object })
  payload: unknown;

  @ApiProperty()
  created_at: Date;
}
