import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ClientsModule } from './clients/clients.module';
import { validateEnv } from './config/env.config';
import { loggerConfig } from './config/logger.config';
import { DocumentsModule } from './documents/documents.module';
import { EmailModule } from './email/email.module';
import { FeedbackModule } from './feedback/feedback.module';
import { HealthModule } from './health/health.module';
import { InvitationsModule } from './invitations/invitations.module';
import { InvoicesModule } from './invoices/invoices.module';
import { CostTypesModule } from './cost-types/cost-types.module';
import { PurchaseInvoicesModule } from './purchase-invoices/purchase-invoices.module';
import { SubcontractorsModule } from './subcontractors/subcontractors.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { MaterialsModule } from './materials/materials.module';
import { MediaModule } from './media/media.module';
import { OneTimeCodesModule } from './one-time-codes/one-time-codes.module';
import { PlansModule } from './plans/plans.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { QuotesModule } from './quotes/quotes.module';
import { RolesModule } from './roles/roles.module';
import { ServicesModule } from './services/services.module';
import { StockModule } from './stock/stock.module';
import { StripeModule } from './stripe/stripe.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TenantsModule } from './tenants/tenants.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: loggerConfig,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.getOrThrow<string>('REDIS_URL'));
        return {
          connection: { host: url.hostname, port: Number(url.port) },
        };
      },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    StripeModule,
    // Step 01 — platform
    AuditModule,
    EmailModule,
    OneTimeCodesModule,
    TenantsModule,
    AdminUsersModule,
    PlansModule,
    SubscriptionsModule,
    AnalyticsModule,
    FeedbackModule,
    // Step 02 — auth & users
    UsersModule,
    RolesModule,
    InvitationsModule,
    AuthModule,
    // Step 03 — media
    MediaModule,
    // Step 04 — clients & projects
    ClientsModule,
    ProjectsModule,
    // Step 05 — catalogue & stock
    CategoriesModule,
    MaterialsModule,
    ServicesModule,
    StockModule,
    // Step 06 — quotes & invoices
    DocumentsModule,
    QuotesModule,
    InvoicesModule,
    // Step 07 — purchases
    CostTypesModule,
    SuppliersModule,
    SubcontractorsModule,
    PurchaseInvoicesModule,
    // Step 08 — planning & time
    TasksModule,
    TimeEntriesModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
