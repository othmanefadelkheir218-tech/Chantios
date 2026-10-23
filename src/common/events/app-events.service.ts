import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

/** Every in-process event, with the shape of what it carries. */
export interface AppEvents {
  /** A platform admin changed a company's status (`active` / `suspended` / `banned`). */
  'tenant.status_changed': {
    tenantId: number;
    companyName: string;
    status: string;
  };
  /** A tenant admin deactivated a user (step 25: their Gmail inboxes are removed). */
  'user.deactivated': { tenantId: number; userId: number };
  /**
   * Step 27 — the super-admin changed a TVA-table row (rate or EU flag). Billing
   * re-points the card subscriptions of that country, from the next invoice.
   */
  'vat_rate.changed': { countryCode: string };
  /**
   * Step 27 — a company's country or TVA number (or its VIES status) changed.
   * Billing re-syncs its Stripe TVA, from the next invoice.
   */
  'tenant.tax_profile_changed': { tenantId: number };
}

/**
 * A tiny in-process event bus. It exists to cut a module cycle, not to be a
 * framework: `tenants` must not import `notifications` (notifications reads
 * users, users reach media, media reaches tenants), so `tenants` announces
 * what happened and `notifications` listens. A listener that throws never
 * breaks the emitter — the thing that happened is already saved.
 */
@Injectable()
export class AppEventsService {
  private readonly emitter = new EventEmitter();

  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]): void {
    this.emitter.emit(event, payload);
  }

  on<K extends keyof AppEvents>(
    event: K,
    listener: (payload: AppEvents[K]) => void | Promise<void>,
  ): void {
    this.emitter.on(event, (payload: AppEvents[K]) => {
      // `.then` so a listener that throws synchronously cannot reach the emitter either.
      Promise.resolve()
        .then(() => listener(payload))
        .catch(() => undefined);
    });
  }
}
