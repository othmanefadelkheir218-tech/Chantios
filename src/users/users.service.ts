import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { SetPinDto } from './dto/set-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { DeactivateUserHandler } from './handlers/deactivate-user.handler';
import { FindUserHandler } from './handlers/find-user.handler';
import { FindUsersHandler } from './handlers/find-users.handler';
import { ReplaceAvatarHandler } from './handlers/replace-avatar.handler';
import { SetPinHandler } from './handlers/set-pin.handler';
import { UpdateProfileHandler } from './handlers/update-profile.handler';
import { UpdateUserHandler } from './handlers/update-user.handler';
import { UserRepository } from './repositories/user.repository';

/**
 * Orchestration for the HTTP routes, plus the internal lookups `auth` and
 * `invitations` need (login, registration, password reset, mobile PIN). The
 * internal methods are thin passthroughs to the repository — no business
 * decision to put in a handler, same spirit as a simple `find` elsewhere.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly users: UserRepository,
    private readonly findUsers: FindUsersHandler,
    private readonly findUser: FindUserHandler,
    private readonly updateUser: UpdateUserHandler,
    private readonly updateProfile: UpdateProfileHandler,
    private readonly deactivateUser: DeactivateUserHandler,
    private readonly setPin: SetPinHandler,
    private readonly replaceAvatar: ReplaceAvatarHandler,
  ) {}

  findAll(query: FindUsersQueryDto) {
    return this.findUsers.execute(query);
  }

  findOne(id: number) {
    return this.findUser.execute(id);
  }

  update(id: number, dto: UpdateUserDto, actor: AuthenticatedUser) {
    return this.updateUser.execute(id, dto, actor);
  }

  updateOwnProfile(dto: UpdateProfileDto, actor: AuthenticatedUser) {
    return this.updateProfile.execute(dto, actor);
  }

  deactivate(id: number, actor: AuthenticatedUser) {
    return this.deactivateUser.execute(id, actor);
  }

  setMobilePin(id: number, dto: SetPinDto, actor: AuthenticatedUser) {
    return this.setPin.execute(id, dto, actor);
  }

  replaceOwnAvatar(file: Express.Multer.File, actor: AuthenticatedUser) {
    return this.replaceAvatar.execute(file, actor);
  }

  // ---- Internal API for `auth` and `invitations` ----

  /** Login has no company field — this is intentionally not tenant-filtered. */
  findByEmail(email: string): Promise<User | null> {
    return this.users.findByEmail(email);
  }

  findByIdRaw(id: number): Promise<User | null> {
    return this.users.findByIdUnscoped(id);
  }

  /**
   * An ACTIVE user of this tenant, or `null`. `findByIdRaw` is not tenant-filtered,
   * so anything that takes a user id from a request body (task assignees,
   * time-entry owner) must go through this, never `findByIdRaw`.
   */
  async findActiveInTenant(id: number, tenantId: number): Promise<User | null> {
    const user = await this.users.findByIdUnscoped(id);
    return user && user.tenantId === tenantId && user.isActive ? user : null;
  }

  /** `tx` — step 02 registration runs this inside its own transaction. */
  create(
    data: Prisma.UserCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<User> {
    return this.users.create(data, tx);
  }

  setPasswordHash(id: number, passwordHash: string): Promise<User> {
    return this.users.setPasswordHash(id, passwordHash);
  }

  setEmailVerified(id: number): Promise<User> {
    return this.users.setEmailVerified(id);
  }

  bumpFailedPin(id: number): Promise<number> {
    return this.users.bumpFailedPin(id);
  }

  resetFailedPin(id: number): Promise<void> {
    return this.users.resetFailedPin(id);
  }

  countActiveByRole(tenantId: number, roleId: number): Promise<number> {
    return this.users.countActiveByRole(tenantId, roleId);
  }
}
