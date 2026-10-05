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
import { Public } from '../common/decorators/public.decorator';
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
@Public() // TODO: step 02 wiring — AuthGuard (+ settings:view / admin per route) once attached
@UseInterceptors(SnakeCaseInterceptor)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiFindRoles()
  findAll() {
    return this.rolesService.findAll();
  }

  // Must stay registered before a future `GET :id` — matches one path segment.
  @Get('permissions')
  @ApiFindPermissions()
  findPermissions() {
    return this.rolesService.findPermissionsMatrix();
  }

  @Put(':roleId/permissions/:module')
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
