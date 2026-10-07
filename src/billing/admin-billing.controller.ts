import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { BillingService } from './billing.service';

/** Platform-admin billing routes: every tenant's snapshots, and a manual renewal trigger. */
@ApiTags('Billing')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/billing')
export class AdminBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('snapshots')
  snapshots(@Query() query: PaginationQueryDto) {
    return this.billingService.allSnapshots(query);
  }

  /** Manual trigger, for testing: direct-call-and-await, not fire-and-forget. */
  @Post('run-renewal/:tenantId')
  runRenewal(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.billingService.runRenewalNow(tenantId);
  }
}
