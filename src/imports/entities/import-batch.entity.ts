import { ApiProperty } from '@nestjs/swagger';
import { ImportStatus, ImportType } from '@prisma/client';

export class ImportErrorEntity {
  @ApiProperty({
    description: 'Excel line number, 0 = the whole file',
    example: 12,
  })
  row: number;

  @ApiProperty({ nullable: true, example: 'description' })
  field: string | null;

  @ApiProperty({ example: 'Ligne 12 : le matériau « Peinture » existe déjà.' })
  message: string;
}

export class ImportBatchEntity {
  @ApiProperty()
  id: number;

  @ApiProperty({ enum: ImportType })
  type: ImportType;

  @ApiProperty({ enum: ImportStatus })
  status: ImportStatus;

  @ApiProperty({ example: 'materiaux.xlsx' })
  file_name: string;

  @ApiProperty()
  row_count: number;

  @ApiProperty()
  created_count: number;

  @ApiProperty()
  updated_count: number;

  @ApiProperty()
  error_count: number;

  @ApiProperty({
    type: [ImportErrorEntity],
    description: 'Only on GET /imports/:id',
  })
  errors?: ImportErrorEntity[];

  @ApiProperty({ nullable: true })
  created_by: number | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty({ nullable: true })
  started_at: Date | null;

  @ApiProperty({ nullable: true })
  finished_at: Date | null;
}
