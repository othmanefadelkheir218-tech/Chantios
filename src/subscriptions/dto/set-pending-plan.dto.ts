import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class SetPendingPlanDto {
  @ApiProperty({
    description: 'The plan the tenant moves to at its next renewal',
  })
  @Type(() => Number)
  @IsInt()
  plan_id: number;
}
