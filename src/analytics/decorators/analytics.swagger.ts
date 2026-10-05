import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/swagger/api-paginated.decorator';
import { AnalyticsEventEntity } from '../entities/analytics-event.entity';

export const ApiFindAnalytics = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List analytics events (admin staff)',
      description:
        'Product events, newest first. Filter by company, event name and date range.',
    }),
    ApiPaginatedResponse(AnalyticsEventEntity, 'Paginated analytics events'),
  );
