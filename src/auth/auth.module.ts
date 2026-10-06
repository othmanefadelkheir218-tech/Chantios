import { Module } from '@nestjs/common';
import { AdminUsersModule } from '../admin-users/admin-users.module';
import { EmailModule } from '../email/email.module';
import { OneTimeCodesModule } from '../one-time-codes/one-time-codes.module';
import { PlansModule } from '../plans/plans.module';
import { RolesModule } from '../roles/roles.module';
import { SessionsModule } from '../sessions/sessions.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { UsersModule } from '../users/users.module';
import { AdminAuthController } from './admin-auth.controller';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { SubscriptionGuard } from './guards/subscription.guard';
import { TenantGuard } from './guards/tenant.guard';
import { AdminLoginHandler } from './handlers/admin-login.handler';
import { AdminLogoutHandler } from './handlers/admin-logout.handler';
import { ChangePasswordHandler } from './handlers/change-password.handler';
import { ForgotPasswordHandler } from './handlers/forgot-password.handler';
import { GetMeHandler } from './handlers/get-me.handler';
import { ListSessionsHandler } from './handlers/list-sessions.handler';
import { LoginHandler } from './handlers/login.handler';
import { LogoutHandler } from './handlers/logout.handler';
import { MobileLoginHandler } from './handlers/mobile-login.handler';
import { RefreshHandler } from './handlers/refresh.handler';
import { RegisterTenantHandler } from './handlers/register-tenant.handler';
import { ResetPasswordHandler } from './handlers/reset-password.handler';
import { RevokeAllSessionsHandler } from './handlers/revoke-all-sessions.handler';
import { RevokeSessionHandler } from './handlers/revoke-session.handler';
import { Verify2faHandler } from './handlers/verify-2fa.handler';
import { VerifyEmailHandler } from './handlers/verify-email.handler';
import { MobileAuthController } from './mobile-auth.controller';
import { CleanupExpiredTokensJob } from './jobs/cleanup-expired-tokens.job';
import { TokenModule } from './token.module';

/**
 * Guards are provided here, as plain injectables, but not attached to any
 * route yet — see doc/notes/WhereIStop/state.md. `@UseGuards(...)` is added
 * at the point each step's controllers are locked down.
 */
@Module({
  imports: [
    TokenModule,
    AdminUsersModule,
    UsersModule,
    RolesModule,
    SessionsModule,
    EmailModule,
    OneTimeCodesModule,
    SubscriptionsModule,
    TenantsModule,
    PlansModule,
  ],
  controllers: [AuthController, MobileAuthController, AdminAuthController],
  providers: [
    AuthService,
    CleanupExpiredTokensJob,
    AuthGuard,
    TenantGuard,
    SubscriptionGuard,
    PermissionGuard,
    RegisterTenantHandler,
    LoginHandler,
    RefreshHandler,
    LogoutHandler,
    ForgotPasswordHandler,
    ResetPasswordHandler,
    ChangePasswordHandler,
    VerifyEmailHandler,
    GetMeHandler,
    ListSessionsHandler,
    RevokeSessionHandler,
    RevokeAllSessionsHandler,
    MobileLoginHandler,
    AdminLoginHandler,
    Verify2faHandler,
    AdminLogoutHandler,
  ],
  exports: [AuthService, TokenModule],
})
export class AuthModule {}
