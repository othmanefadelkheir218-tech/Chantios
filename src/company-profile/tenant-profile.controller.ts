import { Body, Controller, Get, Patch, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { UpdateTenantProfileDto } from '../tenants/dto/update-tenant-profile.dto';
import { CompanyProfileService } from './company-profile.service';
import {
  ApiGetCompanyProfile,
  ApiUpdateCompanyProfile,
} from './decorators/company-profile.swagger';

/** The company reads and edits its own data. The tenant comes from the JWT, never the URL. */
@ApiTags('Company profile')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('tenant')
export class TenantProfileController {
  constructor(private readonly companyProfile: CompanyProfileService) {}

  @Get()
  @TenantAuth()
  @ApiGetCompanyProfile()
  findMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.companyProfile.findMine(actor.tenantId);
  }

  @Patch()
  @TenantAuth()
  @Module('settings')
  @ApiUpdateCompanyProfile()
  updateMine(
    @Body() dto: UpdateTenantProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Actor() request: RequestActor,
  ) {
    return this.companyProfile.updateMine(dto, actor, request.ip);
  }
}
