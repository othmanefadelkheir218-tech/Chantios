import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Notification, Prisma, Tenant } from '@prisma/client';
import { Queue } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AdminUsersService } from '../../admin-users/admin-users.service';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { RolesService } from '../../roles/roles.service';
import { TenantsService } from '../../tenants/tenants.service';
import { UsersService } from '../../users/users.service';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import {
  StaffCandidate,
  filterStaffRecipients,
  recipientRule,
} from '../helpers/notification-recipients.helper';
import { renderNotification } from '../helpers/notification-templates.helper';
import {
  DispatchContext,
  NOTIFICATIONS_QUEUE,
  NotificationType,
} from '../notification.types';
import { NotificationRepository } from '../repositories/notification.repository';

/** One email to send: the queue job the processor takes. */
export interface EmailJob {
  to: string;
  subject: string;
  html: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * THE single entry point of every alert (`NotificationsService.dispatch`
 * calls this). In order:
 *
 *   1. work out the recipients — `notification-recipients.helper` is the only
 *      place that decides who gets what;
 *   2. skip anyone who already got the same alert recently (`dedupeDays`);
 *   3. write the `notifications` rows — the in-app copy exists from here on;
 *   4. push each row on its user's socket room, at once;
 *   5. queue one email per recipient. A failed email is retried by the queue
 *      and never touches the row or the socket event.
 *
 * Client alerts are email only: no row, in the company's locale.
 */
@Injectable()
export class DispatchNotificationHandler {
  constructor(
    @InjectPinoLogger(DispatchNotificationHandler.name)
    private readonly logger: PinoLogger,
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
    private readonly notifications: NotificationRepository,
    private readonly gateway: NotificationsGateway,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
    private readonly users: UsersService,
    private readonly roles: RolesService,
    private readonly tenants: TenantsService,
    private readonly adminUsers: AdminUsersService,
  ) {}

  async execute(
    type: NotificationType,
    context: DispatchContext,
  ): Promise<number> {
    const rule = recipientRule(type);

    if (rule.kind === 'platform') return this.toPlatform(type, context);

    if (!context.tenantId) {
      this.logger.warn(`Alert ${type} dropped: no tenant`);
      return 0;
    }
    const tenant = await this.tenants.findForNotifications(context.tenantId);
    if (!tenant) {
      this.logger.warn(
        `Alert ${type} dropped: tenant ${context.tenantId} gone`,
      );
      return 0;
    }

    if (rule.kind === 'client') return this.toClient(type, context, tenant);

    // A cron or a queue has no request: open a store and put the tenant in it,
    // exactly what `TenantGuard` does for a route (the tenant-scoped repositories read it).
    return this.cls.run(async () => {
      this.tenantContext.setTenantId(tenant.id);
      const candidates = await this.resolveUsers(type, context, rule);
      const recipients = await this.dropRecentlyNotified(
        type,
        context,
        candidates,
      );
      if (recipients.length === 0) return 0;

      const rows = await this.notifications.createMany(
        recipients.map((user) => ({
          tenantId: tenant.id,
          userId: user.id,
          type,
          payload: (context.payload ?? {}) as Prisma.InputJsonValue,
        })),
      );
      const byUser = new Map(recipients.map((user) => [user.id, user]));
      for (const row of rows) {
        this.deliver(row, byUser.get(row.userId ?? 0)?.email, tenant.locale);
      }
      return rows.length;
    });
  }

  private async toPlatform(
    type: NotificationType,
    context: DispatchContext,
  ): Promise<number> {
    const admins = await this.adminUsers.findActiveRecipients();
    if (admins.length === 0) return 0;
    const rows = await this.notifications.createMany(
      admins.map((admin) => ({
        tenantId: null,
        adminUserId: admin.id,
        type,
        payload: (context.payload ?? {}) as Prisma.InputJsonValue,
      })),
    );
    const byAdmin = new Map(admins.map((admin) => [admin.id, admin]));
    for (const row of rows) {
      this.deliver(row, byAdmin.get(row.adminUserId ?? 0)?.email, 'en');
    }
    return rows.length;
  }

  private async toClient(
    type: NotificationType,
    context: DispatchContext,
    tenant: Tenant,
  ): Promise<number> {
    if (!context.clientEmail) {
      this.logger.warn(`Client alert ${type} dropped: no email address`);
      return 0;
    }
    const payload = { company_name: tenant.name, ...context.payload };
    const { subject, html } = renderNotification(type, payload, tenant.locale);
    await this.queueEmail({ to: context.clientEmail, subject, html });
    return 1;
  }

  private async resolveUsers(
    type: NotificationType,
    context: DispatchContext,
    rule: ReturnType<typeof recipientRule>,
  ): Promise<StaffCandidate[]> {
    const exclude = new Set(context.excludeUserIds ?? []);
    if (rule.kind === 'explicit') {
      const ids = [...new Set(context.userIds ?? [])];
      if (ids.length === 0) return [];
      const users = await this.users.findActiveWithRole(ids);
      return users.filter((user) => !exclude.has(user.id));
    }
    if (rule.kind !== 'staff') return [];

    const everyone = await this.users.findActiveWithRole();
    const roleIds = [...new Set(everyone.map((user) => user.roleId))];
    const overrides = new Map(
      await Promise.all(
        roleIds.map(
          async (roleId) =>
            [roleId, await this.roles.findOverridesForRole(roleId)] as const,
        ),
      ),
    );
    return filterStaffRecipients(everyone, rule.module, overrides).filter(
      (user) => !exclude.has(user.id),
    );
  }

  private async dropRecentlyNotified(
    type: NotificationType,
    context: DispatchContext,
    candidates: StaffCandidate[],
  ): Promise<StaffCandidate[]> {
    const entityId = context.payload?.entity_id;
    if (!context.dedupeDays || typeof entityId !== 'number') return candidates;
    if (candidates.length === 0) return candidates;
    const already = await this.notifications.findRecentRecipients(
      type,
      entityId,
      candidates.map((user) => user.id),
      new Date(Date.now() - context.dedupeDays * DAY_MS),
    );
    return candidates.filter((user) => !already.has(user.id));
  }

  /** Socket first, then the email — and the email can fail without taking the socket event back. */
  private deliver(
    row: Notification,
    email: string | undefined,
    locale: string,
  ): void {
    try {
      this.gateway.emit(row);
    } catch (err: unknown) {
      this.logger.warn(
        { err },
        `Socket emit failed for notification ${row.id}`,
      );
    }
    if (!email) return;
    const { subject, html } = renderNotification(
      row.type as NotificationType,
      row.payload as Record<string, unknown> | null,
      locale,
    );
    void this.queueEmail({ to: email, subject, html });
  }

  private async queueEmail(job: EmailJob): Promise<void> {
    try {
      await this.queue.add('email', job, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
        removeOnFail: 100,
      });
    } catch (err: unknown) {
      this.logger.warn({ err }, `Email to ${job.to} could not be queued`);
    }
  }
}
