const retrieve = jest.fn();

jest.mock('./env.config', () => ({
  env: { STRIPE_SECRET_KEY: 'sk_test_fake' },
}));
jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({ balance: { retrieve } })),
);

import { connectStripe } from './stripe.config';

describe('connectStripe', () => {
  beforeEach(() => retrieve.mockReset());

  it('returns ok in test mode', async () => {
    retrieve.mockResolvedValue({ livemode: false });
    await expect(connectStripe()).resolves.toEqual({
      name: 'Stripe',
      ok: true,
      detail: 'API reachable, test mode',
    });
  });

  it('returns ok in live mode', async () => {
    retrieve.mockResolvedValue({ livemode: true });
    const status = await connectStripe();
    expect(status.detail).toContain('live mode');
  });

  it('returns ok=false and never throws when Stripe fails', async () => {
    retrieve.mockRejectedValue(new Error('Invalid API Key provided'));
    const status = await connectStripe();
    expect(status.ok).toBe(false);
    expect(status.detail).toContain('Invalid API Key provided');
  });
});
