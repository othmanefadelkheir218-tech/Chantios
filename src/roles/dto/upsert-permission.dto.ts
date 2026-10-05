import { ApiProperty } from '@nestjs/swagger';
import { PermissionScope } from '@prisma/client';
import { IsBoolean, IsEnum } from 'class-validator';

/** `PUT /api/roles/:roleId/permissions/:module` — one override row. */
export class UpsertPermissionDto {
  @ApiProperty()
  @IsBoolean()
  can_view: boolean;

  @ApiProperty()
  @IsBoolean()
  can_create: boolean;

  @ApiProperty()
  @IsBoolean()
  can_edit: boolean;

  @ApiProperty()
  @IsBoolean()
  can_delete: boolean;

  @ApiProperty({ enum: PermissionScope, default: 'all' })
  @IsEnum(PermissionScope)
  scope: PermissionScope;
}
