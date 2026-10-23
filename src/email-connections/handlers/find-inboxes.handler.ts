import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { loadPermissions } from '../../auth/helpers/permission.helper';
import { RolesService } from '../../roles/roles.service';
import { UsersService } from '../../users/users.service';
import {
  toCompanyInboxEntity,
  toGmailInboxEntity,
} from '../helpers/inbox.helper';
import { EmailInboxRepository } from '../repositories/email-inbox.repository';

/**
 * `GET /api/email-inboxes` — the company inbox + the caller's own Gmail
 * inboxes. A user with `settings` view also gets every other Gmail inbox of
 * the company, **status only** (doc/notes/client-email.md § Who does what).
 */
@Injectable()
export class FindInboxesHandler {
  constructor(
    @InjectPinoLogger(FindInboxesHandler.name)
    private readonly logger: PinoLogger,
    private readonly inboxes: EmailInboxRepository,
    private readonly roles: RolesService,
    private readonly users: UsersService,
  ) {}

  async execute(actor: AuthenticatedUser) {
    this.logger.debug(`Listing email inboxes for user ${actor.userId}`);
    const can = await loadPermissions(this.roles, actor.roleId);
    const [company, mine] = await Promise.all([
      this.inboxes.findCompanyInbox(),
      this.inboxes.findForUser(actor.userId),
    ]);

    let others: ReturnType<typeof toGmailInboxEntity>[] | null = null;
    if (can('settings').canView) {
      const all = await this.inboxes.findAllGmail();
      const foreign = all.filter((inbox) => inbox.ownerUserId !== actor.userId);
      const names = await this.ownerNames(
        foreign.map((inbox) => inbox.ownerUserId as number),
        actor.tenantId,
      );
      others = foreign.map((inbox) =>
        toGmailInboxEntity(
          inbox,
          false,
          names.get(inbox.ownerUserId as number) ?? null,
        ),
      );
    }

    return {
      company: company ? toCompanyInboxEntity(company) : null,
      mine: mine.map((inbox) => toGmailInboxEntity(inbox, true, null)),
      others,
    };
  }

  private async ownerNames(ids: number[], tenantId: number) {
    const names = new Map<number, string>();
    for (const id of new Set(ids)) {
      const user = await this.users.findByIdRaw(id);
      if (user && user.tenantId === tenantId) names.set(id, user.name);
    }
    return names;
  }
}
