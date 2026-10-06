import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ChatService } from '../../chat/chat.service';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { ProjectsService } from '../../projects/projects.service';
import { GenerateTokenDto } from '../dto/generate-token.dto';
import {
  buildPortalUrl,
  DEFAULT_EXPIRY_DAYS,
  expiryFromNow,
  generateRawToken,
  hashToken,
} from '../helpers/portal.helper';
import { PortalTokenRepository } from '../repositories/portal-token.repository';

/**
 * `POST /api/projects/:id/portal-link` — staff clicks "Generate link". Manual,
 * never automatic on project creation (that would open a client chat for every
 * prospect the company never wins).
 *
 *  - a random token; ONLY its sha256 is stored, the raw token is returned
 *    ONCE and exists nowhere else;
 *  - the previous active link is deactivated in the SAME transaction (the
 *    partial unique index allows one active link per project) — the old URL
 *    stops working at once;
 *  - `expires_at` = now + 90 days (or `expires_in_days`), in the column;
 *  - the project's client conversation is found-or-created through chat's
 *    idempotent `ensureProjectConversation`, so regenerating never makes a
 *    second thread.
 * The audit row never contains the token or its hash.
 */
@Injectable()
export class GenerateTokenHandler {
  constructor(
    @InjectPinoLogger(GenerateTokenHandler.name)
    private readonly logger: PinoLogger,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly tokens: PortalTokenRepository,
    private readonly projects: ProjectsService,
    private readonly chat: ChatService,
    private readonly audit: AuditService,
  ) {}

  async execute(
    projectId: number,
    dto: GenerateTokenDto,
    actor: AuthenticatedUser,
  ) {
    // Throws NotFoundException if the project does not belong to this tenant.
    const project = await this.projects.findOne(projectId);
    this.logger.info(`Generating a portal link for project ${projectId}`);

    // Idempotent: a regenerated link reuses the one thread.
    await this.chat.ensureProjectConversation(projectId, actor);

    const rawToken = generateRawToken();
    const expiresAt = expiryFromNow(dto.expires_in_days ?? DEFAULT_EXPIRY_DAYS);

    const { token, replaced } = await this.tenantPrisma.db.$transaction(
      async (tx) => {
        const replaced = await this.tokens.deactivateByProject(projectId, tx);
        const token = await this.tokens.create(
          {
            tenantId: actor.tenantId,
            clientId: project.clientId,
            projectId,
            tokenHash: hashToken(rawToken),
            expiresAt,
            createdBy: actor.userId,
          },
          tx,
        );
        return { token, replaced };
      },
    );

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'generate',
      entityType: 'portal_token',
      entityId: token.id,
      newValue: {
        projectId,
        expiresAt,
        replacedPreviousLink: replaced > 0,
      },
      ipAddress: null,
    });
    this.logger.info(
      `Portal link ${token.id} created for project ${projectId} (replaced ${replaced} previous link(s))`,
    );
    return {
      token: rawToken,
      url: buildPortalUrl(rawToken),
      expiresAt: token.expiresAt,
      replacedPreviousLink: replaced > 0,
    };
  }
}
