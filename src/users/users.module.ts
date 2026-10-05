import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { SessionsModule } from '../sessions/sessions.module';
import { DeactivateUserHandler } from './handlers/deactivate-user.handler';
import { FindUserHandler } from './handlers/find-user.handler';
import { FindUsersHandler } from './handlers/find-users.handler';
import { SetPinHandler } from './handlers/set-pin.handler';
import { UpdateProfileHandler } from './handlers/update-profile.handler';
import { UpdateUserHandler } from './handlers/update-user.handler';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuditModule, SessionsModule],
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
  ],
  exports: [UsersService],
})
export class UsersModule {}
