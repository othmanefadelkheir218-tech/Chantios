import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
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
@UseGuards(AdminAuthGuard)
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.findOne(id);
  }

  @Patch(':id/deactivate')
  @AuditLog('deactivate', 'plan')
  @ApiDeactivatePlan()
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.deactivate(id);
  }

  @Patch(':id/default')
  @AuditLog('set_default', 'plan')
  @ApiSetDefaultPlan()
  setDefault(@Param('id', ParseIntPipe) id: number) {
    return this.plansService.setDefault(id);
  }

  @Post(':id/version')
  @AuditLog('create_version', 'plan')
  @ApiCreatePlanVersion()
  createVersion(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePlanVersionDto,
  ) {
    return this.plansService.createVersion(id, dto);
  }
}
