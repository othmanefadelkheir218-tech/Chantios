import { BadRequestException, Injectable } from '@nestjs/common';
import { toFile } from '@imagekit/nodejs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { imagekit } from '../../config/imagekit.config';
import { UploadMediaDto } from '../dto/upload-media.dto';
import {
  ALLOWED_MIME_TYPES,
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

  async execute(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    actor: AuthenticatedUser,
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
