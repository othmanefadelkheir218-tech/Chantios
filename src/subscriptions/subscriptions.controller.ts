import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiChangePlan,
  ApiFindSubscription,
  ApiFindSubscriptions,
  ApiFindUsage,
} from './decorators/subscriptions.swagger';
import { FindSubscriptionsQueryDto } from './dto/find-subscriptions-query.dto';
import { SetPendingPlanDto } from './dto/set-pending-plan.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiFindSubscriptions()
  findAll(@Query() query: FindSubscriptionsQueryDto) {
    return this.subscriptionsService.findAll(query);
  }

  @Get(':tenantId')
  @ApiFindSubscription()
  findOne(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.subscriptionsService.findByTenant(tenantId);
  }

  @Patch(':tenantId/plan')
  @AuditLog('set_pending_plan', 'subscription')
  @ApiChangePlan()
  changePlan(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() dto: SetPendingPlanDto,
  ) {
    return this.subscriptionsService.changePlan(tenantId, dto);
  }

  @Get(':tenantId/usage')
  @ApiFindUsage()
  usage(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.subscriptionsService.usage(tenantId, query);
  }
}
