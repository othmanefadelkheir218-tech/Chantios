import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { EmailConnectionsService } from './email-connections.service';
import type { TestSendInput } from './email-connections.service';

// TEST ONLY — "Connect Gmail" with the `gmail.send` scope, then send one email
// as the connected Gmail. Tokens live in memory, nothing is saved. Replace before going live.
@ApiExcludeController()
@Controller('email-connections/google')
export class EmailConnectionsController {
  constructor(
    private readonly emailConnectionsService: EmailConnectionsService,
  ) {}

  /** Open in the browser: redirects to Google's consent screen. */
  @Get('connect')
  connect(@Res() res: Response) {
    res.redirect(this.emailConnectionsService.buildConsentUrl());
  }

  /** Google sends the user back here with a one-time code. */
  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
  ) {
    return this.emailConnectionsService.handleCallback(code, state, error);
  }

  /** Sends one email as the connected Gmail. Needs the `x-test-key` from the callback. */
  @Post('test-send')
  @HttpCode(HttpStatus.OK)
  async testSend(
    @Headers('x-test-key') testKey: string | undefined,
    @Body() body: TestSendInput,
  ) {
    return this.emailConnectionsService.testSend(testKey, body);
  }
}
