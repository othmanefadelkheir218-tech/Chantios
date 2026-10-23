import { ConflictException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { isUniqueViolation } from '../../common/helpers/unique-violation.helper';
import { SetCompanyAddressDto } from '../dto/set-company-address.dto';
import { toCompanyInboxEntity } from '../helpers/inbox.helper';
import { EmailInboxRepository } from '../repositories/email-inbox.repository';

/**
 * `PATCH /api/email-inboxes/company` — the admin picks the company address
 * (doc/notes/client-email.md § Who does what). The first call creates the
 * company inbox. A new name becomes primary; the old one keeps working.
 * Picking an old name of this company again makes it primary again.
 */
@Injectable()
export class SetCompanyAddressHandler {
  constructor(
    @InjectPinoLogger(SetCompanyAddressHandler.name)
    private readonly logger: PinoLogger,
    private readonly inboxes: EmailInboxRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: SetCompanyAddressDto, actor: AuthenticatedUser) {
    const localPart = dto.local_part.toLowerCase();
    this.logger.info(`Setting company address "${localPart}"`);

    const company =
      (await this.inboxes.findCompanyInbox()) ??
      (await this.createCompanyInbox(actor.tenantId));
    const before = toCompanyInboxEntity(company);

    const taken = await this.inboxes.findAddressForRouting(localPart);
    if (taken && taken.inboxId !== company.id) {
      this.logger.warn(`Company address "${localPart}" is already taken`);
      throw new ConflictException('This address is already taken');
    }
    if (taken?.isPrimary) {
      return before; // already the company address — nothing to change
    }

    await this.inboxes.demotePrimary(company.id);
    if (taken) {
      await this.inboxes.promote(taken.id);
    } else {
      try {
        await this.inboxes.addAddress(
          actor.tenantId,
          company.id,
          localPart,
          true,
        );
      } catch (error: unknown) {
        if (!isUniqueViolation(error)) throw error;
        this.logger.warn(`Company address "${localPart}" taken meanwhile`);
        throw new ConflictException('This address is already taken');
      }
    }

    const updated = await this.inboxes.findById(company.id);
    const after = toCompanyInboxEntity(updated ?? company);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'set_company_email_address',
      entityType: 'email_inbox',
      entityId: company.id,
      oldValue: before,
      newValue: after,
      ipAddress: null,
    });
    this.logger.info(`Company address is now ${after.address}`);
    return after;
  }

  private async createCompanyInbox(tenantId: number) {
    this.logger.info(`Creating the company inbox of tenant ${tenantId}`);
    const created = await this.inboxes.createCompanyInbox(tenantId);
    return { ...created, addresses: [] };
  }
}
