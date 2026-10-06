import { Injectable, NotFoundException } from '@nestjs/common';
import type { PermissionScope } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { MediaService } from '../../media/media.service';
import { FindReportsQueryDto } from '../dto/find-reports-query.dto';
import { buildReportFilter, toReportEntity } from '../helpers/report.helper';
import { ReportRepository } from '../repositories/report.repository';

/**
 * `GET /api/reports` and `GET /api/reports/:id` (with its photos, read
 * through `MediaService`, `entity_type = 'report'`). Scope `own` limits both
 * to the reports the caller wrote.
 */
@Injectable()
export class FindReportsHandler {
  constructor(
    @InjectPinoLogger(FindReportsHandler.name)
    private readonly logger: PinoLogger,
    private readonly reports: ReportRepository,
    private readonly media: MediaService,
  ) {}

  async execute(
    query: FindReportsQueryDto,
    actor: AuthenticatedUser,
    scope: PermissionScope,
  ) {
    const { page, limit } = query;
    this.logger.debug(`Listing reports (page ${page}, limit ${limit})`);

    const [data, total] = await this.reports.findMany(
      buildReportFilter({
        projectId: query.project_id,
        from: query.from,
        to: query.to,
        createdBy: scope === 'own' ? actor.userId : undefined,
      }),
      toSkip(page, limit),
      limit,
    );
    return toPaginated(data.map(toReportEntity), total, page, limit);
  }

  async findOne(id: number, actor: AuthenticatedUser, scope: PermissionScope) {
    const report = await this.reports.findById(id);
    if (!report || (scope === 'own' && report.createdBy !== actor.userId)) {
      this.logger.warn(`Report ${id} not found for user ${actor.userId}`);
      throw new NotFoundException('Report not found');
    }

    const photos = await this.media.findAll(
      {
        page: 1,
        limit: 100,
        entity_type: 'report',
        entity_id: id,
      },
      actor,
      'all',
    );
    return { ...toReportEntity(report), photos: photos.data };
  }

  /** Internal: the raw row, scoped to the current tenant, or `null`. */
  findByIdRaw(id: number) {
    return this.reports.findById(id);
  }
}
