import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { FindPermissionsHandler } from './handlers/find-permissions.handler';
import { FindRolesHandler } from './handlers/find-roles.handler';
import { RemovePermissionHandler } from './handlers/remove-permission.handler';
import { UpsertPermissionHandler } from './handlers/upsert-permission.handler';
import { RoleRepository } from './repositories/role.repository';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [AuditModule],
  controllers: [RolesController],
  providers: [
    RolesService,
    RoleRepository,
    FindRolesHandler,
    FindPermissionsHandler,
    UpsertPermissionHandler,
    RemovePermissionHandler,
  ],
  exports: [RolesService],
})
export class RolesModule {}
