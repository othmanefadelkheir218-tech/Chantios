import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, MaxLength } from 'class-validator';

/** One product event. Sent by other modules through `AnalyticsService.track()`. */
export interface TrackEventInput {
  tenantId: number;
  userId?: number | null;
  /** snake_case verb phrase, e.g. `quote_sent`. */
  eventName: string;
  payload?: Record<string, unknown>;
}

/** Name of the BullMQ queue that carries the events. */
export const ANALYTICS_QUEUE = 'analytics';

/** `POST /api/analytics/track` body — any authenticated tenant user. */
export class TrackEventDto {
  @ApiProperty({ maxLength: 100, example: 'quote_sent' })
  @IsNotEmpty()
  @MaxLength(100)
  event_name: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
