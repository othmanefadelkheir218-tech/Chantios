const list = jest.fn();

jest.mock('./env.config', () => ({
  env: { RESEND_API_KEY: 're_fake', EMAIL: 'no-reply@example.com' },
}));
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ domains: { list } })),
}));

import { connectResend } from './resend.config';

const domains = (status: string) => ({
  data: { data: [{ name: 'example.com', status }] },
  error: null,
});

describe('connectResend', () => {
  beforeEach(() => list.mockReset());

  it('returns ok when the sender domain is verified', async () => {
    list.mockResolvedValue(domains('verified'));
    await expect(connectResend()).resolves.toEqual({
      name: 'Resend',
      ok: true,
      detail: 'API reachable, sender no-reply@example.com (domain verified)',
    });
  });

  it('returns ok=false when the sender domain is not verified', async () => {
    list.mockResolvedValue(domains('pending'));
    const status = await connectResend();
    expect(status.ok).toBe(false);
    expect(status.detail).toContain('pending');
  });

  it('returns ok=false when the sender domain is not added', async () => {
    list.mockResolvedValue({ data: { data: [] }, error: null });
    const status = await connectResend();
    expect(status.ok).toBe(false);
    expect(status.detail).toContain('not added');
  });

  it('accepts a sending-only key (it cannot list domains)', async () => {
    list.mockResolvedValue({
      data: null,
      error: { name: 'restricted_api_key', message: 'restricted' },
    });
    const status = await connectResend();
    expect(status.ok).toBe(true);
    expect(status.detail).toContain('sending only');
  });

  it('returns ok=false when the API key is invalid', async () => {
    list.mockResolvedValue({
      data: null,
      error: { name: 'invalid_api_key', message: 'API key is invalid' },
    });
    const status = await connectResend();
    expect(status.ok).toBe(false);
    expect(status.detail).toContain('API key is invalid');
  });

  it('never throws when the network fails', async () => {
    list.mockRejectedValue(new Error('ECONNREFUSED'));
    const status = await connectResend();
    expect(status.ok).toBe(false);
    expect(status.detail).toContain('ECONNREFUSED');
  });
});
