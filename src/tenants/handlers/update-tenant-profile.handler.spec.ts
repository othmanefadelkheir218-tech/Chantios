import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { PinoLogger } from 'nestjs-pino';
import type { AuditService } from '../../audit/audit.service';
import { UpdateTenantProfileDto } from '../dto/update-tenant-profile.dto';
import type { TenantRepository } from '../repositories/tenant.repository';
import { UpdateTenantProfileHandler } from './update-tenant-profile.handler';

// Step 18 — company profile (doc/notes/roles-permissions.md § Company profile).

const tenantRow = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Alpha',
  email: 'boss@alpha.be',
  iban: null,
  bic: null,
  currency: 'EUR',
  endOfDayReminderTime: new Date('1970-01-01T18:00:00.000Z'),
  updatedAt: new Date('2026-10-01T00:00:00Z'),
  ...over,
});

describe('UpdateTenantProfileHandler — step 18', () => {
  const logger = { info: jest.fn(), warn: jest.fn() } as unknown as PinoLogger;
  const tenants = { findById: jest.fn(), update: jest.fn() };
  const audit = { write: jest.fn() };
  const handler = new UpdateTenantProfileHandler(
    logger,
    tenants as unknown as TenantRepository,
    audit as unknown as AuditService,
    { execute: () => Promise.resolve({}) } as never,
    { execute: jest.fn() } as never,
    { emit: jest.fn() } as never,
  );
  const actor = { userId: 3, tenantId: 1, roleId: 1, email: 'boss@alpha.be' };

  beforeEach(() => jest.clearAllMocks());

  it('updates the caller own tenant, stores IBAN/BIC without spaces in capitals, writes audit', async () => {
    tenants.findById.mockResolvedValue(tenantRow());
    tenants.update.mockResolvedValue(
      tenantRow({
        iban: 'BE68539007547034',
        bic: 'GKCCBEBB',
        updatedAt: new Date(),
      }),
    );

    const result = await handler.execute(
      { iban: 'be68 5390 0754 7034', bic: 'gkccbebb' },
      actor,
      '1.2.3.4',
    );

    expect(tenants.update).toHaveBeenCalledWith(1, {
      iban: 'BE68539007547034',
      bic: 'GKCCBEBB',
    });
    const [entry] = audit.write.mock.calls[0] as [
      {
        oldValue: { iban: unknown };
        newValue: { iban: unknown };
      } & Record<string, unknown>,
    ];
    expect(entry).toMatchObject({
      tenantId: 1,
      userId: 3,
      action: 'update',
      entityType: 'tenant',
      ipAddress: '1.2.3.4',
    });
    expect(entry.oldValue.iban).toBeNull();
    expect(entry.newValue.iban).toBe('BE68539007547034');
    expect(result.endOfDayReminderTime).toBe('18:00');
  });

  it('null clears the IBAN', async () => {
    tenants.findById.mockResolvedValue(tenantRow({ iban: 'BE68539007547034' }));
    tenants.update.mockResolvedValue(tenantRow());
    await handler.execute({ iban: null }, actor, null);
    expect(tenants.update).toHaveBeenCalledWith(1, { iban: null });
  });

  it('writes no audit line when nothing changed', async () => {
    tenants.findById.mockResolvedValue(tenantRow());
    tenants.update.mockResolvedValue(tenantRow({ updatedAt: new Date() }));
    await handler.execute({ name: 'Alpha' }, actor, null);
    expect(audit.write).not.toHaveBeenCalled();
  });

  it('404 when the tenant is gone', async () => {
    tenants.findById.mockResolvedValue(null);
    await expect(handler.execute({}, actor, null)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('UpdateTenantProfileDto — step 18', () => {
  const errorsFor = async (body: object) =>
    (await validate(plainToInstance(UpdateTenantProfileDto, body))).map(
      (e) => e.property,
    );

  it('accepts a valid IBAN with spaces and a valid BIC', async () => {
    expect(
      await errorsFor({ iban: 'BE68 5390 0754 7034', bic: 'GKCCBEBB' }),
    ).toEqual([]);
  });

  it('refuses a bad IBAN and a bad BIC', async () => {
    expect(await errorsFor({ iban: 'BE00 1234', bic: 'NOPE' })).toEqual([
      'iban',
      'bic',
    ]);
  });

  it('has no email or currency field (the global pipe refuses them)', () => {
    const dto = plainToInstance(UpdateTenantProfileDto, {});
    expect(Object.keys(dto)).not.toContain('email');
    expect('currency' in dto).toBe(false);
  });
});
