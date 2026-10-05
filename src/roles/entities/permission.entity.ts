import { ApiProperty } from '@nestjs/swagger';
import { PermissionModule, PermissionScope } from '@prisma/client';

/** One row of `GET /api/roles/permissions`: the resolved default + override. */
export class PermissionEntity {
  @ApiProperty({ example: 2 })
  role_id: number;

  @ApiProperty({ example: 'manager' })
  role_name: string;

  @ApiProperty({ enum: PermissionModule })
  module: PermissionModule;

  @ApiProperty()
  can_view: boolean;

  @ApiProperty()
  can_create: boolean;

  @ApiProperty()
  can_edit: boolean;

  @ApiProperty()
  can_delete: boolean;

  @ApiProperty({ enum: PermissionScope })
  scope: PermissionScope;
}
