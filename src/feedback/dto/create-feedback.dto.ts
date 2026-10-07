import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackType } from '@prisma/client';
import { IsIn, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/** `POST /api/feedback` — any role may submit. One-way: the platform reads and changes the status. */
export class CreateFeedbackDto {
  @ApiProperty({ enum: ['feature_request', 'improvement', 'complaint'] })
  @IsIn(['feature_request', 'improvement', 'complaint'])
  type: FeedbackType;

  @ApiProperty({ maxLength: 200, example: 'Export invoices to Excel' })
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  body?: string;
}
