import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CostTypesService } from './cost-types.service';
import { CreateCostTypeDto } from './dto/create-cost-type.dto';
import { UpdateCostTypeDto } from './dto/update-cost-type.dto';

@ApiTags('Cost types')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('cost-types')
export class CostTypesController {
  constructor(private readonly costTypesService: CostTypesService) {}

  /** Shared defaults + this tenant's own. */
  @Get()
  @TenantAuth()
  @Module('purchase_invoices')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.costTypesService.findAll(actor.tenantId);
  }

  /** Admin only — carries the caller's own `tenant_id`, never `NULL`. */
  @Post()
  @TenantAuth()
  @Roles('admin')
  create(
    @Body() dto: CreateCostTypeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.costTypesService.create(dto, actor);
  }

  /** Admin only, own rows only — never a `NULL`-tenant shared default. */
  @Patch(':id')
  @TenantAuth()
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCostTypeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.costTypesService.update(id, dto, actor);
  }
}
