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
import { StripeService } from './stripe.service';

@ApiExcludeController()
@SkipThrottle()
@Controller('webhooks/stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    // Signature check stays synchronous: a bad signature must reject the
    // request immediately. The event is then stored (durable, awaited) before
    // we tell Stripe we received it — only the follow-up queue step for
    // dispatching it is best-effort; see `StripeService.recordAndEnqueue`.
    const event = this.stripeService.constructEvent(req.rawBody, signature);
    await this.stripeService.recordAndEnqueue(event);
    return { received: true };
  }
}
