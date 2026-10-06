import { ApiProperty } from '@nestjs/swagger';
import { MediaEntityType } from '@prisma/client';

/**
 * Response shape of a file. Keys are snake_case on the wire. `file_id`
 * (ImageKit's own id) never leaves the module — it is an internal handle,
 * not something a client needs; `file_url` is what clients use.
 */
export class MediaEntity {
  @ApiProperty()
  id: number;

  @ApiProperty()
  tenant_id: number;

  @ApiProperty({ enum: MediaEntityType })
  entity_type: MediaEntityType;

  @ApiProperty()
  entity_id: number;

  @ApiProperty()
  file_name: string;

  @ApiProperty()
  file_url: string;

  @ApiProperty({ example: 'image/jpeg' })
  file_type: string;

  @ApiProperty({ description: 'Bytes', example: 204800 })
  file_size: number;

  @ApiProperty({
    description: 'true = the frozen copy of a sent quote/invoice',
  })
  is_locked: boolean;

  @ApiProperty({ nullable: true })
  uploaded_by: number | null;

  @ApiProperty({ nullable: true, description: 'Trash marker. null = live' })
  deleted_at: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
