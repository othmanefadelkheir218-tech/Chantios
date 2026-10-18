import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { NotesService } from '../notes/notes.service';
import { TenantRunner } from './tenant-runner.service';

/**
 * Daily, per company: every note trashed more than 7 days ago is deleted
 * for good, with its images (doc/notes/notes.md § How a note works).
 */
@Injectable()
export class NotesTrashCron {
  constructor(
    @InjectPinoLogger(NotesTrashCron.name)
    private readonly logger: PinoLogger,
    private readonly runner: TenantRunner,
    private readonly notes: NotesService,
  ) {}

  @Cron('45 3 * * *')
  async run(now: Date = new Date()): Promise<number> {
    let deleted = 0;
    try {
      await this.runner.forEachTenant('notes-trash', async (tenant) => {
        deleted += await this.notes.purgeExpiredTrash(tenant.id, now);
      });
    } catch (err: unknown) {
      this.logger.error({ err }, 'Notes trash cron failed');
    }
    this.logger.info(`Notes trash cron: ${deleted} note(s) deleted for good`);
    return deleted;
  }
}
