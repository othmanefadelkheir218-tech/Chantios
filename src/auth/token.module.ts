import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { TokenHelper } from './helpers/token.helper';

/**
 * Leaf module (no imports of its own besides JWT) so the step 01 platform
 * modules can use `AdminAuthGuard` without importing `AuthModule` — which
 * already imports them, so that would be a cycle. Same reason as
 * `src/stripe/` and `src/sessions/`.
 */
@Module({
  imports: [JwtModule.register({})], // secret passed per call — see token.helper.ts
  providers: [TokenHelper, AdminAuthGuard],
  exports: [TokenHelper, AdminAuthGuard],
})
export class TokenModule {}
