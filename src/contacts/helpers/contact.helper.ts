import type { UsersService } from '../../users/users.service';

type DirectoryRow = NonNullable<
  Awaited<ReturnType<UsersService['findDirectoryEntry']>>
>;

/**
 * What may leave the contacts module (doc/notes/contacts.md). An allow-list:
 * `hourly_rate` and the credentials are never read, so never sent.
 */
export function toContactEntity(row: DirectoryRow, avatarUrl: string | null) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    roleId: row.roleId,
    role: row.role.name,
    isActive: row.isActive,
    avatarUrl,
  };
}
