import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { PENDING_ENTITY_ID } from '../../media/helpers/media.helper';
import { MediaService } from '../../media/media.service';

/**
 * `POST /api/client-chats/attachments` — a file for an email we are about to
 * send (D2: the same types and 25 MB as a received one, programs refused).
 * It waits as a pending `email_attachment` (`entity_id = 0`) until the email
 * names it in `media_ids`. Email files never show in `/api/media`.
 */
@Injectable()
export class UploadEmailAttachmentHandler {
  constructor(
    @InjectPinoLogger(UploadEmailAttachmentHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaService,
  ) {}

  async execute(file: Express.Multer.File, actor: AuthenticatedUser) {
    if (!file) throw new BadRequestException('No file was sent');
    const check = this.media.checkEmailAttachment(
      file.originalname,
      file.mimetype,
      file.size,
    );
    if (!check.ok) {
      this.logger.warn(
        `Email file "${file.originalname}" refused: ${check.reason}`,
      );
      throw new BadRequestException(
        check.reason === 'too_large'
          ? 'File too large: max 25 MB'
          : 'This type of file cannot be sent by email',
      );
    }
    return this.media.upload(
      { ...file, mimetype: check.mimeType },
      { entity_type: 'email_attachment', entity_id: PENDING_ENTITY_ID },
      actor,
    );
  }
}
