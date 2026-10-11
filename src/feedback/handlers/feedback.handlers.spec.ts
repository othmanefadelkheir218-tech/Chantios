import { NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { FindMyFeedbackHandler } from './find-my-feedback.handler';
import { UpdateFeedbackStatusHandler } from './update-feedback-status.handler';

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
};

const actor: AuthenticatedUser = {
  userId: 5,
  tenantId: 7,
  roleId: 5,
  email: 'worker@tenant.test',
};

describe('FindMyFeedbackHandler', () => {
  const feedback = { findMine: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    feedback.findMine.mockResolvedValue([[], 0]);
  });

  it('lists only what the caller submitted', async () => {
    await new FindMyFeedbackHandler(logger as never, feedback as never).execute(
      { page: 1, limit: 20 },
      actor,
    );

    expect(feedback.findMine).toHaveBeenCalledWith({ submittedBy: 5 }, 0, 20);
  });
});

describe('UpdateFeedbackStatusHandler', () => {
  const feedback = { findById: jest.fn(), updateStatus: jest.fn() };
  const audit = { write: jest.fn() };
  const adminActor = { adminUserId: 9, ip: '10.0.0.1' };

  const handler = () =>
    new UpdateFeedbackStatusHandler(
      logger as never,
      feedback as never,
      audit as never,
    );

  beforeEach(() => jest.clearAllMocks());

  it('writes an audit row with the company, the admin and both statuses', async () => {
    feedback.findById.mockResolvedValue({ id: 3, tenantId: 7, status: 'new' });
    feedback.updateStatus.mockResolvedValue({
      id: 3,
      tenantId: 7,
      status: 'planned',
    });

    await handler().execute(3, { status: 'planned' } as never, adminActor);

    expect(audit.write).toHaveBeenCalledWith({
      tenantId: 7,
      adminUserId: 9,
      action: 'update_status',
      entityType: 'feedback',
      entityId: 3,
      oldValue: { status: 'new' },
      newValue: { status: 'planned' },
      ipAddress: '10.0.0.1',
    });
  });

  it('answers 404 and writes nothing for an unknown id', async () => {
    feedback.findById.mockResolvedValue(null);

    await expect(
      handler().execute(99, { status: 'planned' } as never, adminActor),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(feedback.updateStatus).not.toHaveBeenCalled();
    expect(audit.write).not.toHaveBeenCalled();
  });
});
