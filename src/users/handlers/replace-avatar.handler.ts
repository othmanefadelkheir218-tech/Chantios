import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MediaService } from '../../media/media.service';

/**
 * `POST /api/users/me/avatar` — delegates to the media module's
 * single-image replace operation, through `MediaService` (never its
 * repository), per the cross-module rule. `entity_id` is always the
 * caller's own id, never a route param.
 */
@Injectable()
export class ReplaceAvatarHandler {
  constructor(
    @InjectPinoLogger(ReplaceAvatarHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaService,
  ) {}

  execute(file: Express.Multer.File, actor: AuthenticatedUser) {
    this.logger.info(`Replacing avatar for user ${actor.userId}`);
    return this.media.replaceMedia('user', actor.userId, file, actor);
  }
}
