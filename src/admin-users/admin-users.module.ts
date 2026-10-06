import { SessionsModule } from '../sessions/sessions.module';
import { TokenModule } from '../auth/token.module';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminUserHandler } from './handlers/create-admin-user.handler';
import { DeactivateAdminUserHandler } from './handlers/deactivate-admin-user.handler';
import { FindAdminUsersHandler } from './handlers/find-admin-users.handler';
import { UpdateAdminUserHandler } from './handlers/update-admin-user.handler';
import { AdminUserRepository } from './repositories/admin-user.repository';

@Module({
  imports: [SessionsModule, TokenModule, AuditModule],
  controllers: [AdminUsersController],
  providers: [
    AdminUsersService,
    AdminUserRepository,
    CreateAdminUserHandler,
    FindAdminUsersHandler,
    UpdateAdminUserHandler,
    DeactivateAdminUserHandler,
  ],
  exports: [AdminUsersService],
})
export class AdminUsersModule {}
