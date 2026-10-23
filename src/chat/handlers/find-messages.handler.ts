import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { toPaginated, toSkip } from '../../common/helpers/pagination.helper';
import { MediaService } from '../../media/media.service';
import { FindMessagesQueryDto } from '../dto/find-messages-query.dto';
import { toMessageEntity } from '../helpers/chat.helper';
import { MessageRepository } from '../repositories/message.repository';
import { CheckAccessHandler } from './check-access.handler';
import { ReadReceiptsHandler } from './read-receipts.handler';

/**
 * `GET /api/conversations/:id/messages` — paginated, newest first. A non-member
 * gets `403`. The files of the whole page are read in ONE query through
 * `MediaService` (`entity_type = 'message'`), never one per message.
 * Step 26 C: in the team chat, the caller's OWN messages also carry
 * `read_count` / `member_count` (`ReadReceiptsHandler`, one batch).
 */
@Injectable()
export class FindMessagesHandler {
  constructor(
    @InjectPinoLogger(FindMessagesHandler.name)
    private readonly logger: PinoLogger,
    private readonly messages: MessageRepository,
    private readonly access: CheckAccessHandler,
    private readonly media: MediaService,
    private readonly receipts: ReadReceiptsHandler,
  ) {}

  async execute(
    conversationId: number,
    { page, limit }: FindMessagesQueryDto,
    actor: AuthenticatedUser,
  ) {
    const conversation = await this.access.assertMember(conversationId, {
      userId: actor.userId,
    });
    this.logger.debug(
      `Listing messages of conversation ${conversationId} (page ${page})`,
    );

    const [rows, total] = await this.messages.findMany(
      conversationId,
      toSkip(page, limit),
      limit,
    );
    const own = rows.filter(
      (row) => row.senderType === 'employee' && row.senderId === actor.userId,
    );
    const [files, receipts] = await Promise.all([
      this.media.findByEntityIds(
        'message',
        rows.map((row) => row.id),
      ),
      this.receipts.forMessages(conversation, own),
    ]);
    return toPaginated(
      rows.map((row) =>
        toMessageEntity(row, files.get(row.id) ?? [], receipts.get(row.id)),
      ),
      total,
      page,
      limit,
    );
  }
}
