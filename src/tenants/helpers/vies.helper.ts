/**
 * Step 27 (Q9) — asks VIES, the free EU service (no key), whether a TVA number
 * exists. `pending` = VIES is busy (`actionSucceed: false`, e.g.
 * `MS_MAX_CONCURRENT_REQ`), down, or too slow: the retry job asks again.
 */
export type ViesAnswer = 'valid' | 'invalid' | 'pending';

export const VIES_URL =
  'https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number';

type ViesResponse = { valid?: boolean; actionSucceed?: boolean };

/** `normalized` = "BE0123456789". Never throws. */
export async function checkWithVies(
  normalized: string,
  fetchFn: typeof fetch = fetch,
): Promise<ViesAnswer> {
  try {
    const response = await fetchFn(VIES_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        countryCode: normalized.slice(0, 2),
        vatNumber: normalized.slice(2),
      }),
      // The French service often needs ~8 s: 15 s before we call it "busy".
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return 'pending';
    const body = (await response.json()) as ViesResponse;
    if (body.actionSucceed === false || typeof body.valid !== 'boolean') {
      return 'pending';
    }
    return body.valid ? 'valid' : 'invalid';
  } catch {
    return 'pending';
  }
}
