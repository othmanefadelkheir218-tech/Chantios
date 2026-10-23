import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import { MediaEntityType } from '@prisma/client';
import { UploadMediaDto } from '../dto/upload-media.dto';
import {
  ALLOWED_MIME_TYPES,
  buildMediaFolder,
  isMimeAllowed,
  maxFileSize,
  MediaUploader,
  toMediaEntity,
} from '../helpers/media.helper';
import {
  discardUploadedFile,
  uploadToImageKit,
} from '../helpers/imagekit-upload.helper';
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
    actor: MediaUploader,
    isLocked = false,
  ) {
    this.assertUploadable(file, dto.entity_type);

    this.logger.info(`Uploading media for ${dto.entity_type}:${dto.entity_id}`);

    const uploaded = await uploadToImageKit(
      file,
      buildMediaFolder(actor.tenantId, dto.entity_type, dto.entity_id),
      this.logger,
    );

    let created;
    try {
      created = await this.media.create({
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
    } catch (err: unknown) {
      await discardUploadedFile(uploaded.fileId, this.logger);
      throw err;
    }
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

  /**
   * A file that is already in memory, with no HTTP upload behind it — an
   * attachment of an inbound email (step 25). Same checks, same row, same audit.
   */
  executeBuffer(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    dto: UploadMediaDto,
    actor: MediaUploader,
  ) {
    const file = {
      buffer,
      originalname: filename,
      mimetype: mimeType,
      size: buffer.length,
    } as Express.Multer.File;
    return this.execute(file, dto, actor);
  }

  /**
   * The size and type rule, alone — a caller that uploads several files at
   * once (the portal chat) checks them all BEFORE the first one goes to
   * ImageKit, so a bad third file leaves no first file behind.
   */
  assertUploadable(file: Express.Multer.File, entityType: MediaEntityType) {
    if (!file) {
      throw new BadRequestException('No file was sent');
    }
    const maxBytes = maxFileSize(entityType);
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `File too large: max ${maxBytes / (1024 * 1024)} MB`,
      );
    }
    if (!isMimeAllowed(entityType, file.mimetype)) {
      throw new BadRequestException(
        `${file.mimetype} is not allowed for ${entityType} — allowed: ${ALLOWED_MIME_TYPES[entityType].join(', ')}`,
      );
    }
  }
}
