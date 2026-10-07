import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { ClientsModule } from '../clients/clients.module';
import { DocumentsModule } from '../documents/documents.module';
import { MarginsModule } from '../margins/margins.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProjectsModule } from '../projects/projects.module';
import { RolesModule } from '../roles/roles.module';
import { StockModule } from '../stock/stock.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AcceptQuoteHandler } from './handlers/accept-quote.handler';
import { BudgetHistoryHandler } from './handlers/budget-history.handler';
import { CreateQuoteHandler } from './handlers/create-quote.handler';
import { FindQuoteHandler } from './handlers/find-quote.handler';
import { FindQuotesHandler } from './handlers/find-quotes.handler';
import { RefuseQuoteHandler } from './handlers/refuse-quote.handler';
import { SendQuoteHandler } from './handlers/send-quote.handler';
import { SetQuoteLinesHandler } from './handlers/set-quote-lines.handler';
import { UpdateQuoteHandler } from './handlers/update-quote.handler';
import { ProjectBudgetHistoryController } from './project-budget-history.controller';
import { QuoteRepository } from './repositories/quote.repository';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [
    AuditModule,
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    // `create-quote.handler` validates `client_id` through `ClientsService`.
    ClientsModule,
    NotificationsModule, // the "please review" client email
    // `create-quote.handler` validates `project_id`; `accept-quote.handler`
    // flips the project to `in_progress` through `ProjectsService` — never
    // either module's repository.
    ProjectsModule,
    // `accept-quote.handler` creates stock reservations through
    // `StockService`, inside its own transaction.
    StockModule,
    // The shared document-number counter and VAT-totals helper.
    DocumentsModule,
    // `accept-quote.handler` checks the 80 % / 95 % thresholds after the budget grows.
    MarginsModule,
  ],
  controllers: [QuotesController, ProjectBudgetHistoryController],
  providers: [
    QuotesService,
    QuoteRepository,
    CreateQuoteHandler,
    FindQuotesHandler,
    FindQuoteHandler,
    UpdateQuoteHandler,
    SetQuoteLinesHandler,
    SendQuoteHandler,
    AcceptQuoteHandler,
    RefuseQuoteHandler,
    BudgetHistoryHandler,
  ],
  // `invoices` imports this for `sumAcceptedByProject` (the coverage
  // warning) — never this module's repository.
  exports: [QuotesService],
})
export class QuotesModule {}
