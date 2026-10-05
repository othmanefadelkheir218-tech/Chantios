import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { Public } from '../common/decorators/public.decorator';
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
@Public() // TODO: step 02 — AdminAuthGuard (super_admin / admin staff)
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
  findOne(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.subscriptionsService.findByTenant(tenantId);
  }

  @Patch(':tenantId/plan')
  @AuditLog('set_pending_plan', 'subscription')
  @ApiChangePlan()
  changePlan(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: SetPendingPlanDto,
  ) {
    return this.subscriptionsService.changePlan(tenantId, dto);
  }

  @Get(':tenantId/usage')
  @ApiFindUsage()
  usage(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.subscriptionsService.usage(tenantId, query);
  }
}
