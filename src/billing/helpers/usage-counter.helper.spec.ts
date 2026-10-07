import { Test } from '@nestjs/testing';
import { ClientsService } from '../../clients/clients.service';
import { MediaService } from '../../media/media.service';
import { SubcontractorsService } from '../../subcontractors/subcontractors.service';
import { UsersService } from '../../users/users.service';
import { UsageCounterHelper } from './usage-counter.helper';

/** The 7 seeded roles are fixed (prisma/seeds/data.seed.ts) — worker is id 5. */
const WORKER_ROLE_ID = 5;

describe('UsageCounterHelper — the single place usage is counted', () => {
  const users = {
    countActiveByRole: jest.fn(),
    countActiveExcludingRole: jest.fn(),
  };
  const clients = { countActive: jest.fn() };
  const subcontractors = { countActive: jest.fn() };
  const media = { getStorageUsage: jest.fn() };

  let usageCounter: UsageCounterHelper;

  beforeEach(async () => {
    jest.resetAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UsageCounterHelper,
        { provide: UsersService, useValue: users },
        { provide: ClientsService, useValue: clients },
        { provide: SubcontractorsService, useValue: subcontractors },
        { provide: MediaService, useValue: media },
      ],
    }).compile();

    usageCounter = module.get(UsageCounterHelper);
  });

  it('counts workers by role id 5, the seeded worker role', async () => {
    users.countActiveByRole.mockResolvedValue(3);
    users.countActiveExcludingRole.mockResolvedValue(2);
    clients.countActive.mockResolvedValue(0);
    subcontractors.countActive.mockResolvedValue(0);
    media.getStorageUsage.mockResolvedValue({ gb: 0 });

    await usageCounter.countAll(7);

    expect(users.countActiveByRole).toHaveBeenCalledWith(7, WORKER_ROLE_ID);
  });

  it('counts managers as every active user excluding the worker role', async () => {
    users.countActiveByRole.mockResolvedValue(3);
    users.countActiveExcludingRole.mockResolvedValue(2);
    clients.countActive.mockResolvedValue(0);
    subcontractors.countActive.mockResolvedValue(0);
    media.getStorageUsage.mockResolvedValue({ gb: 0 });

    await usageCounter.countAll(7);

    expect(users.countActiveExcludingRole).toHaveBeenCalledWith(
      7,
      WORKER_ROLE_ID,
    );
  });

  it('returns a flat object with exactly the 5 billed dimensions, no retention_days', async () => {
    users.countActiveByRole.mockResolvedValue(3);
    users.countActiveExcludingRole.mockResolvedValue(2);
    clients.countActive.mockResolvedValue(42);
    subcontractors.countActive.mockResolvedValue(8);
    media.getStorageUsage.mockResolvedValue({ gb: 12.4 });

    const result = await usageCounter.countAll(7);

    expect(result).toEqual({
      max_workers: 3,
      max_managers: 2,
      max_clients: 42,
      max_subcontractors: 8,
      storage_gb: 12.4,
    });
    expect(result).not.toHaveProperty('retention_days');
  });
});
