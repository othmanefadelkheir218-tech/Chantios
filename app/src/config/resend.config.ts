import { Resend } from 'resend';
import { env } from './env.config';
import { errorMessage, ServiceStatus } from './status';

/** Shared Resend client. Import it in any service that sends emails. */
export const resend: Resend = new Resend(env.RESEND_API_KEY);

/** Checks the API key and the sender domain before Nest starts. Never throws. */
export async function connectResend(): Promise<ServiceStatus> {
  const senderDomain = env.EMAIL.split('@')[1];

  try {
    const { data, error } = await resend.domains.list();

    // A "sending only" key cannot list domains, but the key itself is valid.
    if (error?.name === 'restricted_api_key') {
      return {
        name: 'Resend',
        ok: true,
        detail: `API key valid (sending only), sender ${env.EMAIL}`,
      };
    }
    if (error) {
      return {
        name: 'Resend',
        ok: false,
        detail: `cannot reach Resend - ${error.message}`,
      };
    }

    const domain = data.data.find((d) => d.name === senderDomain);
    if (domain?.status !== 'verified') {
      return {
        name: 'Resend',
        ok: false,
        detail: `sender domain ${senderDomain} is ${domain?.status ?? 'not added'} in Resend`,
      };
    }
    return {
      name: 'Resend',
      ok: true,
      detail: `API reachable, sender ${env.EMAIL} (domain verified)`,
    };
  } catch (error) {
    return {
      name: 'Resend',
      ok: false,
      detail: `cannot reach Resend - ${errorMessage(error)}`,
    };
  }
}
