import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { MediaRepository } from '../repositories/media.repository';

const BYTES_PER_GB = 1024 * 1024 * 1024;

/**
 * `GET /api/media/storage/usage` — `SUM(file_size)` for this tenant,
 * **including trashed rows** (trash is not free storage). This is the
 * `storage_gb` billing dimension step 14 reads (doc/notes/subscription-plans.md).
 */
@Injectable()
export class StorageUsageHandler {
  constructor(
    @InjectPinoLogger(StorageUsageHandler.name)
    private readonly logger: PinoLogger,
    private readonly media: MediaRepository,
  ) {}

  async execute() {
    const bytes = await this.media.sumFileSize();
    this.logger.debug(`Storage usage: ${bytes} byte(s)`);
    const bytesNumber = Number(bytes);
    return {
      bytes: bytesNumber,
      gb: bytesNumber / BYTES_PER_GB,
    };
  }
}
