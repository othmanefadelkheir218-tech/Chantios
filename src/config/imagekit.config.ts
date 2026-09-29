import ImageKit from '@imagekit/nodejs';
import { env } from './env.config';
import { errorMessage, ServiceStatus } from './status';

/** Shared ImageKit client. Import it in any service that uploads files. */
export const imagekit: ImageKit = new ImageKit({
  privateKey: env.IMAGEKIT_PRIVATE_KEY,
  timeout: 5000,
  maxRetries: 0, // fail fast: we only check the connection at startup
});

/** Calls the ImageKit API with the private key before Nest starts. Never throws. */
export async function connectImageKit(): Promise<ServiceStatus> {
  try {
    await imagekit.assets.list({ limit: 1 });
    return {
      name: 'ImageKit',
      ok: true,
      detail: `API reachable (${env.IMAGEKIT_URL_ENDPOINT})`,
    };
  } catch (error) {
    return {
      name: 'ImageKit',
      ok: false,
      detail: `cannot reach ImageKit - ${errorMessage(error)}`,
    };
  }
}
