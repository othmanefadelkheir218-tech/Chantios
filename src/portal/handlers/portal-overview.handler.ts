import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { InvoicesService } from '../../invoices/invoices.service';
import { ProjectsService } from '../../projects/projects.service';
import { QuotesService } from '../../quotes/quotes.service';
import { ReportsService } from '../../reports/reports.service';
import { TenantsService } from '../../tenants/tenants.service';
import { isPastValidUntil } from '../../quotes/helpers/quote.helper';
import { PortalContextData } from '../decorators/portal-context.decorator';
import {
  MAX_PORTAL_PHOTOS,
  VISIBLE_INVOICE_STATUSES,
  VISIBLE_QUOTE_STATUSES,
} from '../helpers/portal.helper';
import { toPortalOverview } from '../helpers/portal-view.helper';
import { TrackEventHandler } from './track-event.handler';

/**
 * `GET /api/portal/:token` — the overview: the company, the project, the
 * progress % (the newest site report), the newest photos, and counts. Built
 * from the explicit allow-list (`toPortalOverview`) — no entity is serialised.
 * Opening it writes a `view` tracking row.
 *
 * Every read here goes through the OWNING module's service, tenant-scoped by
 * the `tenant_id` the token guard put into `nestjs-cls`, and for THIS token's
 * project only.
 */
@Injectable()
export class PortalOverviewHandler {
  constructor(
    @InjectPinoLogger(PortalOverviewHandler.name)
    private readonly logger: PinoLogger,
    private readonly projects: ProjectsService,
    private readonly tenants: TenantsService,
    private readonly reports: ReportsService,
    private readonly quotes: QuotesService,
    private readonly invoices: InvoicesService,
    private readonly track: TrackEventHandler,
  ) {}

  async execute(portal: PortalContextData) {
    this.logger.info(`Portal overview of project ${portal.projectId}`);

    const [project, tenant, progress, photos, quotes, invoices] =
      await Promise.all([
        this.projects.findOne(portal.projectId),
        this.tenants.findOne(portal.tenantId),
        this.reports.progress(portal.projectId),
        this.reports.photos(portal.projectId, MAX_PORTAL_PHOTOS),
        this.quotes.findByProjectAndStatuses(
          portal.projectId,
          VISIBLE_QUOTE_STATUSES,
        ),
        this.invoices.findByProjectWithBalance(
          portal.projectId,
          VISIBLE_INVOICE_STATUSES,
        ),
      ]);

    await this.track.execute(portal, 'view');

    return toPortalOverview({
      companyName: tenant.name,
      project,
      progress,
      photos,
      quotes: {
        total: quotes.length,
        open: quotes.filter(
          (q) => q.status === 'sent' && !isPastValidUntil(q.validUntil),
        ).length,
      },
      invoices: {
        total: invoices.length,
        late: invoices.filter((i) => i.balance?.isLate).length,
      },
      linkExpiresAt: portal.expiresAt,
    });
  }
}
