import { SetMetadata } from '@nestjs/common';

export const ALLOW_LAPSED_SUBSCRIPTION_KEY = 'allowLapsedSubscription';

/**
 * A blocked company (`cancelled` subscription) may still call this route —
 * only the billing read routes, so its admin can see the billing page and pay
 * (doc/notes/subscription-plans.md § The end of the trial). Read by
 * `SubscriptionGuard`. Permissions still apply.
 */
export const AllowLapsedSubscription = () =>
  SetMetadata(ALLOW_LAPSED_SUBSCRIPTION_KEY, true);
