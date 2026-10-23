import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { RequestActor } from '../../common/decorators/actor.decorator';
import { InvitationsService } from '../../invitations/invitations.service';
import { PlansService } from '../../plans/plans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { TenantsService } from '../../tenants/tenants.service';
import { AdminCreateTenantDto } from '../dto/admin-create-tenant.dto';
import {
  ADMIN_ROLE_ID,
  buildTrialSubscription,
} from '../helpers/new-company.helper';

/**
 * `POST /api/admin/tenants` — a company created by the super-admin gets the
 * same start as a self-signup (doc/notes/subscription-plans.md): in one
 * transaction the `tenants` row, the trial `tenant_subscriptions` row and an
 * invitation for its first `admin`. The invitation email goes out after the
 * commit. Lives in `auth`, next to the sign-up, because `tenants` cannot
 * import `subscriptions` / `invitations` (they import it).
 */
@Injectable()
export class AdminCreateTenantHandler {
  constructor(
    @InjectPinoLogger(AdminCreateTenantHandler.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService,
    private readonly tenants: TenantsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly plans: PlansService,
    private readonly invitations: InvitationsService,
  ) {}

  async execute(dto: AdminCreateTenantDto, actor: RequestActor) {
    const { owner_name, owner_email, ...tenantDto } = dto;
    const ownerEmail = owner_email.toLowerCase();
    this.logger.info(
      `Admin ${actor.adminUserId} creating company ${tenantDto.name} (boss ${ownerEmail})`,
    );

    const defaultPlan = await this.plans.findDefault();
    if (!defaultPlan) {
      this.logger.warn('Cannot create company: no default plan configured');
      throw new BadRequestException(
        'No default plan is configured — create one before adding a company',
      );
    }
    // 409 before anything is written.
    await this.invitations.assertFirstAdminEmailFree(ownerEmail);

    const { tenant, invitation, rawToken } = await this.prisma.$transaction(
      async (tx) => {
        const tenant = await this.tenants.create(tenantDto, actor, tx);
        await this.subscriptions.create(
          buildTrialSubscription(tenant.id, defaultPlan.id),
          tx,
        );
        const { invitation, rawToken } =
          await this.invitations.createFirstAdminInvitation(
            {
              tenantId: tenant.id,
              roleId: ADMIN_ROLE_ID,
              name: owner_name,
              email: ownerEmail,
              adminUserId: actor.adminUserId,
              ip: actor.ip,
            },
            tx,
          );
        return { tenant, invitation, rawToken };
      },
    );

    // Step 27: the TVA number (if any) is asked to VIES once the company exists.
    await this.tenants.checkVatNumber(tenant.id);

    await this.invitations.sendFirstAdminInvitation(
      ownerEmail,
      rawToken,
      tenant.name,
      tenant.locale,
    );
    this.logger.info(
      `Company created by admin: tenant ${tenant.id}, invitation ${invitation.id}`,
    );
    return { ...tenant, ownerInvitation: invitation };
  }
}
