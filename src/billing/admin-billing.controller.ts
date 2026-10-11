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
import { AdminBillingAccessGuard } from '../admin-users/guards/admin-billing-access.guard';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { BillingService } from './billing.service';
import { FindSnapshotsQueryDto } from './dto/find-snapshots-query.dto';

/** Platform-admin billing routes: usage snapshots (every tenant or one), and a manual renewal trigger. */
@ApiTags('Billing')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/billing')
export class AdminBillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('snapshots')
  snapshots(@Query() query: FindSnapshotsQueryDto) {
    return this.billingService.allSnapshots(query);
  }

  /** Manual trigger, for testing: direct-call-and-await, not fire-and-forget. */
  @Post('run-renewal/:tenantId')
  @UseGuards(AdminBillingAccessGuard)
  runRenewal(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.billingService.runRenewalNow(tenantId);
  }
}
