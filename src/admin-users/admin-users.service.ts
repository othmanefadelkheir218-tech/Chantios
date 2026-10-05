import { Injectable } from '@nestjs/common';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { FindAdminUsersQueryDto } from './dto/find-admin-users-query.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { CreateAdminUserHandler } from './handlers/create-admin-user.handler';
import { DeactivateAdminUserHandler } from './handlers/deactivate-admin-user.handler';
import { FindAdminUsersHandler } from './handlers/find-admin-users.handler';
import { UpdateAdminUserHandler } from './handlers/update-admin-user.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class AdminUsersService {
  constructor(
    private readonly createAdminUser: CreateAdminUserHandler,
    private readonly findAdminUsers: FindAdminUsersHandler,
    private readonly updateAdminUser: UpdateAdminUserHandler,
    private readonly deactivateAdminUser: DeactivateAdminUserHandler,
  ) {}

  create(dto: CreateAdminUserDto) {
    return this.createAdminUser.execute(dto);
  }

  findAll(query: FindAdminUsersQueryDto) {
    return this.findAdminUsers.execute(query);
  }

  update(id: number, dto: UpdateAdminUserDto) {
    return this.updateAdminUser.execute(id, dto);
  }

  deactivate(id: number) {
    return this.deactivateAdminUser.execute(id);
  }
}
