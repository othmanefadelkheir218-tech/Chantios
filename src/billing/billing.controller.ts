import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { BillingService } from './billing.service';
import { ChangePlanDto } from './dto/change-plan.dto';

/** Tenant-facing subscription, usage and invoice routes. */
@ApiTags('Billing')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @TenantAuth()
  @Module('settings')
  mySubscription(@CurrentUser() actor: AuthenticatedUser) {
    return this.billingService.mySubscription(actor.tenantId);
  }

  @Get('usage')
  @TenantAuth()
  @Module('settings')
  usage(@CurrentUser() actor: AuthenticatedUser) {
    return this.billingService.usage(actor.tenantId);
  }

  @Get('invoices')
  @TenantAuth()
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
}
