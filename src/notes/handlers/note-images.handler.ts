import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { MediaService } from '../../media/media.service';
import { NoteAccessHandler } from './note-access.handler';

/**
 * `POST /api/notes/:id/images` and `DELETE /api/notes/:id/images/:mediaId`.
 * The images are `media` rows (`entity_type = 'note'`): the media module
 * keeps its size and type rule, and they count in the plan storage.
 */
@Injectable()
export class NoteImagesHandler {
  constructor(
    @InjectPinoLogger(NoteImagesHandler.name)
    private readonly logger: PinoLogger,
    private readonly access: NoteAccessHandler,
    private readonly media: MediaService,
  ) {}

  async add(id: number, file: Express.Multer.File, actor: AuthenticatedUser) {
    await this.access.findOwnEditable(id, actor.userId);
    this.logger.info(`Adding an image to note ${id}`);
    const image = await this.media.upload(
      file,
      { entity_type: 'note', entity_id: id },
      actor,
    );
    return { id: image.id, fileUrl: image.fileUrl, fileName: image.fileName };
  }

  async remove(id: number, mediaId: number, actor: AuthenticatedUser) {
    await this.access.findOwnEditable(id, actor.userId);
    const { deleted } = await this.media.deleteForEntity(
      'note',
      id,
      [mediaId],
      actor,
    );
    if (deleted.length === 0) {
      this.logger.warn(`Image ${mediaId} not removed from note ${id}`);
      throw new NotFoundException('Image not found');
    }
    this.logger.info(`Image ${mediaId} removed from note ${id}`);
    return { deleted: [mediaId] };
  }
}
