import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AnalyticsService } from './analytics.service';
import { ApiFindAnalytics } from './decorators/analytics.swagger';
import { FindAnalyticsQueryDto } from './dto/find-analytics-query.dto';

@ApiTags('Analytics')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get()
  @ApiFindAnalytics()
  findAll(@Query() query: FindAnalyticsQueryDto) {
    return this.analyticsService.findAll(query);
  }
}
