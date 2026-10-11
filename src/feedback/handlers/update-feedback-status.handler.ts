import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { RequestActor } from '../../common/decorators/actor.decorator';
import { UpdateFeedbackStatusDto } from '../dto/update-feedback-status.dto';
import { FeedbackRepository } from '../repositories/feedback.repository';

@Injectable()
export class UpdateFeedbackStatusHandler {
  constructor(
    @InjectPinoLogger(UpdateFeedbackStatusHandler.name)
    private readonly logger: PinoLogger,
    private readonly feedback: FeedbackRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(
    id: number,
    { status }: UpdateFeedbackStatusDto,
    actor: RequestActor,
  ) {
    this.logger.info(`Setting feedback ${id} to ${status}`);

    const existing = await this.feedback.findById(id);
    if (!existing) {
      this.logger.warn(`Cannot update feedback: ${id} not found`);
      throw new NotFoundException('Feedback not found');
    }
    const updated = await this.feedback.updateStatus(id, status);
    // Written by hand, not the @AuditLog interceptor: the route has no
    // `tenant_id` param, and the feedback's company must stay on its audit row.
    await this.audit.write({
      tenantId: existing.tenantId,
      adminUserId: actor.adminUserId,
      action: 'update_status',
      entityType: 'feedback',
      entityId: id,
      oldValue: { status: existing.status },
      newValue: { status: updated.status },
      ipAddress: actor.ip,
    });
    this.logger.info(`Feedback ${id} is now ${status}`);
    return updated;
  }
}
