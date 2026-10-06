import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { PortalContextData } from './decorators/portal-context.decorator';
import { FindPortalMessagesQueryDto } from './dto/find-portal-messages-query.dto';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { PortalMessageDto } from './dto/portal-message.dto';
import { FindPortalLinkHandler } from './handlers/find-portal-link.handler';
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

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class PortalService {
  constructor(
    private readonly generateToken: GenerateTokenHandler,
    private readonly revokeToken: RevokeTokenHandler,
    private readonly findLink: FindPortalLinkHandler,
    private readonly findTracking: FindTrackingHandler,
    private readonly overview: PortalOverviewHandler,
    private readonly quotes: PortalQuotesHandler,
    private readonly invoices: PortalInvoicesHandler,
    private readonly acceptQuote: PortalAcceptQuoteHandler,
    private readonly refuseQuote: PortalRefuseQuoteHandler,
    private readonly messages: PortalMessagesHandler,
    private readonly sendMessage: PortalSendMessageHandler,
    private readonly document: PortalDocumentHandler,
  ) {}

  // ---- Staff side (behind AuthGuard) ----

  generate(projectId: number, dto: GenerateTokenDto, actor: AuthenticatedUser) {
    return this.generateToken.execute(projectId, dto, actor);
  }

  link(projectId: number) {
    return this.findLink.execute(projectId);
  }

  revoke(projectId: number, actor: AuthenticatedUser) {
    return this.revokeToken.execute(projectId, actor);
  }

  tracking(projectId: number) {
    return this.findTracking.execute(projectId);
  }

  // ---- Client side (behind PortalTokenGuard, no JWT) ----

  getOverview(portal: PortalContextData) {
    return this.overview.execute(portal);
  }

  getQuotes(portal: PortalContextData) {
    return this.quotes.execute(portal);
  }

  accept(portal: PortalContextData, quoteId: number) {
    return this.acceptQuote.execute(portal, quoteId);
  }

  refuse(portal: PortalContextData, quoteId: number) {
    return this.refuseQuote.execute(portal, quoteId);
  }

  getInvoices(portal: PortalContextData) {
    return this.invoices.execute(portal);
  }

  getMessages(portal: PortalContextData, query: FindPortalMessagesQueryDto) {
    return this.messages.execute(portal, query);
  }

  postMessage(portal: PortalContextData, dto: PortalMessageDto) {
    return this.sendMessage.execute(portal, dto);
  }

  /** The URL of a document the client may open (and a `download` tracking row). */
  documentUrl(portal: PortalContextData, mediaId: number) {
    return this.document.execute(portal, mediaId);
  }
}
