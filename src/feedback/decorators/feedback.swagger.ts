import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  ApiUuidParam,
} from '../../common/swagger/api-paginated.decorator';
import { FeedbackEntity } from '../entities/feedback.entity';

export const ApiFindFeedback = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List tenant feedback (admin staff)',
      description:
        'Feature requests, improvements and complaints, newest first. Filter by status, type and company.',
    }),
    ApiPaginatedResponse(FeedbackEntity, 'Paginated list of feedback'),
  );

export const ApiUpdateFeedbackStatus = () =>
  applyDecorators(
    ApiOperation({ summary: 'Change the status of a feedback (admin staff)' }),
    ApiUuidParam('id', 'Feedback id (UUID)'),
    ApiOkResponse({ description: 'Status changed', type: FeedbackEntity }),
    ApiBadRequestResponse({ description: 'Invalid status or invalid UUID' }),
    ApiNotFoundResponse({ description: 'Feedback not found' }),
  );
