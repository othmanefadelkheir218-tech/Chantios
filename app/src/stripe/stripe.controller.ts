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
  receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const event = this.stripeService.constructEvent(req.rawBody, signature);
    this.stripeService.handleEvent(event);
    return { received: true };
  }
}
