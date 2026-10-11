import { ApiPropertyOptional } from '@nestjs/swagger';
import { ImportStatus, ImportType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindImportsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ImportType })
  @IsOptional()
  @IsEnum(ImportType)
  type?: ImportType;

  @ApiPropertyOptional({ enum: ImportStatus })
  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;
}
