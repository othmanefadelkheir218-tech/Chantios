import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const SIMULATED_PAYMENT_RESULTS = ['succeeded', 'failed'] as const;
export type SimulatedPaymentResult = (typeof SIMULATED_PAYMENT_RESULTS)[number];

export class SimulatePaymentDto {
  @ApiProperty({ enum: SIMULATED_PAYMENT_RESULTS })
  @IsIn(SIMULATED_PAYMENT_RESULTS)
  result: SimulatedPaymentResult;
}
