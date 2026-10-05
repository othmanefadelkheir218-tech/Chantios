import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiCreatePlan,
  ApiCreatePlanVersion,
  ApiDeactivatePlan,
  ApiFindPlan,
  ApiFindPlans,
  ApiSetDefaultPlan,
} from './decorators/plans.swagger';
import { CreatePlanVersionDto } from './dto/create-plan-version.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { FindPlansQueryDto } from './dto/find-plans-query.dto';
import { PlansService } from './plans.service';

@ApiTags('Plans')
@Public() // TODO: step 02 — AdminAuthGuard (super_admin / admin staff)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @AuditLog('create', 'plan')
  @ApiCreatePlan()
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Get()
  @ApiFindPlans()
  findAll(@Query() query: FindPlansQueryDto) {
    return this.plansService.findAll(query);
  }

  @Get(':id')
  @ApiFindPlan()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id/deactivate')
  @AuditLog('deactivate', 'plan')
  @ApiDeactivatePlan()
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.deactivate(id);
  }

  @Patch(':id/default')
  @AuditLog('set_default', 'plan')
  @ApiSetDefaultPlan()
  setDefault(@Param('id', ParseUUIDPipe) id: string) {
    return this.plansService.setDefault(id);
  }

  @Post(':id/version')
  @AuditLog('create_version', 'plan')
  @ApiCreatePlanVersion()
  createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePlanVersionDto,
  ) {
    return this.plansService.createVersion(id, dto);
  }
}
