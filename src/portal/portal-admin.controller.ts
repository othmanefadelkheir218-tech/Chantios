import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { PortalService } from './portal.service';

/**
 * The STAFF side of the portal, behind the normal tenant pipeline
 * (`AuthGuard` → `TenantGuard` → … → `PermissionGuard`). Kept in its own
 * controller, apart from the public one, so a staff route can never end up on
 * the public surface by accident.
 */
@ApiTags('Portal (staff)')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('projects')
export class PortalAdminController {
  constructor(private readonly portalService: PortalService) {}

  /** Returns the raw token ONCE — only its hash is stored. Generating a new one kills the old. */
  @Post(':id/portal-link')
  @TenantAuth()
  @Module('projects')
  generate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GenerateTokenDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.portalService.generate(id, dto, actor);
  }

  /** Status and expiry — never the token. */
  @Get(':id/portal-link')
  @TenantAuth()
  @Module('projects')
  link(@Param('id', ParseIntPipe) id: number) {
    return this.portalService.link(id);
  }

  /** `is_active = false`, instant. */
  @Delete(':id/portal-link')
  @TenantAuth()
  @Module('projects')
  revoke(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.portalService.revoke(id, actor);
  }

  /** "Opened 3 times, downloaded once." */
  @Get(':id/portal-tracking')
  @TenantAuth()
  @Module('projects')
  tracking(@Param('id', ParseIntPipe) id: number) {
    return this.portalService.tracking(id);
  }
}
