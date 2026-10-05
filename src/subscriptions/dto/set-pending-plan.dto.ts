import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SetPendingPlanDto {
  @ApiProperty({
    description: 'The plan the tenant moves to at its next renewal',
    format: 'uuid',
  })
  @IsUUID()
  plan_id: string;
}
