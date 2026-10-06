import { BadRequestException, Injectable } from '@nestjs/common';
import { toFile } from '@imagekit/nodejs';
import { MediaEntityType } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { imagekit } from '../../config/imagekit.config';
import { TenantsService } from '../../tenants/tenants.service';
import {
  ALLOWED_MIME_TYPES,
  buildMediaFolder,
  isMimeAllowed,
  MAX_FILE_SIZE_BYTES,
  toMediaEntity,
} from '../helpers/media.helper';
import { MediaRepository } from '../repositories/media.repository';

/**
 * Single-image entities (`user` avatar, `tenant` logo): uploads the new file
 * first — never leave the entity with no image if the upload fails — then
 * hard-deletes the old one (no trash, no undo value in an old avatar/logo).
 * For `entity_type = 'tenant'` also updates `tenants.logo_media_id`, through
 * `TenantsService` (never its repository directly — architecture rule).
 */
@Injectable()
export class ReplaceMediaHandler {
  constructor(
    @InjectPinoLogger(ReplaceMediaHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
    private readonly audit: AuditService,
    private readonly tenants: TenantsService,
  ) {}

  async execute(
    entityType: Extract<MediaEntityType, 'user' | 'tenant'>,
    entityId: number,
    file: Express.Multer.File,
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
    if (!isMimeAllowed(entityType, file.mimetype)) {
      throw new BadRequestException(
        `${file.mimetype} is not allowed for ${entityType} — allowed: ${ALLOWED_MIME_TYPES[entityType].join(', ')}`,
      );
    }

    this.logger.info(`Replacing ${entityType} media for id ${entityId}`);
    const old = await this.media.findByEntityAndType(entityType, entityId);

    const uploaded = await imagekit.files.upload({
      file: await toFile(file.buffer, file.originalname, {
        type: file.mimetype,
      }),
      fileName: file.originalname,
      folder: buildMediaFolder(actor.tenantId, entityType, entityId),
    });
    if (!uploaded.fileId || !uploaded.url) {
      throw new BadRequestException('ImageKit upload did not return a file');
    }

    const created = await this.media.create({
      tenantId: actor.tenantId,
      entityType,
      entityId,
      fileName: file.originalname,
      fileId: uploaded.fileId,
      fileUrl: uploaded.url,
      fileType: file.mimetype,
      fileSize: BigInt(file.size),
      uploadedBy: actor.userId,
    });

    if (entityType === 'tenant') {
      await this.tenants.setLogoMediaId(entityId, created.id);
    }

    if (old) {
      try {
        await imagekit.files.delete(old.fileId);
        await this.media.hardDelete([old.id]);
      } catch (err: unknown) {
        this.logger.error(
          { err, mediaId: old.id },
          `Failed to delete the old ImageKit file ${old.fileId} while replacing ${entityType}:${entityId} — row kept`,
        );
      }
    }

    const entity = toMediaEntity(created);
    await this.audit.write({
      tenantId: actor.tenantId,
      userId: actor.userId,
      action: 'replace',
      entityType: 'media',
      entityId: created.id,
      oldValue: old ? toMediaEntity(old) : null,
      newValue: entity,
      ipAddress: null,
    });
    this.logger.info(`${entityType} media replaced: new id ${created.id}`);
    return entity;
  }
}
