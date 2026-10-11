import { addOneMonth } from './billing-period.helper';

const utc = (iso: string) => new Date(iso);

describe('addOneMonth', () => {
  it('adds one calendar month and keeps the time of day', () => {
    expect(addOneMonth(utc('2026-10-09T13:43:47.759Z')).toISOString()).toBe(
      '2026-11-09T13:43:47.759Z',
    );
  });

  it('crosses the year: December to January', () => {
    expect(addOneMonth(utc('2026-12-15T08:00:00.000Z')).toISOString()).toBe(
      '2027-01-15T08:00:00.000Z',
    );
  });

  it('31 January gives the last day of February, not March', () => {
    expect(addOneMonth(utc('2027-01-31T10:00:00.000Z')).toISOString()).toBe(
      '2027-02-28T10:00:00.000Z',
    );
  });

  it('31 January in a leap year gives 29 February', () => {
    expect(addOneMonth(utc('2028-01-31T10:00:00.000Z')).toISOString()).toBe(
      '2028-02-29T10:00:00.000Z',
    );
  });

  it('30 April + 1 month = 30 May; 31 March + 1 month = 30 April', () => {
    expect(addOneMonth(utc('2026-04-30T00:00:00.000Z')).toISOString()).toBe(
      '2026-05-30T00:00:00.000Z',
    );
    expect(addOneMonth(utc('2026-03-31T00:00:00.000Z')).toISOString()).toBe(
      '2026-04-30T00:00:00.000Z',
    );
  });

  it('does not change the original date', () => {
    const start = utc('2026-10-09T13:43:47.759Z');
    addOneMonth(start);
    expect(start.toISOString()).toBe('2026-10-09T13:43:47.759Z');
  });

  it.each(['UTC', 'Europe/Brussels', 'America/New_York', 'Africa/Casablanca'])(
    'the UTC hour never moves across a clock change, even with TZ=%s',
    (tz) => {
      const previous = process.env.TZ;
      process.env.TZ = tz;
      try {
        // 9 Oct -> 9 Nov crosses the end of summer time in Europe and the US.
        expect(addOneMonth(utc('2026-10-09T13:43:47.759Z')).toISOString()).toBe(
          '2026-11-09T13:43:47.759Z',
        );
        // 9 Mar -> 9 Apr crosses the start of summer time.
        expect(addOneMonth(utc('2027-03-09T13:43:47.759Z')).toISOString()).toBe(
          '2027-04-09T13:43:47.759Z',
        );
      } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
      }
    },
  );
});
