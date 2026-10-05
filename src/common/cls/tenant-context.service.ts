import { Injectable } from '@nestjs/common';
import { ClsService, ClsStore } from 'nestjs-cls';

/** What every request-scoped store holds. Written by `TenantGuard` / `AuthGuard`. */
export interface AppClsStore extends ClsStore {
  tenantId?: number;
  userId?: number;
}

/**
 * Typed wrapper around `ClsService` — the only way the rest of the app should
 * read or write the current request's `tenant_id` / `user_id`. Backed by
 * `nestjs-cls` (`AsyncLocalStorage`), one store per request.
 */
@Injectable()
export class TenantContextService {
  constructor(private readonly cls: ClsService<AppClsStore>) {}

  get tenantId(): number | undefined {
    return this.cls.get('tenantId');
  }

  setTenantId(tenantId: number): void {
    this.cls.set('tenantId', tenantId);
  }

  get userId(): number | undefined {
    return this.cls.get('userId');
  }

  setUserId(userId: number): void {
    this.cls.set('userId', userId);
  }
}
