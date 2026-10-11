import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor } from '../common/decorators/actor.decorator';
import type { RequestActor } from '../common/decorators/actor.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AuthService } from './auth.service';
import { ApiAdminCreateTenant } from './decorators/auth.swagger';
import { AdminCreateTenantDto } from './dto/admin-create-tenant.dto';
import { AdminAuthGuard } from './guards/admin-auth.guard';

/**
 * `POST /api/admin/tenants` — the other `admin/tenants` routes stay in
 * `tenants.controller.ts`. This one is here because it builds a whole new
 * company (tenant + trial + first-admin invitation), like the sign-up.
 */
@ApiTags('Tenants')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/tenants')
export class AdminTenantsController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @ApiAdminCreateTenant()
  create(@Body() dto: AdminCreateTenantDto, @Actor() actor: RequestActor) {
    return this.authService.adminCreateTenant(dto, actor);
  }
}
