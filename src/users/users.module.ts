import { Module } from '@nestjs/common';
import { CreateUserHandler } from './handlers/create-user.handler';
import { DeleteUserHandler } from './handlers/delete-user.handler';
import { FindUserHandler } from './handlers/find-user.handler';
import { FindUsersHandler } from './handlers/find-users.handler';
import { UpdateUserHandler } from './handlers/update-user.handler';
import { UserRepository } from './repositories/user.repository';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    UserRepository,
    CreateUserHandler,
    FindUsersHandler,
    FindUserHandler,
    UpdateUserHandler,
    DeleteUserHandler,
  ],
  exports: [UsersService],
})
export class UsersModule {}
