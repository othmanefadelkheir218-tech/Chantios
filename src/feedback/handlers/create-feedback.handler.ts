import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { FeedbackRepository } from '../repositories/feedback.repository';

/** `POST /api/feedback` — any role. Always `status = 'new'` (the column default). */
@Injectable()
export class CreateFeedbackHandler {
  constructor(
    @InjectPinoLogger(CreateFeedbackHandler.name)
    private readonly logger: PinoLogger,
    private readonly feedback: FeedbackRepository,
    private readonly audit: AuditService,
  ) {}

  async execute(dto: CreateFeedbackDto, actor: AuthenticatedUser) {
    this.logger.info(
      `User ${actor.userId} submitting feedback (${dto.type}) for tenant ${actor.tenantId}`,
    );

    const created = await this.feedback.create({
      tenantId: actor.tenantId,
      submittedBy: actor.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body ?? null,
    });

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'create',
      entityType: 'feedback',
      entityId: created.id,
      newValue: created,
      ipAddress: null,
    });
    this.logger.info(`Feedback created: ${created.id}`);
    return created;
  }
}
