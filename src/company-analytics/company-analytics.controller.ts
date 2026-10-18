import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CompanyAnalyticsService } from './company-analytics.service';
import { ApiGetCompanyAnalytics } from './decorators/company-analytics.swagger';
import { CompanyAnalyticsQueryDto } from './dto/company-analytics-query.dto';

/**
 * The tenant analytics page (doc/notes/analytics.md). `analytics:view` opens
 * it (`admin`, `accountant`); each block also checks its own module's view
 * right in the handler.
 */
@ApiTags('Company analytics')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('analytics')
export class CompanyAnalyticsController {
  constructor(private readonly analyticsService: CompanyAnalyticsService) {}

  @Get('overview')
  @TenantAuth()
  @Module('analytics')
  @ApiGetCompanyAnalytics()
  overview(
    @Query() query: CompanyAnalyticsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.analyticsService.overview(query, actor);
  }
}
