import { Controller, Get, Query, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AnalyticsService } from './analytics.service';
import { ApiFindAnalytics } from './decorators/analytics.swagger';
import { FindAnalyticsQueryDto } from './dto/find-analytics-query.dto';

@ApiTags('Analytics')
@Public() // TODO: step 02 — AdminAuthGuard (admin staff)
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
