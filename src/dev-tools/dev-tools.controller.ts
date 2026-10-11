import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AdminRoles } from '../auth/decorators/admin-roles.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { DevToolsService } from './dev-tools.service';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';
import { TimeTravelDto } from './dto/time-travel.dto';
import { DevToolsGuard } from './guards/dev-tools.guard';

/**
 * Test helpers for the super-admin (doc/notes/Phaces/20-trial-end-dev-tools.md):
 * fast-forward a subscription, run a nightly job now, fake a Stripe payment.
 * `DevToolsGuard` runs FIRST: with the tools off, even the login check is
 * skipped and the answer is a plain `404`.
 */
@ApiTags('Dev tools (never in production)')
@UseGuards(DevToolsGuard, AdminAuthGuard)
@AdminRoles('super_admin')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/dev')
export class DevToolsController {
  constructor(private readonly devTools: DevToolsService) {}

  @Get('status')
  status() {
    return this.devTools.status();
  }

  @Post('tenants/:tenantId/time-travel')
  @AuditLog('dev_time_travel', 'subscription')
  timeTravel(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() dto: TimeTravelDto,
  ) {
    return this.devTools.timeTravel(tenantId, dto.days);
  }

  @Post('jobs/:name/run')
  @AuditLog('dev_run_job', 'job')
  runJob(@Param('name') name: string) {
    return this.devTools.run(name);
  }

  @Post('tenants/:tenantId/simulate-payment')
  @AuditLog('dev_simulate_payment', 'subscription')
  simulatePayment(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() dto: SimulatePaymentDto,
  ) {
    return this.devTools.simulatePayment(tenantId, dto.result);
  }
}
