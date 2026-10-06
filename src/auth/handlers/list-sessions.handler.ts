import { Injectable } from '@nestjs/common';
import { SessionsService } from '../../sessions/sessions.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

/** `GET /api/auth/sessions` — this user's live `refresh_tokens` rows. */
@Injectable()
export class ListSessionsHandler {
  constructor(private readonly sessions: SessionsService) {}

  /** Never returns `token_hash` — the hash is a secret-equivalent lookup key. */
  async execute(actor: AuthenticatedUser) {
    const rows = await this.sessions.listLiveForUser(actor.userId);
    return rows.map((row) => ({
      id: row.id,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
    }));
  }
}
