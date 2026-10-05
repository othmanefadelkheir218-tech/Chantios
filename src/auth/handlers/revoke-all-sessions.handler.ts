import { Injectable } from '@nestjs/common';
import { SessionsService } from '../../sessions/sessions.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/** `DELETE /api/auth/sessions` — kill every device. */
@Injectable()
export class RevokeAllSessionsHandler {
  constructor(private readonly sessions: SessionsService) {}

  async execute(actor: AuthenticatedUser) {
    const count = await this.sessions.revokeAllForUser(actor.userId);
    return { revoked: count };
  }
}
