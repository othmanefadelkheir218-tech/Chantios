import { TokenModule } from '../auth/token.module';
import { MediaModule } from '../media/media.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { DeactivateUserHandler } from './handlers/deactivate-user.handler';
import { FindUserHandler } from './handlers/find-user.handler';
import { FindUsersHandler } from './handlers/find-users.handler';
import { ReplaceAvatarHandler } from './handlers/replace-avatar.handler';
import { SetPinHandler } from './handlers/set-pin.handler';
import { UpdateProfileHandler } from './handlers/update-profile.handler';
import { UpdateUserHandler } from './handlers/update-user.handler';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    AuditModule,
    SessionsModule,
    TokenModule,
    RolesModule,
    TenantsModule,
    SubscriptionsModule,
    MediaModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    FindUsersHandler,
    FindUserHandler,
    UpdateUserHandler,
    UpdateProfileHandler,
    DeactivateUserHandler,
    SetPinHandler,
    ReplaceAvatarHandler,
  ],
  exports: [UsersService],
})
export class UsersModule {}
