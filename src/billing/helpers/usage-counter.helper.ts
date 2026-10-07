import { Injectable } from '@nestjs/common';
import { ClientsService } from '../../clients/clients.service';
import { MediaService } from '../../media/media.service';
import { SubcontractorsService } from '../../subcontractors/subcontractors.service';
import { UsersService } from '../../users/users.service';

/** The 5 dimensions actually billed. `retention_days` is a value, never counted. */
export const BILLED_FEATURE_KEYS = [
  'max_workers',
  'max_managers',
  'max_clients',
  'max_subcontractors',
  'storage_gb',
] as const;

/** The 7 seeded roles are fixed (prisma/seeds/data.seed.ts) — worker is id 5. */
const WORKER_ROLE_ID = 5;

/**
 * THE single place "how much does tenant X actually use right now" is
 * computed — both the live `GET /api/billing/usage` read and the renewal
 * snapshot call this, so they can never disagree (doc/notes/subscription-plans.md).
 * Every count goes through the owning module's SERVICE, never its repository.
 *
 * GB here means GiB (bytes / 1024^3) — the exact same divisor
 * `MediaService.getStorageUsage()` already uses for its own
 * `GET /api/media/storage/usage` route, reused as-is so the two never disagree.
 */
@Injectable()
export class UsageCounterHelper {
  constructor(
    private readonly users: UsersService,
    private readonly clients: ClientsService,
    private readonly subcontractors: SubcontractorsService,
    private readonly media: MediaService,
  ) {}

  async countAll(tenantId: number): Promise<Record<string, number>> {
    const [workers, managers, clients, subs, storage] = await Promise.all([
      this.users.countActiveByRole(tenantId, WORKER_ROLE_ID),
      this.users.countActiveExcludingRole(tenantId, WORKER_ROLE_ID),
      this.clients.countActive(),
      this.subcontractors.countActive(),
      this.media.getStorageUsage(),
    ]);

    return {
      max_workers: workers,
      max_managers: managers,
      max_clients: clients,
      max_subcontractors: subs,
      storage_gb: storage.gb,
    };
  }
}
