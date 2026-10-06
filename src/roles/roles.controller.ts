import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PermissionModule } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  SessionAuth,
  TenantAuth,
} from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiFindPermissions,
  ApiFindRoles,
  ApiRemovePermission,
  ApiUpsertPermission,
} from './decorators/roles.swagger';
import { UpsertPermissionDto } from './dto/upsert-permission.dto';
import { RolesService } from './roles.service';

@ApiTags('Roles')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @SessionAuth()
  @ApiFindRoles()
  findAll() {
    return this.rolesService.findAll();
  }

  // Must stay registered before a future `GET :id` — matches one path segment.
  @Get('permissions')
  @TenantAuth()
  @Module('settings')
  @ApiFindPermissions()
  findPermissions() {
    return this.rolesService.findPermissionsMatrix();
  }

  @Put(':roleId/permissions/:module')
  @TenantAuth()
  @Roles('admin')
  @ApiUpsertPermission()
  upsertPermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('module', new ParseEnumPipe(PermissionModule))
    module: PermissionModule,
    @Body() dto: UpsertPermissionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.upsertPermissionOverride(
      roleId,
      module,
      dto,
      actor,
    );
  }

  @Delete(':roleId/permissions/:module')
  @TenantAuth()
  @Roles('admin')
  @ApiRemovePermission()
  removePermission(
    @Param('roleId', ParseIntPipe) roleId: number,
    @Param('module', new ParseEnumPipe(PermissionModule))
    module: PermissionModule,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.rolesService.removePermissionOverride(roleId, module, actor);
  }
}
