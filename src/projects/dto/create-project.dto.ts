import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

/**
 * `POST /api/projects` — starts at `prospect` (the handler sets it, never
 * taken from the body). `end_date` not before `start_date`: checked in
 * `create-project.handler` and backed by the `chk_project_dates` constraint.
 */
export class CreateProjectDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  client_id: number;

  @ApiProperty({ example: 'Dubois — bathroom renovation' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Site address — often not the client address',
  })
  @IsOptional()
  @IsString()
  address_line1?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address_line2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: '2026-01-10' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2026-03-01' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'FK -> users.id, who runs this job' })
  @IsOptional()
  @IsInt()
  manager_id?: number;
}
