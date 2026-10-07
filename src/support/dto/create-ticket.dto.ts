import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketCategory, TicketPriority } from '@prisma/client';
import { IsIn, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/**
 * `POST /api/support/tickets` — `admin` role only (checked in the handler,
 * not just the route). `message` is the ticket's first message, written into
 * the auto-created `support` conversation (step 11), not a ticket field.
 */
export class CreateTicketDto {
  @ApiProperty({ maxLength: 200, example: 'Invoices stuck in draft' })
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty({ enum: ['bug', 'question', 'billing', 'other'] })
  @IsIn(['bug', 'question', 'billing', 'other'])
  category: TicketCategory;

  @ApiPropertyOptional({ enum: ['low', 'normal', 'high'], default: 'normal' })
  @IsOptional()
  @IsIn(['low', 'normal', 'high'])
  priority?: TicketPriority;

  @ApiProperty({ description: 'The first message of the support conversation' })
  @IsNotEmpty()
  message: string;
}
