import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { AppEventsService } from '../../common/events/app-events.service';
import { SessionsService } from '../../sessions/sessions.service';
import { RequestActor } from '../../common/decorators/actor.decorator';
import { SetTenantStatusDto } from '../dto/suspend-tenant.dto';
import { toTenantEntity } from '../helpers/tenant.helper';
import { TenantRepository } from '../repositories/tenant.repository';

@Injectable()
export class SetTenantStatusHandler {
  constructor(
    @InjectPinoLogger(SetTenantStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenants: TenantRepository,
    private readonly audit: AuditService,
    private readonly sessions: SessionsService,
    private readonly events: AppEventsService,
  ) {}

  async execute(id: number, dto: SetTenantStatusDto, actor: RequestActor) {
    this.logger.info(`Setting tenant ${id} to ${dto.status}`);

    const current = await this.tenants.findById(id);
    if (!current) {
      this.logger.warn(`Cannot set status: tenant ${id} not found`);
      throw new NotFoundException('Tenant not found');
    }
    if (current.status === dto.status) {
      throw new BadRequestException(`Tenant is already ${dto.status}`);
    }

    const updated = await this.tenants.setStatus(id, dto.status);

    if (updated.status === 'suspended' || updated.status === 'banned') {
      await this.sessions.revokeAllForTenant(id);
    }
    await this.audit.write({
      tenantId: id,
      adminUserId: actor.adminUserId,
      action: 'set_status',
      entityType: 'tenant',
      entityId: id,
      oldValue: { status: current.status },
      newValue: { status: updated.status, reason: dto.reason ?? null },
      ipAddress: actor.ip,
    });
    // ChantierOS staff are told by `notifications` (it listens; this module must not import it).
    this.events.emit('tenant.status_changed', {
      tenantId: id,
      companyName: updated.name,
      status: updated.status,
    });
    this.logger.info(`Tenant ${id}: ${current.status} -> ${updated.status}`);
    return toTenantEntity(updated);
  }
}
