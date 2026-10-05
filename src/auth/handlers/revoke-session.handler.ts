import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionsService } from '../../sessions/sessions.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/** `DELETE /api/auth/sessions/:id` — kill one device. */
@Injectable()
export class RevokeSessionHandler {
  constructor(private readonly sessions: SessionsService) {}

  async execute(id: number, actor: AuthenticatedUser) {
    const session = await this.sessions.findLiveForUser(id, actor.userId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    await this.sessions.revoke(id);
    return { revoked: true };
  }
}
