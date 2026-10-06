import { BadRequestException } from '@nestjs/common';
import { assertNoDuplicateUsers } from './task.helper';

/**
 * The one "assignees are valid" check, shared by `create-task` and
 * `set-assignees`: no duplicates, and every id is an ACTIVE user of this
 * tenant (a real account — it is the account that logs the hours later).
 * `isActiveInTenant` is `UsersService.findActiveInTenant` bound to the tenant.
 */
export async function assertValidAssignees(
  userIds: number[],
  isActiveInTenant: (userId: number) => Promise<boolean>,
): Promise<void> {
  assertNoDuplicateUsers(userIds);
  for (const userId of userIds) {
    if (!(await isActiveInTenant(userId))) {
      throw new BadRequestException(
        `User ${userId} is not an active user of this company`,
      );
    }
  }
}
