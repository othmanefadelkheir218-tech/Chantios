import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * `POST /api/projects/:id/portal-link` — no body needed. `expires_in_days`
 * overrides the 90-day default; the date is stored in the `expires_at` column.
 */
export class GenerateTokenDto {
  @ApiPropertyOptional({ example: 90, minimum: 1, maximum: 365, default: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expires_in_days?: number;
}
