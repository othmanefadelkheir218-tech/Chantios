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
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiCreateTenant,
  ApiFindTenant,
  ApiFindTenants,
  ApiSetTenantStatus,
  ApiUpdateTenant,
} from './decorators/tenants.swagger';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FindTenantsQueryDto } from './dto/find-tenants-query.dto';
import { SetTenantStatusDto } from './dto/suspend-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@Public() // TODO: step 02 — AdminAuthGuard (super_admin / admin staff)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiCreateTenant()
  create(@Body() dto: CreateTenantDto, @Actor() actor: RequestActor) {
    return this.tenantsService.create(dto, actor);
  }

  @Get()
  @ApiFindTenants()
  findAll(@Query() query: FindTenantsQueryDto) {
    return this.tenantsService.findAll(query);
  }

  @Get(':id')
  @ApiFindTenant()
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateTenant()
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
    @Actor() actor: RequestActor,
  ) {
    return this.tenantsService.update(id, dto, actor);
  }

  @Patch(':id/status')
  @ApiSetTenantStatus()
  setStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetTenantStatusDto,
    @Actor() actor: RequestActor,
  ) {
    return this.tenantsService.setStatus(id, dto, actor);
  }
}
