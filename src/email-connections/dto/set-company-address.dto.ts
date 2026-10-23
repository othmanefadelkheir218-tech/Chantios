import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

/** `PATCH /api/email-inboxes/company` — the name before `@mail.<our-domain>`. */
export class SetCompanyAddressDto {
  @ApiProperty({
    example: 'dubois-renovation',
    description:
      'Lower-case letters, digits, "." and "-", 3–64 characters. Cannot start with "reply-".',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(3, 64)
  @Matches(/^[a-z0-9][a-z0-9.-]+[a-z0-9]$/, {
    message:
      'local_part may only hold lower-case letters, digits, "." and "-", and must start and end with a letter or digit',
  })
  @Matches(/^(?!reply-)/, { message: 'local_part cannot start with "reply-"' })
  local_part: string;
}
