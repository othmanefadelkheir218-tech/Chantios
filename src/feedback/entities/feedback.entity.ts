import { ApiProperty } from '@nestjs/swagger';
import { FeedbackStatus, FeedbackType } from '@prisma/client';

export class FeedbackEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

  @ApiProperty({ description: 'The tenant user who wrote it' })
  submitted_by: number;

  @ApiProperty({ enum: FeedbackType })
  type: FeedbackType;

  @ApiProperty({ example: 'Export invoices to Excel' })
  title: string;

  @ApiProperty({ nullable: true })
  body: string | null;

  @ApiProperty({ enum: FeedbackStatus })
  status: FeedbackStatus;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
