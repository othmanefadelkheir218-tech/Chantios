import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MaxLength } from 'class-validator';

/** Rename is the only field a client may edit — `file_url` never changes. */
export class RenameMediaDto {
  @ApiProperty({ example: 'site-photo-front.jpg' })
  @IsNotEmpty()
  @MaxLength(255)
  file_name: string;
}
