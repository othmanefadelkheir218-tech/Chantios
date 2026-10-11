import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { DashboardService } from './dashboard.service';
import { ApiGetDashboard } from './decorators/dashboard.swagger';

/** No `@Module()`: each widget checks its own module's view right (doc/notes/dashboard.md). */
@ApiTags('Dashboard')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @TenantAuth()
  @ApiGetDashboard()
  find(@CurrentUser() actor: AuthenticatedUser) {
    return this.dashboardService.forUser(actor);
  }
}
