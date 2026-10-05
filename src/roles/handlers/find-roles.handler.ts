import { Injectable } from '@nestjs/common';
import { toRoleEntity } from '../helpers/role.helper';
import { RoleRepository } from '../repositories/role.repository';

@Injectable()
export class FindRolesHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute() {
    const roles = await this.roles.findAllRoles();
    return roles.map(toRoleEntity);
  }
}
