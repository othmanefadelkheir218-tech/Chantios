import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `PATCH /api/contracts/:id`. The subcontractor and the project are fixed at
 * creation — a different engagement is a new contract. The status has its own
 * route (`PATCH /api/contracts/:id/status`).
 */
export class UpdateContractDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Money is a string' })
  @IsOptional()
  @IsNumberString()
  amount_excl_vat?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  end_date?: string;
}
