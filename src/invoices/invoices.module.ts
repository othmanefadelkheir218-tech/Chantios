import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { ClientsModule } from '../clients/clients.module';
import { DocumentsModule } from '../documents/documents.module';
import { ProjectsModule } from '../projects/projects.module';
import { QuotesModule } from '../quotes/quotes.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CancelInvoiceHandler } from './handlers/cancel-invoice.handler';
import { CreateInvoiceHandler } from './handlers/create-invoice.handler';
import { FindInvoiceHandler } from './handlers/find-invoice.handler';
import { FindInvoicesHandler } from './handlers/find-invoices.handler';
import { FindPaymentsHandler } from './handlers/find-payments.handler';
import { InvoiceCoverageHandler } from './handlers/invoice-coverage.handler';
import { LateInvoicesHandler } from './handlers/late-invoices.handler';
import { RecordPaymentHandler } from './handlers/record-payment.handler';
import { SendInvoiceHandler } from './handlers/send-invoice.handler';
import { SendReminderHandler } from './handlers/send-reminder.handler';
import { SetInvoiceLinesHandler } from './handlers/set-invoice-lines.handler';
import { UpdateInvoiceHandler } from './handlers/update-invoice.handler';
import { LateInvoicesJob } from './jobs/late-invoices.job';
import { InvoiceRepository } from './repositories/invoice.repository';
import { PaymentRepository } from './repositories/payment.repository';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { ProjectInvoiceCoverageController } from './project-invoice-coverage.controller';

@Module({
  imports: [
    AuditModule,
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
    // `create-invoice.handler` validates `client_id` through `ClientsService`.
    ClientsModule,
    // `create-invoice.handler` validates `project_id`;
    // `project-invoice-coverage.controller` 404s an unknown project through
    // `ProjectsService` — never either module's repository.
    ProjectsModule,
    // `create-invoice.handler` validates an optional `quote_id`;
    // `invoice-coverage.handler` reads `sumAcceptedByProject` — both through
    // `QuotesService`, never its repository.
    QuotesModule,
    // The shared document-number counter and VAT-totals helper.
    DocumentsModule,
  ],
  controllers: [InvoicesController, ProjectInvoiceCoverageController],
  providers: [
    InvoicesService,
    InvoiceRepository,
    PaymentRepository,
    CreateInvoiceHandler,
    FindInvoicesHandler,
    FindInvoiceHandler,
    UpdateInvoiceHandler,
    SetInvoiceLinesHandler,
    SendInvoiceHandler,
    CancelInvoiceHandler,
    RecordPaymentHandler,
    FindPaymentsHandler,
    SendReminderHandler,
    LateInvoicesHandler,
    InvoiceCoverageHandler,
    LateInvoicesJob,
  ],
  exports: [InvoicesService],
})
export class InvoicesModule {}
