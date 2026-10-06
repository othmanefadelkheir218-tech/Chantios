import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

/** `POST /api/purchase-invoices/:id/paid` — both fields optional. */
export class MarkPaidDto {
  @ApiPropertyOptional({
    example: '2026-10-20T10:00:00Z',
    description: 'Defaults to now',
  })
  @IsOptional()
  @IsDateString()
  paid_at?: string;

  @ApiPropertyOptional({ example: 'BANK-TRF-8842' })
  @IsOptional()
  @IsString()
  payment_reference?: string;
}
