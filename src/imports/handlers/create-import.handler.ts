import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ImportBatch, ImportType } from '@prisma/client';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import {
  RoleName,
  resolvePermission,
} from '../../auth/helpers/permission.helper';
import { isUniqueViolation } from '../../common/helpers/unique-violation.helper';
import { RolesService } from '../../roles/roles.service';
import { CreateMaterialsImportDto } from '../dto/create-materials-import.dto';
import { CreateStockImportDto } from '../dto/create-stock-import.dto';
import { IMPORTS_QUEUE, ImportJobData } from '../dto/import-job.dto';
import { toImportBatchEntity } from '../helpers/import-batch.helper';
import { hashImportRows } from '../helpers/import-hash.helper';
import { ImportBatchRepository } from '../repositories/import-batch.repository';

/** The roles that may write an `adjustment` — same as `POST /api/stock/adjustment`. */
const ADJUSTMENT_ROLES: readonly RoleName[] = ['admin', 'manager'];

/**
 * `POST /api/imports/materials` and `POST /api/imports/stock`
 * (doc/notes/bulk-import.md). Saves the batch as `pending`, queues the job
 * and answers at once — the user does not wait for the rows to be written.
 *
 * Checked here, before anything is saved:
 * - the rights the file needs (the route guard only checked `stock` create):
 *   a row with an `id` in a materials file updates → `stock` edit; a
 *   `stock_depart` or an `adjustment` row → admin / manager, like the
 *   single adjustment route;
 * - the same rows already in a batch that did not fail → `409`.
 */
@Injectable()
export class CreateImportHandler {
  constructor(
    @InjectPinoLogger(CreateImportHandler.name)
    private readonly logger: PinoLogger,
    @InjectQueue(IMPORTS_QUEUE) private readonly queue: Queue<ImportJobData>,
    private readonly batches: ImportBatchRepository,
    private readonly roles: RolesService,
  ) {}

  async materials(dto: CreateMaterialsImportDto, actor: AuthenticatedUser) {
    await this.assertRights(actor, {
      edit: dto.rows.some((row) => row.id !== undefined),
      adjust: dto.rows.some((row) => row.stock_depart !== undefined),
    });
    return this.create('materials', dto.file_name, dto.rows, actor);
  }

  async stock(dto: CreateStockImportDto, actor: AuthenticatedUser) {
    await this.assertRights(actor, {
      edit: false,
      adjust: dto.rows.some((row) => row.type === 'adjustment'),
    });
    return this.create('stock', dto.file_name, dto.rows, actor);
  }

  private async assertRights(
    actor: AuthenticatedUser,
    needs: { edit: boolean; adjust: boolean },
  ): Promise<void> {
    if (!needs.edit && !needs.adjust) return;
    const role = await this.roles.findRoleById(actor.roleId);
    const roleName = role?.name as RoleName | undefined;
    if (!roleName) throw new ForbiddenException('Unknown role');

    if (needs.adjust && !ADJUSTMENT_ROLES.includes(roleName)) {
      this.logger.warn(`Import refused: ${roleName} may not adjust stock`);
      throw new ForbiddenException(
        'Only an admin or a manager may import starting stock or adjustments',
      );
    }
    if (needs.edit) {
      const overrides = await this.roles.findOverridesForRole(actor.roleId);
      if (!resolvePermission(roleName, 'stock', overrides).canEdit) {
        this.logger.warn(`Import refused: ${roleName} may not edit materials`);
        throw new ForbiddenException('No canEdit access to stock');
      }
    }
  }

  private async create(
    type: ImportType,
    fileName: string,
    rows: object[],
    actor: AuthenticatedUser,
  ) {
    this.logger.info(`Import ${type} "${fileName}": ${rows.length} rows`);
    const rowsHash = hashImportRows(rows);

    const previous = await this.batches.findActiveByHash(type, rowsHash);
    if (previous) throw this.alreadyImported(previous);

    let batch: ImportBatch;
    try {
      batch = await this.batches.create({
        tenantId: actor.tenantId,
        type,
        fileName,
        rowsHash,
        rowCount: rows.length,
        rows,
        createdBy: actor.userId,
      });
    } catch (err: unknown) {
      // Two uploads of the same file at the same moment: the partial unique
      // index `uq_import_batches_hash` lets only one through.
      if (!isUniqueViolation(err)) throw err;
      const raced = await this.batches.findActiveByHash(type, rowsHash);
      throw raced ? this.alreadyImported(raced) : err;
    }

    try {
      await this.queue.add(
        'run',
        { batchId: batch.id, tenantId: actor.tenantId, userId: actor.userId },
        { attempts: 1, removeOnComplete: true, removeOnFail: 100 },
      );
    } catch (err: unknown) {
      this.logger.error(
        { err },
        `Import batch ${batch.id} could not be queued`,
      );
      batch = await this.batches.update(batch.id, {
        status: 'failed',
        finishedAt: new Date(),
        errors: [
          {
            row: 0,
            field: null,
            message:
              "L'import n'a pas pu démarrer. Rien n'a été importé : réessayez.",
          },
        ],
      });
    }

    this.logger.info(`Import batch ${batch.id} saved (${batch.status})`);
    return toImportBatchEntity(batch);
  }

  private alreadyImported(previous: ImportBatch) {
    this.logger.warn(`Import refused: same rows as batch ${previous.id}`);
    return new ConflictException(
      `This file was already imported (import ${previous.id})`,
    );
  }
}
