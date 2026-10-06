import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { ChatModule } from '../chat/chat.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { MediaModule } from '../media/media.module';
import { ProjectsModule } from '../projects/projects.module';
import { QuotesModule } from '../quotes/quotes.module';
import { ReportsModule } from '../reports/reports.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { FindPortalLinkHandler } from './handlers/find-portal-link.handler';
import { ExpireTokensHandler } from './handlers/expire-tokens.handler';
import { FindTrackingHandler } from './handlers/find-tracking.handler';
import { GenerateTokenHandler } from './handlers/generate-token.handler';
import { PortalAcceptQuoteHandler } from './handlers/portal-accept-quote.handler';
import { PortalDocumentHandler } from './handlers/portal-document.handler';
import { PortalInvoicesHandler } from './handlers/portal-invoices.handler';
import { PortalMessagesHandler } from './handlers/portal-messages.handler';
import { PortalOverviewHandler } from './handlers/portal-overview.handler';
import { PortalQuotesHandler } from './handlers/portal-quotes.handler';
import { PortalRefuseQuoteHandler } from './handlers/portal-refuse-quote.handler';
import { PortalSendMessageHandler } from './handlers/portal-send-message.handler';
import { RevokeTokenHandler } from './handlers/revoke-token.handler';
import { TrackEventHandler } from './handlers/track-event.handler';
import { PortalTokenGuard } from './guards/portal-token.guard';
import { PortalHeadersInterceptor } from './interceptors/portal-headers.interceptor';
import { ExpireTokensJob } from './jobs/expire-tokens.job';
import { PortalAdminController } from './portal-admin.controller';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';
import { PortalTokenRepository } from './repositories/portal-token.repository';
import { PortalTrackingRepository } from './repositories/portal-tracking.repository';

/**
 * Nothing imports this module: it is the top of the dependency chain, built
 * ON the others (quotes, invoices, reports, chat, projects, media), always
 * through their services — never their repositories.
 */
@Module({
  imports: [
    AuditModule,
    ProjectsModule, // the project, and the staff routes' project check
    QuotesModule, // the visible quotes; accept / refuse = the SAME handlers staff use
    InvoicesModule, // the visible invoices + the live balance and late flag
    ReportsModule, // the progress % and the report photos
    ChatModule, // the project conversation, the client's messages
    MediaModule, // the frozen PDFs
    TenantsModule, // the company name (also needed by the guards)
    // What `@TenantAuth()` needs to resolve its own dependencies (staff routes).
    TokenModule,
    RolesModule,
    SubscriptionsModule,
  ],
  controllers: [PortalAdminController, PortalController],
  providers: [
    PortalService,
    PortalTokenRepository,
    PortalTrackingRepository,
    PortalTokenGuard,
    PortalHeadersInterceptor,
    GenerateTokenHandler,
    RevokeTokenHandler,
    FindPortalLinkHandler,
    FindTrackingHandler,
    PortalOverviewHandler,
    PortalQuotesHandler,
    PortalInvoicesHandler,
    PortalAcceptQuoteHandler,
    PortalRefuseQuoteHandler,
    PortalMessagesHandler,
    PortalSendMessageHandler,
    PortalDocumentHandler,
    TrackEventHandler,
    ExpireTokensHandler,
    ExpireTokensJob,
  ],
})
export class PortalModule {}
