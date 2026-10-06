import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export const PAYMENT_METHODS = [
  'transfer',
  'cheque',
  'cash',
  'stripe',
] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

/**
 * `POST /api/invoices/:id/payments` — one ledger row, append-only. No
 * update/delete route exists, ever (client-invoices.md § payments). Format
 * validated only (`@IsNumberString` cannot combine with `@Min` in this
 * `class-validator` version) — the `> 0` bound is both a handler check and
 * backed by the `chk_payment_positive` DB constraint.
 */
export class RecordPaymentDto {
  @ApiProperty({ description: 'Must be > 0', example: '3630.00' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ enum: PAYMENT_METHODS, example: 'transfer' })
  @IsIn(PAYMENT_METHODS)
  method: PaymentMethodValue;

  @ApiPropertyOptional({ example: 'VIR-2026-0042' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: '2026-10-14' })
  @IsOptional()
  @IsDateString()
  payment_date?: string;
}
