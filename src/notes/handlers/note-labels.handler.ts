import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/decorators/current-user.decorator';
import { isUniqueViolation } from '../../common/helpers/unique-violation.helper';
import { NoteLabelDto } from '../dto/note-label.dto';
import { noteAudit, toNoteLabelEntity } from '../helpers/note.helper';
import { NoteRepository } from '../repositories/note.repository';

/**
 * `/api/note-labels` — a user's own labels. A name is unique per user, case
 * and spaces ignored (`uq_note_labels_user_name`). Deleting a label keeps
 * its notes.
 */
@Injectable()
export class NoteLabelsHandler {
  constructor(
    @InjectPinoLogger(NoteLabelsHandler.name)
    private readonly logger: PinoLogger,
    private readonly notes: NoteRepository,
    private readonly audit: AuditService,
  ) {}

  async findAll(actor: AuthenticatedUser) {
    const labels = await this.notes.findLabels(actor.userId);
    return labels.map(toNoteLabelEntity);
  }

  async create(dto: NoteLabelDto, actor: AuthenticatedUser) {
    this.logger.info(`Creating a note label for user ${actor.userId}`);
    try {
      const label = await this.notes.createLabel({
        tenantId: actor.tenantId,
        userId: actor.userId,
        name: dto.name,
      });
      await this.audit.write(
        noteAudit(actor, 'create', label.id, 'note_label'),
      );
      return toNoteLabelEntity(label);
    } catch (err: unknown) {
      throw this.toConflict(err);
    }
  }

  async rename(id: number, dto: NoteLabelDto, actor: AuthenticatedUser) {
    await this.findOwn(id, actor);
    this.logger.info(`Renaming note label ${id}`);
    try {
      const label = await this.notes.renameLabel(id, dto.name);
      await this.audit.write(noteAudit(actor, 'update', id, 'note_label'));
      return toNoteLabelEntity(label);
    } catch (err: unknown) {
      throw this.toConflict(err);
    }
  }

  async remove(id: number, actor: AuthenticatedUser) {
    await this.findOwn(id, actor);
    await this.notes.deleteLabel(id);
    await this.audit.write(noteAudit(actor, 'delete', id, 'note_label'));
    this.logger.info(`Note label ${id} deleted`);
    return { deleted: [id] };
  }

  private async findOwn(id: number, actor: AuthenticatedUser) {
    const label = await this.notes.findOwnLabel(id, actor.userId);
    if (!label) {
      this.logger.warn(`Note label ${id} not found for user ${actor.userId}`);
      throw new NotFoundException('Label not found');
    }
    return label;
  }

  private toConflict(err: unknown): unknown {
    if (!isUniqueViolation(err)) return err;
    this.logger.warn('Note label name already used');
    return new ConflictException('You already have a label with this name');
  }
}
