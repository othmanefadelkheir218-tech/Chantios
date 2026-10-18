import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CompanyAnalyticsQueryDto } from './dto/company-analytics-query.dto';
import { GetCompanyAnalyticsHandler } from './handlers/get-company-analytics.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class CompanyAnalyticsService {
  constructor(private readonly getAnalytics: GetCompanyAnalyticsHandler) {}

  overview(query: CompanyAnalyticsQueryDto, actor: AuthenticatedUser) {
    return this.getAnalytics.execute(query, actor);
  }
}
