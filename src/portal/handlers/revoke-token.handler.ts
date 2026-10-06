import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { ProjectsService } from '../../projects/projects.service';
import { PortalTokenRepository } from '../repositories/portal-token.repository';

/**
 * `DELETE /api/projects/:id/portal-link` — `is_active = false`. Instant: no
 * cache, no grace period, the URL fails on the very next request (the guard
 * reads the row on every request).
 */
@Injectable()
export class RevokeTokenHandler {
  constructor(
    @InjectPinoLogger(RevokeTokenHandler.name)
    private readonly logger: PinoLogger,
    private readonly tokens: PortalTokenRepository,
    private readonly projects: ProjectsService,
    private readonly audit: AuditService,
  ) {}

  async execute(projectId: number, actor: AuthenticatedUser) {
    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(projectId);

    const revoked = await this.tokens.deactivateByProject(projectId);
    if (revoked === 0) {
      this.logger.warn(`Project ${projectId} has no active portal link`);
      throw new NotFoundException('This project has no active portal link');
    }

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'revoke',
      entityType: 'portal_token',
      newValue: { projectId },
      ipAddress: null,
    });
    this.logger.info(`Portal link of project ${projectId} revoked`);
    return { revoked: true };
  }
}
