import {
  Body,
  Controller,
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
import { ApiMobileLogin } from './decorators/auth.swagger';
import { MobileLoginDto } from './dto/mobile-login.dto';

@ApiTags('Mobile Auth')
@Public()
@UseInterceptors(SnakeCaseInterceptor)
@Controller('mobile')
export class MobileAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiMobileLogin()
  login(
    @Body() dto: MobileLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.mobileSignIn(dto, req, res);
  }
}
