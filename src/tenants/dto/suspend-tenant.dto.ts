import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '@prisma/client';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SetTenantStatusDto {
  @ApiProperty({ enum: TenantStatus })
  @IsIn(Object.values(TenantStatus))
  status: TenantStatus;

  @ApiPropertyOptional({
    description: 'Why — written to audit_logs',
    example: 'Payment failed three times',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
