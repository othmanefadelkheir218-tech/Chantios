import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { TenantContextService } from './tenant-context.service';

/**
 * Request-scoped storage for the current `tenant_id` / `user_id`
 * (doc/notes/technical/build-order.md § 1b). `mount: true` opens a fresh
 * store per request via middleware, before any guard runs.
 */
@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
  ],
  providers: [TenantContextService],
  exports: [TenantContextService],
})
export class CommonClsModule {}
