import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TokenModule } from '../auth/token.module';
import { MediaModule } from '../media/media.module';
import { RolesModule } from '../roles/roles.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TenantsModule } from '../tenants/tenants.module';
import { CreateNoteHandler } from './handlers/create-note.handler';
import { DeleteNoteHandler } from './handlers/delete-note.handler';
import { FindNotesHandler } from './handlers/find-notes.handler';
import { NoteAccessHandler } from './handlers/note-access.handler';
import { NoteImagesHandler } from './handlers/note-images.handler';
import { NoteLabelsHandler } from './handlers/note-labels.handler';
import { TrashNoteHandler } from './handlers/trash-note.handler';
import { UpdateNoteHandler } from './handlers/update-note.handler';
import { NoteLabelsController } from './note-labels.controller';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { NoteRepository } from './repositories/note.repository';

/** Step 24 — private notes like Google Keep (doc/notes/notes.md). */
@Module({
  imports: [
    AuditModule,
    MediaModule,
    // What `@TenantAuth()`'s guards need — same as every tenant-side module.
    TokenModule,
    RolesModule,
    SubscriptionsModule,
    TenantsModule,
  ],
  controllers: [NotesController, NoteLabelsController],
  providers: [
    NotesService,
    NoteRepository,
    NoteAccessHandler,
    FindNotesHandler,
    CreateNoteHandler,
    UpdateNoteHandler,
    TrashNoteHandler,
    DeleteNoteHandler,
    NoteImagesHandler,
    NoteLabelsHandler,
  ],
  // `crons` calls the daily trash purge through `NotesService`.
  exports: [NotesService],
})
export class NotesModule {}
