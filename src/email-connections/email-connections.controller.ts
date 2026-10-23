import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiDisconnectInbox,
  ApiFindInboxes,
  ApiGmailCallback,
  ApiSetCompanyAddress,
  ApiStartGmailConnect,
} from './decorators/email-connections.swagger';
import { SetCompanyAddressDto } from './dto/set-company-address.dto';
import { EmailConnectionsService } from './email-connections.service';

/**
 * Email inboxes (step 25, doc/notes/client-email.md): the company address and
 * the users' own Gmail. `tenant_id` always comes from the JWT.
 */
@ApiTags('Email inboxes')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('email-inboxes')
export class EmailConnectionsController {
  constructor(
    private readonly emailConnectionsService: EmailConnectionsService,
  ) {}

  @Get()
  @TenantAuth()
  @Module('email')
  @ApiFindInboxes()
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.emailConnectionsService.findAll(actor);
  }

  @Patch('company')
  @TenantAuth()
  @Module('settings')
  @ApiSetCompanyAddress()
  setCompanyAddress(
    @Body() dto: SetCompanyAddressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.emailConnectionsService.setCompanyLocalPart(dto, actor);
  }

  @Post('gmail/connect')
  @HttpCode(HttpStatus.OK)
  @TenantAuth()
  // "Connecter un Gmail" — separate from using email: each Gmail is billed.
  @Module('email_gmail')
  @ApiStartGmailConnect()
  startGmail(@CurrentUser() actor: AuthenticatedUser) {
    return this.emailConnectionsService.startGmail(actor);
  }

  /** Google sends the browser back here. Public: the signed `state` is the proof. */
  @Get('gmail/callback')
  @Public()
  @SkipThrottle()
  @ApiGmailCallback()
  async gmailCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    const url = await this.emailConnectionsService.finishGmail(
      code,
      state,
      error,
    );
    res.redirect(url);
  }

  /** Owner or `settings` edit — checked in the handler (the owner needs no extra right). */
  @Delete(':id')
  @TenantAuth()
  @ApiDisconnectInbox()
  disconnect(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.emailConnectionsService.disconnect(id, actor);
  }
}
