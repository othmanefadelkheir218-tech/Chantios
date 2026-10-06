import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { FindMarginsQueryDto } from './dto/find-margins-query.dto';
import { MarginsService } from './margins.service';

/**
 * The profitability read side. There is NO route that writes a margin: the
 * view is read-only, and the snapshot is written by the status change in
 * `projects`. Every route is `margins:view` (`admin`, `manager`, `accountant`);
 * a `supervisor` gets `403`.
 */
@ApiTags('Margins')
@UseInterceptors(SnakeCaseInterceptor)
@Controller()
export class MarginsController {
  constructor(private readonly marginsService: MarginsService) {}

  /** The `/margins` page — one row per project, worst margin first. */
  @Get('margins')
  @TenantAuth()
  @Module('margins')
  findAll(@Query() query: FindMarginsQueryDto) {
    return this.marginsService.findAll(query);
  }

  /** Live, from the view. */
  @Get('projects/:id/margin')
  @TenantAuth()
  @Module('margins')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.marginsService.findOne(id);
  }

  /** The cost grouped by `cost_type_id`. */
  @Get('projects/:id/margin/breakdown')
  @TenantAuth()
  @Module('margins')
  breakdown(@Param('id', ParseIntPipe) id: number) {
    return this.marginsService.breakdown(id);
  }

  /** The live (not voided) closure snapshot, if the project is closed. */
  @Get('projects/:id/snapshot')
  @TenantAuth()
  @Module('margins')
  snapshot(@Param('id', ParseIntPipe) id: number) {
    return this.marginsService.snapshot(id);
  }
}
