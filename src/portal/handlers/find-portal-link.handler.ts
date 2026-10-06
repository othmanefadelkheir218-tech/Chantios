import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ProjectsService } from '../../projects/projects.service';
import { isTokenUsable } from '../helpers/portal.helper';
import { PortalTokenRepository } from '../repositories/portal-token.repository';

/**
 * `GET /api/projects/:id/portal-link` — the link's STATUS and expiry. Never
 * the token: only its hash is stored, so it cannot be shown again. Lose it and
 * you generate a new one (which kills the old).
 */
@Injectable()
export class FindPortalLinkHandler {
  constructor(
    @InjectPinoLogger(FindPortalLinkHandler.name)
    private readonly logger: PinoLogger,
    private readonly tokens: PortalTokenRepository,
    private readonly projects: ProjectsService,
  ) {}

  async execute(projectId: number) {
    // Throws NotFoundException if the project does not belong to this tenant.
    await this.projects.findOne(projectId);

    const latest = await this.tokens.findLatestByProject(projectId);
    this.logger.debug(`Reading the portal link status of project ${projectId}`);
    if (!latest) {
      return { active: false, expiresAt: null, createdAt: null };
    }
    return {
      active: isTokenUsable(latest),
      expiresAt: latest.expiresAt,
      createdAt: latest.createdAt,
    };
  }
}
