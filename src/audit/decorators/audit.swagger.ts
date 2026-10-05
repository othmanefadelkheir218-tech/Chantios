import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiPaginatedResponse } from '../../common/swagger/api-paginated.decorator';
import { AuditLogEntity } from '../entities/audit-log.entity';

export const ApiFindAuditLogs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List audit logs (super_admin)',
      description:
        'Every sensitive platform action, newest first. Filter by company, record kind or action.',
    }),
    ApiPaginatedResponse(AuditLogEntity, 'Paginated audit logs'),
  );
