import type { Response } from 'express';

// Step 18 — COOKIE_DOMAIN is read once when the helper loads, so each case loads it fresh.
function loadHelper(cookieDomain: string | undefined) {
  const previous = process.env.COOKIE_DOMAIN;
  if (cookieDomain === undefined) delete process.env.COOKIE_DOMAIN;
  else process.env.COOKIE_DOMAIN = cookieDomain;

  let helper!: typeof import('./cookie.helper');
  jest.isolateModules(() => {
    helper =
      jest.requireActual<typeof import('./cookie.helper')>('./cookie.helper');
  });

  if (previous === undefined) delete process.env.COOKIE_DOMAIN;
  else process.env.COOKIE_DOMAIN = previous;
  return helper;
}

function fakeResponse() {
  return {
    cookie: jest.fn<unknown, unknown[]>(),
    clearCookie: jest.fn<unknown, unknown[]>(),
  };
}

describe('cookie.helper COOKIE_DOMAIN — step 18', () => {
  it('sets and clears every auth cookie on the domain when it is set', () => {
    const helper = loadHelper('.example.com');
    const res = fakeResponse();

    helper.setAuthCookies(res as unknown as Response, 'a', 'r');
    helper.clearAuthCookies(res as unknown as Response);
    helper.setAdminAuthCookies(res as unknown as Response, 'a', 'r');
    helper.clearAdminAuthCookies(res as unknown as Response);

    for (const call of [
      ...res.cookie.mock.calls,
      ...res.clearCookie.mock.calls,
    ]) {
      expect(call.at(-1)).toMatchObject({
        domain: '.example.com',
        sameSite: 'lax',
      });
    }
    expect(res.cookie).toHaveBeenCalledTimes(4);
    expect(res.clearCookie).toHaveBeenCalledTimes(4);
  });

  it('sends no domain when it is not set (dev)', () => {
    const helper = loadHelper('');
    const res = fakeResponse();

    helper.setAuthCookies(res as unknown as Response, 'a', 'r');
    helper.clearAuthCookies(res as unknown as Response);

    for (const call of [
      ...res.cookie.mock.calls,
      ...res.clearCookie.mock.calls,
    ]) {
      expect(call.at(-1)).not.toHaveProperty('domain');
    }
  });
});
