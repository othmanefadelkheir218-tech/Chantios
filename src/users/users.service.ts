import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserHandler } from './handlers/create-user.handler';
import { DeleteUserHandler } from './handlers/delete-user.handler';
import { FindUserHandler } from './handlers/find-user.handler';
import { FindUsersHandler } from './handlers/find-users.handler';
import { UpdateUserHandler } from './handlers/update-user.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class UsersService {
  constructor(
    private readonly createUser: CreateUserHandler,
    private readonly findUsers: FindUsersHandler,
    private readonly findUser: FindUserHandler,
    private readonly updateUser: UpdateUserHandler,
    private readonly deleteUser: DeleteUserHandler,
  ) {}

  create(dto: CreateUserDto) {
    return this.createUser.execute(dto);
  }

  findAll(query: FindUsersQueryDto) {
    return this.findUsers.execute(query);
  }

  findOne(id: string) {
    return this.findUser.execute(id);
  }

  update(id: string, dto: UpdateUserDto) {
    return this.updateUser.execute(id, dto);
  }

  remove(id: string) {
    return this.deleteUser.execute(id);
  }
}
