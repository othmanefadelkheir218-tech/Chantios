const list = jest.fn();

jest.mock('./env.config', () => ({
  env: {
    IMAGEKIT_PRIVATE_KEY: 'private_fake',
    IMAGEKIT_URL_ENDPOINT: 'https://ik.imagekit.io/fake',
  },
}));
jest.mock('@imagekit/nodejs', () =>
  jest.fn().mockImplementation(() => ({ assets: { list } })),
);

import { connectImageKit } from './imagekit.config';

describe('connectImageKit', () => {
  beforeEach(() => list.mockReset());

  it('returns ok when the API answers', async () => {
    list.mockResolvedValue([]);
    await expect(connectImageKit()).resolves.toEqual({
      name: 'ImageKit',
      ok: true,
      detail: 'API reachable (https://ik.imagekit.io/fake)',
    });
    expect(list).toHaveBeenCalledWith({ limit: 1 });
  });

  it('returns ok=false and never throws when ImageKit fails', async () => {
    list.mockRejectedValue(
      new Error('403 Your account cannot be authenticated.'),
    );
    const status = await connectImageKit();
    expect(status.ok).toBe(false);
    expect(status.detail).toContain('cannot be authenticated');
  });
});
