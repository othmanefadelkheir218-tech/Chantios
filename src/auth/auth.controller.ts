import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';
import {
  ApiChangePassword,
  ApiForgotPassword,
  ApiListSessions,
  ApiLogin,
  ApiLogout,
  ApiMe,
  ApiRefresh,
  ApiRegister,
  ApiResetPassword,
  ApiRevokeAllSessions,
  ApiRevokeSession,
  ApiVerifyEmail,
} from './decorators/auth.swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('Auth')
@Public() // TODO: step 02 wiring — AuthGuard + TenantGuard + SubscriptionGuard per route below
@UseInterceptors(SnakeCaseInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiRegister()
  register(@Body() dto: RegisterTenantDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiLogin()
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(dto, req, res);
  }

  @Post('refresh')
  @ApiRefresh()
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refreshSession(req, res);
  }

  @Post('logout')
  @ApiLogout()
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.signOut(req, res);
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiForgotPassword()
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPasswordFor(dto);
  }

  @Post('reset-password')
  @ApiResetPassword()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPasswordWith(dto);
  }

  @Post('change-password')
  @ApiChangePassword()
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.authService.changeOwnPassword(dto, actor);
  }

  @Post('verify-email')
  @ApiVerifyEmail()
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyOwnEmail(dto);
  }

  @Get('me')
  @ApiMe()
  me(@CurrentUser() actor: AuthenticatedUser) {
    return this.authService.me(actor);
  }

  @Get('sessions')
  @ApiListSessions()
  sessions(@CurrentUser() actor: AuthenticatedUser) {
    return this.authService.sessions(actor);
  }

  @Delete('sessions')
  @ApiRevokeAllSessions()
  revokeAllSessions(@CurrentUser() actor: AuthenticatedUser) {
    return this.authService.revokeEverySession(actor);
  }

  @Delete('sessions/:id')
  @ApiRevokeSession()
  revokeSession(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.authService.revokeOneSession(id, actor);
  }
}
