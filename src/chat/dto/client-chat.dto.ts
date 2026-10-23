import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/** Step 25 — the client chats (doc/notes/client-email.md). */

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** `GET /api/client-chats?inbox_id=&search=&unknown=` */
export class FindClientChatsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Only the chats of this inbox' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  inbox_id?: number;

  @ApiPropertyOptional({ description: 'Client name, contact name or email' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @ApiPropertyOptional({
    description: 'true = unknown contacts only, false = clients only',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  unknown?: boolean;
}

/** `GET /api/client-chats/:id?topic_id=` — the first page of topics, plus this topic when it is older. */
export class FindClientChatQueryDto {
  @ApiPropertyOptional({
    description:
      'Also return this topic when it is not in the first page (a link to an older topic)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topic_id?: number;
}

/** `GET /api/client-chats/:id/topics?page=&limit=&search=` — email topics, newest activity first. */
export class FindChatTopicsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Part of the subject (any case)' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  search?: string;
}

/** `GET /api/client-chats/:id/topics/:topicId/messages` and `/api/projects/:id/email-topics` */
export class FindTopicMessagesQueryDto extends PaginationQueryDto {}

/** `POST /api/client-chats/emails` — a new email = a new topic. */
export class SendNewEmailDto {
  @ApiProperty({ example: 'eya@gmail.com' })
  @Transform(trim)
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Devis cuisine' })
  @Transform(trim)
  @IsString()
  @Length(1, 200)
  subject: string;

  @ApiProperty({ description: 'Sent as written' })
  @IsString()
  @Length(1, 20000)
  content: string;

  @ApiPropertyOptional({
    description: 'The inbox to send from. Default: the company inbox',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  inbox_id?: number;

  @ApiPropertyOptional({ description: 'The project tag (the project page)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  project_id?: number;

  @ApiPropertyOptional({
    type: [Number],
    description:
      'Files uploaded first with POST /api/client-chats/attachments (max 10, 25 MB in total)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  media_ids?: number[];
}

/** `POST /api/client-chats/topics/:topicId/reply` */
export class ReplyInTopicDto {
  @ApiProperty()
  @IsString()
  @Length(1, 20000)
  content: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  media_ids?: number[];
}

/** `PATCH /api/client-chats/topics/:topicId/project` — `null` = no project. */
export class SetTopicProjectDto {
  @ApiProperty({ type: Number, nullable: true })
  @ValidateIf((_dto, value) => value !== null)
  @IsInt()
  @Min(1)
  project_id: number | null;
}

/** `PATCH /api/client-chats/messages/:messageId/topic` */
export class MoveMessageDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  topic_id: number;
}

/** `POST /api/client-chats/:id/add-address` */
export class AddClientAddressDto {
  @ApiProperty({ example: 'eya@work.com' })
  @Transform(trim)
  @IsEmail()
  email: string;
}
