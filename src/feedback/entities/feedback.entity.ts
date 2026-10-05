import { ApiProperty } from '@nestjs/swagger';
import { FeedbackStatus, FeedbackType } from '@prisma/client';

export class FeedbackEntity {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  tenant_id: string;

  @ApiProperty({ description: 'The tenant user who wrote it', format: 'uuid' })
  submitted_by: string;

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
