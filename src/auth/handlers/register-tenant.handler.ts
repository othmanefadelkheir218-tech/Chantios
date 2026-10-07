import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { hashPassword } from '../../common/helpers/password.helper';
import { tenantEmailVerificationTemplate } from '../../email/templates/tenant-email-verification.template';
import { EmailService } from '../../email/email.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { OneTimeCodesService } from '../../one-time-codes/one-time-codes.service';
import { PlansService } from '../../plans/plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { toUserEntity } from '../../users/helpers/user.helper';
import { UsersService } from '../../users/users.service';
import { RegisterTenantDto } from '../dto/register-tenant.dto';

const ADMIN_ROLE_ID = 1;
const TRIAL_DAYS = 14;

/**
 * `POST /api/auth/register` — a new company. One transaction: `tenants` +
 * `users` (role `admin`) + `tenant_subscriptions` (doc/notes/subscription-plans.md
 * § "Decided — what a brand-new company gets"). Fails with a clear message
 * and writes nothing if no `is_default` plan exists yet.
 */
@Injectable()
export class RegisterTenantHandler {
  constructor(
    @InjectPinoLogger(RegisterTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly users: UsersService,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly codes: OneTimeCodesService,
    private readonly email: EmailService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(dto: RegisterTenantDto) {
    const email = dto.email.toLowerCase();
    this.logger.info(`Registering new company: ${dto.company_name} (${email})`);

    const defaultPlan = await this.plans.findDefault();
    if (!defaultPlan) {
      this.logger.warn('Cannot register: no default plan configured');
      throw new BadRequestException(
        'Registration is not available yet — no default plan is configured',
      );
    }

    const passwordHash = await hashPassword(dto.password);

    const { tenant, user } = await this.prisma.$transaction(async (tx) => {
      const tenant = await this.tenants.create(
        { name: dto.company_name, email, locale: dto.locale },
        { adminUserId: null, ip: null },
        tx,
      );

      // `tenant`/`role` are relations, not scalar FKs: this write runs on the
      // raw transaction client (the checked `UserCreateInput` shape), bypassing
      // the tenant extension on purpose — the tenant was only just created,
      // above, in this same transaction.
      const user = await this.users.create(
        {
          tenant: { connect: { id: tenant.id } },
          name: dto.name,
          email,
          phone: dto.phone,
          passwordHash,
          role: { connect: { id: ADMIN_ROLE_ID } },
        },
        tx,
      );

      const now = new Date();
      const periodEnd = new Date(
        now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
      );
      await this.subscriptions.create(
        {
          tenantId: tenant.id,
          planId: defaultPlan.id,
          status: 'trialing',
          periodStart: now,
          periodEnd,
        },
        tx,
      );

      return { tenant, user };
    });

    // ChantierOS staff hear about the new company (platform alert, no tenant row).
    // Right after the commit and BEFORE the verification email: a mail provider
    // that is down must not hide a company that really exists.
    await this.notifications.dispatch('tenant_signed_up', {
      payload: {
        entity_id: tenant.id,
        tenant_id: tenant.id,
        company_name: dto.company_name,
      },
    });

    // This verifies the registering user's OWN email (`users.email_verified_at`)
    // — a different flow from `tenants.email_verified_at`, which is for a
    // tenant the super-admin created directly. Reuses the generic
    // one-time-codes/email infra, not the tenant-specific handlers built in
    // step 01 (doc/notes/WhereIStop/state.md).
    const code = await this.codes.generate('email_verification', {
      userId: user.id,
    });
    const { subject, html } = tenantEmailVerificationTemplate(code);
    await this.email.send(user.email, subject, html);

    this.logger.info(
      `Company registered: tenant ${tenant.id}, admin user ${user.id}`,
    );
    return { tenant_id: tenant.id, user: toUserEntity(user) };
  }
}
