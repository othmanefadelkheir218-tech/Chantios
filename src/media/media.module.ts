import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AttachMediaHandler } from './handlers/attach-media.handler';
import { DeleteMediaByEntityHandler } from './handlers/delete-media-by-entity.handler';
import { FindMediaHandler } from './handlers/find-media.handler';
import { HardDeleteMediaHandler } from './handlers/hard-delete-media.handler';
import { PurgeExpiredMediaHandler } from './handlers/purge-expired-media.handler';
import { RenameMediaHandler } from './handlers/rename-media.handler';
import { ReplaceMediaHandler } from './handlers/replace-media.handler';
import { RestoreMediaHandler } from './handlers/restore-media.handler';
import { SoftDeleteMediaHandler } from './handlers/soft-delete-media.handler';
import { StorageUsageHandler } from './handlers/storage-usage.handler';
import { UploadMediaHandler } from './handlers/upload-media.handler';
import { PurgeExpiredMediaJob } from './jobs/purge-expired-media.job';
import { MediaRepository } from './repositories/media.repository';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [
    AuditModule,
    // These four are what `@TenantAuth()`'s guards need to resolve their own
    // dependencies (TokenHelper, RolesService, SubscriptionsService) — same
    // imports as every other module using that decorator (e.g. `users`).
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    // One-directional only: media -> tenants, for `logo_media_id`. Nothing
    // in `tenants` imports `media` (the tenant-logo route lives on this
    // module's controller — see media.controller.ts).
    TenantsModule,
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
    MediaRepository,
    UploadMediaHandler,
    FindMediaHandler,
    RenameMediaHandler,
    SoftDeleteMediaHandler,
    HardDeleteMediaHandler,
    RestoreMediaHandler,
    ReplaceMediaHandler,
    StorageUsageHandler,
    DeleteMediaByEntityHandler,
    AttachMediaHandler,
    PurgeExpiredMediaHandler,
    PurgeExpiredMediaJob,
  ],
  exports: [MediaService],
})
export class MediaModule {}
