import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AllowLapsedSubscription } from '../auth/decorators/allow-lapsed-subscription.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { BillingService } from './billing.service';
import { CardPaymentDto } from './dto/card-payment.dto';
import { ChangePlanDto } from './dto/change-plan.dto';

/** Tenant-facing subscription, usage and invoice routes. */
@ApiTags('Billing')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // A blocked company can still read its billing (doc/notes/subscription-plans.md § The end of the trial).
  @Get('subscription')
  @TenantAuth()
  @AllowLapsedSubscription()
  @Module('settings')
  mySubscription(@CurrentUser() actor: AuthenticatedUser) {
    return this.billingService.mySubscription(actor.tenantId);
  }

  @Get('usage')
  @TenantAuth()
  @AllowLapsedSubscription()
  @Module('settings')
  usage(@CurrentUser() actor: AuthenticatedUser) {
    return this.billingService.usage(actor.tenantId);
  }

  /** The billing history: one item per past period, with what Stripe charged. */
  @Get('history')
  @TenantAuth()
  @AllowLapsedSubscription()
  @Module('settings')
  history(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.billingService.history(actor.tenantId, query);
  }

  @Get('invoices')
  @TenantAuth()
  @AllowLapsedSubscription()
  @Module('settings')
  invoices(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.billingService.invoices(actor.tenantId, query);
  }

  /** The storage downgrade gate applies here (`request-downgrade.handler.ts`). */
  @Post('change-plan')
  @TenantAuth()
  @Roles('admin')
  changePlan(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ChangePlanDto,
  ) {
    return this.billingService.changePlan(actor.tenantId, dto);
  }

  // ---- Step 21 — paying by card. Tenant admin only; a blocked company must reach them. ----

  /** "Pay" → `{ url }` of the Stripe page to open. */
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @TenantAuth()
  @AllowLapsedSubscription()
  @Roles('admin')
  checkout(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CardPaymentDto,
  ) {
    return this.billingService.startCheckout(actor.tenantId, dto);
  }

  /** "Manage payment" → `{ url }` of the Stripe Customer Portal. */
  @Post('portal')
  @HttpCode(HttpStatus.OK)
  @TenantAuth()
  @AllowLapsedSubscription()
  @Roles('admin')
  portal(@CurrentUser() actor: AuthenticatedUser, @Body() dto: CardPaymentDto) {
    return this.billingService.openPortal(actor.tenantId, dto);
  }

  /** Ends at the end of the paid month, no refund. Returns the subscription. */
  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @TenantAuth()
  @Roles('admin')
  cancel(@CurrentUser() actor: AuthenticatedUser) {
    return this.billingService.cancelAtPeriodEnd(actor.tenantId);
  }

  /** "Keep my subscription" before the end date. Returns the subscription. */
  @Post('resume')
  @HttpCode(HttpStatus.OK)
  @TenantAuth()
  @Roles('admin')
  resume(@CurrentUser() actor: AuthenticatedUser) {
    return this.billingService.resume(actor.tenantId);
  }
}
