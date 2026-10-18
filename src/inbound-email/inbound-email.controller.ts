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
import { InboundEmailService } from './inbound-email.service';

// TEST ONLY — receives Resend `email.received` webhooks, checks the signature,
// fetches the full email and logs it. Nothing is saved. Replace before going live.
@ApiExcludeController()
@SkipThrottle()
@Controller('webhooks/resend-inbound')
export class InboundEmailController {
  constructor(private readonly inboundEmailService: InboundEmailService) {}

  @Post()
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
    await this.inboundEmailService.logReceived(event);
    return { received: true };
  }
}
