import { BadRequestException } from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { env } from '../../config/env.config';
import * as vies from '../helpers/vies.helper';
import { CheckVatNumberHandler } from './check-vat-number.handler';
import { PrepareTaxFieldsHandler } from './prepare-tax-fields.handler';

const tenant = (over: Partial<Tenant> = {}) =>
  ({
    id: 1,
    country: 'BE',
    vatNumber: null,
    vatNumberStatus: null,
    ...over,
  }) as Tenant;

const logger = { info: jest.fn(), warn: jest.fn() };

describe('PrepareTaxFieldsHandler (step 27)', () => {
  const vatRates = { assertSelectableCountry: jest.fn() };
  const handler = new PrepareTaxFieldsHandler(
    logger as never,
    vatRates as never,
  );
  const check = env.VAT_NUMBER_CHECK;

  beforeEach(() => {
    jest.resetAllMocks();
    env.VAT_NUMBER_CHECK = 'vies';
  });
  afterAll(() => (env.VAT_NUMBER_CHECK = check));

  it('create: the country is required', async () => {
    await expect(handler.execute({}, null)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create: checks the country against the TVA table', async () => {
    await expect(handler.execute({ country: 'fr' }, null)).resolves.toEqual({
      country: 'FR',
    });
    expect(vatRates.assertSelectableCountry).toHaveBeenCalledWith(
      'FR',
      undefined,
    );
  });

  it.each([null, ''])(
    'update: refuses to empty the country (%p)',
    async (c) => {
      await expect(
        handler.execute({ country: c }, tenant()),
      ).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it('update: no country sent → not touched', async () => {
    await expect(handler.execute({}, tenant())).resolves.toEqual({});
    expect(vatRates.assertSelectableCountry).not.toHaveBeenCalled();
  });

  it('update: passes the old country (an unchanged one is accepted)', async () => {
    await handler.execute({ country: 'BE' }, tenant({ country: 'BE' }));
    expect(vatRates.assertSelectableCountry).toHaveBeenCalledWith('BE', 'BE');
  });

  it('a new EU TVA number → normalized, pending (VIES asked next)', async () => {
    await expect(
      handler.execute({ vatNumber: 'be 0123.456.789' }, tenant()),
    ).resolves.toEqual({
      vatNumber: 'BE0123456789',
      vatNumberStatus: 'pending',
      vatNumberCheckedAt: null,
    });
  });

  it('VAT_NUMBER_CHECK=off → not_checked', async () => {
    env.VAT_NUMBER_CHECK = 'off';
    const data = await handler.execute(
      { vatNumber: 'FR12345678901' },
      tenant(),
    );
    expect(data.vatNumberStatus).toBe('not_checked');
  });

  it('test mode: a non-EU number still gets no status (never reverse charge)', async () => {
    env.VAT_NUMBER_CHECK = 'off';
    const data = await handler.execute({ vatNumber: 'CHE123456789' }, tenant());
    expect(data.vatNumberStatus).toBeNull();
  });

  it('"hello" → 400, even in test mode', async () => {
    env.VAT_NUMBER_CHECK = 'off';
    await expect(
      handler.execute({ vatNumber: 'hello' }, tenant()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('a non-EU number → no VIES status', async () => {
    const data = await handler.execute({ vatNumber: 'CHE123456789' }, tenant());
    expect(data.vatNumberStatus).toBeNull();
  });

  it('a wrong format → 400', async () => {
    await expect(
      handler.execute({ vatNumber: '0123456789' }, tenant()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('the same number again → its status is kept', async () => {
    await expect(
      handler.execute(
        { vatNumber: 'BE 0123 456 789' },
        tenant({ vatNumber: 'BE0123456789', vatNumberStatus: 'valid' }),
      ),
    ).resolves.toEqual({ vatNumber: 'BE0123456789' });
  });

  it('cleared → number and status cleared', async () => {
    await expect(
      handler.execute({ vatNumber: '' }, tenant({ vatNumber: 'BE0123456789' })),
    ).resolves.toEqual({
      vatNumber: null,
      vatNumberStatus: null,
      vatNumberCheckedAt: null,
    });
  });
});

describe('CheckVatNumberHandler (step 27, Q9)', () => {
  const repo = { findById: jest.fn(), update: jest.fn() };
  const events = { emit: jest.fn() };
  const handler = new CheckVatNumberHandler(
    logger as never,
    repo as never,
    events as never,
  );
  const viesSpy = jest.spyOn(vies, 'checkWithVies');
  const pending = tenant({
    vatNumber: 'FR12345678901',
    vatNumberStatus: 'pending',
  });
  afterAll(() => viesSpy.mockRestore());

  beforeEach(() => {
    jest.clearAllMocks();
    env.VAT_NUMBER_CHECK = 'vies';
    repo.update.mockImplementation((_id: number, data: object) => ({
      ...pending,
      ...data,
    }));
  });

  it('not pending → no VIES call', async () => {
    repo.findById.mockResolvedValue(
      tenant({ vatNumber: 'FR1', vatNumberStatus: 'valid' }),
    );
    await handler.execute(1);
    expect(viesSpy).not.toHaveBeenCalled();
  });

  it.each(['valid', 'invalid'] as const)(
    'VIES says %s → saved, billing told',
    async (answer) => {
      repo.findById.mockResolvedValue(pending);
      viesSpy.mockResolvedValue(answer);
      await handler.execute(1);
      expect(viesSpy).toHaveBeenCalledWith('FR12345678901');
      expect(repo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ vatNumberStatus: answer }),
      );
      expect(events.emit).toHaveBeenCalledWith('tenant.tax_profile_changed', {
        tenantId: 1,
      });
    },
  );

  it('VIES busy → stays pending, nothing saved', async () => {
    repo.findById.mockResolvedValue(pending);
    viesSpy.mockResolvedValue('pending');
    await handler.execute(1);
    expect(repo.update).not.toHaveBeenCalled();
    expect(events.emit).not.toHaveBeenCalled();
  });

  it('emit: false → the caller sends the event', async () => {
    repo.findById.mockResolvedValue(pending);
    viesSpy.mockResolvedValue('valid');
    await handler.execute(1, false);
    expect(events.emit).not.toHaveBeenCalled();
  });
});

describe('checkWithVies', () => {
  const answer = (body: object, ok = true) =>
    jest.fn().mockResolvedValue({ ok, json: () => Promise.resolve(body) });

  it.each([
    [{ valid: true }, 'valid'],
    [{ valid: false }, 'invalid'],
    [
      {
        actionSucceed: false,
        errorWrappers: [{ error: 'MS_MAX_CONCURRENT_REQ' }],
      },
      'pending',
    ],
  ])('%p → %s', async (body, expected) => {
    await expect(
      vies.checkWithVies('BE0123456789', answer(body) as never),
    ).resolves.toBe(expected);
  });

  it('HTTP error or network error → pending', async () => {
    await expect(
      vies.checkWithVies('BE0123456789', answer({}, false) as never),
    ).resolves.toBe('pending');
    await expect(
      vies.checkWithVies(
        'BE0123456789',
        jest.fn().mockRejectedValue(new Error('down')) as never,
      ),
    ).resolves.toBe('pending');
  });

  it('sends the country and the number apart', async () => {
    const fetchFn = answer({ valid: true });
    await vies.checkWithVies('BE0123456789', fetchFn as never);
    const init = (fetchFn.mock.calls[0] as [string, { body: string }])[1];
    expect(JSON.parse(init.body)).toEqual({
      countryCode: 'BE',
      vatNumber: '0123456789',
    });
  });
});
