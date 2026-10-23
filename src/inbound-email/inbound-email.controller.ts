import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { InboundEmailService } from './inbound-email.service';

/**
 * `POST /api/webhooks/resend-inbound` — Resend's `email.received` notice
 * (step 25). Public: the Svix signature is the proof (`400` if wrong). The
 * notice is stored once and queued; `200 { received: true }` at once.
 */
@ApiExcludeController()
@SkipThrottle()
@Controller('webhooks/resend-inbound')
export class InboundEmailController {
  constructor(private readonly inboundEmailService: InboundEmailService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('svix-id') id: string | undefined,
    @Headers('svix-timestamp') timestamp: string | undefined,
    @Headers('svix-signature') signature: string | undefined,
  ) {
    const event = this.inboundEmailService.verifyEvent(req.rawBody, {
      id,
      timestamp,
      signature,
    });
    await this.inboundEmailService.recordAndEnqueue(event);
    return { received: true };
  }
}
