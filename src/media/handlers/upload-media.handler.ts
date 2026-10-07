import { BadRequestException, Injectable } from '@nestjs/common';
import { toFile } from '@imagekit/nodejs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { imagekit } from '../../config/imagekit.config';
import { UploadMediaDto } from '../dto/upload-media.dto';
import {
  ALLOWED_MIME_TYPES,
  buildMediaFolder,
  isMimeAllowed,
  MAX_FILE_SIZE_BYTES,
  toMediaEntity,
} from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * `POST /api/media` — size and MIME are validated **before** ImageKit is
 * ever called (doc/notes/media-files.md). A row is written only once the
 * upload actually succeeded.
 */
@Injectable()
export class UploadMediaHandler {
  constructor(
    @InjectPinoLogger(UploadMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * `isLocked` is never a DTO field — a client can never set it through
   * `POST /api/media`. It exists only for internal callers: step 15's
   * `freeze-quote-pdf.handler`/`freeze-invoice-pdf.handler` pass `true` when
   * they freeze a sent quote/invoice's PDF (doc/notes/media-files.md,
   * `is_locked` = the frozen copy of a sent quote/invoice).
   */
  async execute(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    actor: AuthenticatedUser,
    isLocked = false,
  ) {
    if (!file) {
      throw new BadRequestException('No file was sent');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        `File too large: max ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`,
      );
    }
    if (!isMimeAllowed(dto.entity_type, file.mimetype)) {
      throw new BadRequestException(
        `${file.mimetype} is not allowed for ${dto.entity_type} — allowed: ${ALLOWED_MIME_TYPES[dto.entity_type].join(', ')}`,
      );
    }

    this.logger.info(`Uploading media for ${dto.entity_type}:${dto.entity_id}`);

    const uploaded = await imagekit.files.upload({
      file: await toFile(file.buffer, file.originalname, {
        type: file.mimetype,
      }),
      fileName: file.originalname,
      folder: buildMediaFolder(actor.tenantId, dto.entity_type, dto.entity_id),
    });
    if (!uploaded.fileId || !uploaded.url) {
      throw new BadRequestException('ImageKit upload did not return a file');
    }

    const created = await this.media.create({
      tenantId: actor.tenantId,
      entityType: dto.entity_type,
      entityId: dto.entity_id,
      fileName: file.originalname,
      fileId: uploaded.fileId,
      fileUrl: uploaded.url,
      fileType: file.mimetype,
      fileSize: BigInt(file.size),
      uploadedBy: actor.userId,
      isLocked,
    });
    const entity = toMediaEntity(created);

    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'upload',
      entityType: 'media',
      entityId: created.id,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`Media uploaded: id ${created.id}`);
    return entity;
  }
}
