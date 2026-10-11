import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
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
 * update/delete route exists, ever (client-invoices.md § payments). A
 * negative amount is a correction and needs `note`. Format validated here;
 * the `<> 0` and "note on a correction" rules are handler checks, backed by
 * the `chk_payment_not_zero` / `chk_payment_correction_note` DB constraints.
 */
export class RecordPaymentDto {
  @ApiProperty({
    description:
      'Never 0. Negative = a correction of an earlier payment (note required). The total paid can never go below 0.',
    example: '3630.00',
  })
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

  @ApiPropertyOptional({
    description: 'Why this row exists. Required when amount is negative.',
    example: 'Typed 1 100 instead of 1 000',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
