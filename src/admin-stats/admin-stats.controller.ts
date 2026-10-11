import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AdminStatsService } from './admin-stats.service';
import { ApiGetAdminStats } from './decorators/admin-stats.swagger';

/** Any admin staff, like `GET /api/admin/analytics`. */
@ApiTags('Admin stats')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/stats')
export class AdminStatsController {
  constructor(private readonly adminStatsService: AdminStatsService) {}

  @Get()
  @ApiGetAdminStats()
  find() {
    return this.adminStatsService.find();
  }
}
