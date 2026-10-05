import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AuthService } from './auth.service';
import {
  ApiAdminLogin,
  ApiAdminLogout,
  ApiVerify2fa,
} from './decorators/auth.swagger';
import { AdminLoginDto } from './dto/admin-login.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';

@ApiTags('Admin Auth')
@Public() // TODO: step 02 wiring — AdminAuthGuard on logout
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiAdminLogin()
  login(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.adminSignIn(dto, req, res);
  }

  @Post('verify-2fa')
  @ApiVerify2fa()
  verify2fa(
    @Body() dto: Verify2faDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.adminVerify2fa(dto, req, res);
  }

  @Post('logout')
  @ApiAdminLogout()
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.adminSignOut(req, res);
  }
}
