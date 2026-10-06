import { ApiProperty } from '@nestjs/swagger';
import { ContractStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

/** `PATCH /api/contracts/:id/status` — the transition matrix is checked in the handler. */
export class SetContractStatusDto {
  @ApiProperty({ enum: ContractStatus, example: ContractStatus.completed })
  @IsEnum(ContractStatus)
  status: ContractStatus;
}
