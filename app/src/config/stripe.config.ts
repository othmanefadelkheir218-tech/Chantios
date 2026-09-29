import Stripe from 'stripe';
import { env } from './env.config';
import { errorMessage, ServiceStatus } from './status';

/** Shared Stripe client. Import it in any service that needs Stripe. */
export const stripe: Stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  timeout: 5000,
  maxNetworkRetries: 0, // fail fast: we only check the connection at startup
});

/** Calls the Stripe API with the secret key before Nest starts. Never throws. */
export async function connectStripe(): Promise<ServiceStatus> {
  try {
    const balance = await stripe.balance.retrieve();
    const mode = balance.livemode ? 'live' : 'test';
    return {
      name: 'Stripe',
      ok: true,
      detail: `API reachable, ${mode} mode`,
    };
  } catch (error) {
    return {
      name: 'Stripe',
      ok: false,
      detail: `cannot reach Stripe - ${errorMessage(error)}`,
    };
  }
}
