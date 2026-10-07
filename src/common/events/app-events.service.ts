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
