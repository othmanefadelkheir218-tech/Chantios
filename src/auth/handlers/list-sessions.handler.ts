import { Injectable } from '@nestjs/common';
import { SessionsService } from '../../sessions/sessions.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/** `GET /api/auth/sessions` — this user's live `refresh_tokens` rows. */
@Injectable()
export class ListSessionsHandler {
  constructor(private readonly sessions: SessionsService) {}

  execute(actor: AuthenticatedUser) {
    return this.sessions.listLiveForUser(actor.userId);
  }
}
