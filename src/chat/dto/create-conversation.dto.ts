import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
} from 'class-validator';

/**
 * `POST /api/conversations` — only `internal` is created from the API. A
 * `project_client` conversation is made by the portal (step 12), a `support`
 * one by a support ticket (step 16). The caller is added as a member
 * automatically; `member_user_ids` are the OTHER people (active users of this
 * company), at least one.
 */
export class CreateConversationDto {
  @ApiProperty({ enum: ['internal'], example: 'internal' })
  @IsIn(['internal'])
  type: 'internal';

  @ApiPropertyOptional({ description: 'Link the team chat to one project' })
  @IsOptional()
  @IsInt()
  project_id?: number;

  @ApiProperty({ type: [Number], example: [3, 4] })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  member_user_ids: number[];
}
