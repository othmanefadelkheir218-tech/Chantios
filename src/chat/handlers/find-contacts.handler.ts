import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MediaService } from '../../media/media.service';
import { UsersService } from '../../users/users.service';

/**
 * `GET /api/conversations/contacts` — the people a chat user can start a
 * conversation with: every ACTIVE user of the caller's company, the caller
 * included (the frontend also reads names and photos from it). Only `id`,
 * `name`, `role`, `avatarUrl` — never email, phone or hourly rate, because a
 * worker can read it and has no `team` right. Decision in
 * `chat-conversations.md` § Contacts.
 */
@Injectable()
export class FindContactsHandler {
  constructor(
    @InjectPinoLogger(FindContactsHandler.name)
    private readonly logger: PinoLogger,
    private readonly users: UsersService,
    private readonly media: MediaService,
  ) {}

  async execute(actor: AuthenticatedUser) {
    this.logger.debug(`Listing chat contacts for user ${actor.userId}`);
    const rows = await this.users.findActiveWithRole();
    // One query for every photo. A user has one avatar (replaced on upload); the newest wins.
    const avatars = await this.media.findByEntityIds(
      'user',
      rows.map((row) => row.id),
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.roleName,
      avatarUrl: avatars.get(row.id)?.at(-1)?.fileUrl ?? null,
    }));
  }
}
