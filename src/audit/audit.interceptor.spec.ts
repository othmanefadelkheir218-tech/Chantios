import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AUDIT_SKIP_KEY } from './helpers/audit.helper';

describe('AuditInterceptor', () => {
  const audit = { write: jest.fn().mockResolvedValue(undefined) };
  const cls = { get: jest.fn() };
  const logger = { error: jest.fn() };
  const reflector = {
    get: jest
      .fn()
      .mockReturnValue({ action: 'deactivate', entityType: 'plan' }),
  };
  const context = {
    getHandler: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        params: { id: '3' },
        body: {},
        headers: {},
        socket: {},
      }),
    }),
  } as unknown as ExecutionContext;
  const interceptor = () =>
    new AuditInterceptor(
      logger as never,
      reflector as unknown as Reflector,
      audit as never,
      cls as never,
    );

  beforeEach(() => {
    audit.write.mockClear();
    cls.get.mockReset();
  });

  it('writes one audit row after a successful route', async () => {
    await lastValueFrom(
      interceptor().intercept(context, { handle: () => of({ id: 3 }) }),
    );
    expect(audit.write).toHaveBeenCalledTimes(1);
  });

  it('writes nothing when the handler asked to skip', async () => {
    cls.get.mockImplementation((key: string) => key === AUDIT_SKIP_KEY);
    await lastValueFrom(
      interceptor().intercept(context, { handle: () => of({ id: 3 }) }),
    );
    expect(audit.write).not.toHaveBeenCalled();
  });
});
