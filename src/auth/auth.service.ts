import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { MobileLoginDto } from './dto/mobile-login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
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
import { AuthenticatedUser } from './decorators/current-user.decorator';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class AuthService {
  constructor(
    private readonly registerTenant: RegisterTenantHandler,
    private readonly login: LoginHandler,
    private readonly refresh: RefreshHandler,
    private readonly logout: LogoutHandler,
    private readonly forgotPassword: ForgotPasswordHandler,
    private readonly resetPassword: ResetPasswordHandler,
    private readonly changePassword: ChangePasswordHandler,
    private readonly verifyEmail: VerifyEmailHandler,
    private readonly getMe: GetMeHandler,
    private readonly listSessions: ListSessionsHandler,
    private readonly revokeSession: RevokeSessionHandler,
    private readonly revokeAllSessions: RevokeAllSessionsHandler,
    private readonly mobileLogin: MobileLoginHandler,
    private readonly adminLogin: AdminLoginHandler,
    private readonly verify2fa: Verify2faHandler,
    private readonly adminLogout: AdminLogoutHandler,
  ) {}

  register(dto: RegisterTenantDto) {
    return this.registerTenant.execute(dto);
  }

  signIn(dto: LoginDto, req: Request, res: Response) {
    return this.login.execute(dto, req, res);
  }

  refreshSession(req: Request, res: Response) {
    return this.refresh.execute(req, res);
  }

  signOut(req: Request, res: Response) {
    return this.logout.execute(req, res);
  }

  forgotPasswordFor(dto: ForgotPasswordDto) {
    return this.forgotPassword.execute(dto);
  }

  resetPasswordWith(dto: ResetPasswordDto) {
    return this.resetPassword.execute(dto);
  }

  changeOwnPassword(dto: ChangePasswordDto, actor: AuthenticatedUser) {
    return this.changePassword.execute(dto, actor);
  }

  verifyOwnEmail(dto: VerifyEmailDto) {
    return this.verifyEmail.execute(dto);
  }

  me(actor: AuthenticatedUser) {
    return this.getMe.execute(actor);
  }

  sessions(actor: AuthenticatedUser) {
    return this.listSessions.execute(actor);
  }

  revokeOneSession(id: number, actor: AuthenticatedUser) {
    return this.revokeSession.execute(id, actor);
  }

  revokeEverySession(actor: AuthenticatedUser) {
    return this.revokeAllSessions.execute(actor);
  }

  mobileSignIn(dto: MobileLoginDto, req: Request, res: Response) {
    return this.mobileLogin.execute(dto, req, res);
  }

  adminSignIn(dto: AdminLoginDto, req: Request, res: Response) {
    return this.adminLogin.execute(dto, req, res);
  }

  adminVerify2fa(dto: Verify2faDto, req: Request, res: Response) {
    return this.verify2fa.execute(dto, req, res);
  }

  adminSignOut(req: Request, res: Response) {
    return this.adminLogout.execute(req, res);
  }
}
