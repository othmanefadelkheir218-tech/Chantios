import {
  Body,
  Controller,
  Delete,
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
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiCreateTenant,
  ApiFindTenant,
  ApiFindTenants,
  ApiRestoreTenant,
  ApiRestoreTenants,
  ApiSendTenantVerificationEmail,
  ApiSetTenantStatus,
  ApiSoftDeleteTenant,
  ApiSoftDeleteTenants,
  ApiUpdateTenant,
  ApiVerifyTenantEmail,
} from './decorators/tenants.swagger';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FindTenantsQueryDto } from './dto/find-tenants-query.dto';
import { SetTenantStatusDto } from './dto/suspend-tenant.dto';
import { TenantIdsDto } from './dto/tenant-ids.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { VerifyTenantEmailDto } from './dto/verify-tenant-email.dto';
import { TenantsService } from './tenants.service';

@ApiTags('Tenants')
@UseGuards(AdminAuthGuard)
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
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.findOne(id);
  }

  // Must stay registered before `PATCH :id` — both match a single path
  // segment, and the literal `restore` has to win over the `:id` wildcard.
  @Patch('restore')
  @AuditLog('restore_many', 'tenant')
  @ApiRestoreTenants()
  restoreMany(@Body() dto: TenantIdsDto) {
    return this.tenantsService.restoreMany(dto.ids);
  }

  @Patch(':id')
  @ApiUpdateTenant()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTenantDto,
    @Actor() actor: RequestActor,
  ) {
    return this.tenantsService.update(id, dto, actor);
  }

  @Patch(':id/status')
  @ApiSetTenantStatus()
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetTenantStatusDto,
    @Actor() actor: RequestActor,
  ) {
    return this.tenantsService.setStatus(id, dto, actor);
  }

  @Patch(':id/restore')
  @ApiRestoreTenant()
  restore(@Param('id', ParseIntPipe) id: number, @Actor() actor: RequestActor) {
    return this.tenantsService.restore(id, actor);
  }

  @Delete()
  @AuditLog('soft_delete_many', 'tenant')
  @ApiSoftDeleteTenants()
  softDeleteMany(@Body() dto: TenantIdsDto) {
    return this.tenantsService.softDeleteMany(dto.ids);
  }

  @Delete(':id')
  @ApiSoftDeleteTenant()
  softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: RequestActor,
  ) {
    return this.tenantsService.softDelete(id, actor);
  }

  @Post(':id/send-verification-email')
  @ApiSendTenantVerificationEmail()
  sendVerificationEmail(@Param('id', ParseIntPipe) id: number) {
    return this.tenantsService.sendVerificationEmailTo(id);
  }

  @Patch(':id/verify-email')
  @ApiVerifyTenantEmail()
  verifyEmail(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyTenantEmailDto,
    @Actor() actor: RequestActor,
  ) {
    return this.tenantsService.verifyEmailOf(id, dto, actor);
  }
}
