import { Injectable } from '@nestjs/common';
import { buildPermissionsMatrix } from '../helpers/role.helper';
import { RoleRepository } from '../repositories/role.repository';

/** `GET /api/roles/permissions` — code defaults + this tenant's overrides. */
@Injectable()
export class FindPermissionsHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute() {
    const [roles, overrides] = await Promise.all([
      this.roles.findAllRoles(),
      this.roles.findAllOverrides(),
    ]);
    return buildPermissionsMatrix(roles, overrides);
  }
}
