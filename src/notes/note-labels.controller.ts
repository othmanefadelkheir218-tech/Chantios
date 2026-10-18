import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { NotesAuth } from './decorators/notes-auth.decorator';
import {
  ApiCreateNoteLabel,
  ApiDeleteNoteLabel,
  ApiFindNoteLabels,
  ApiRenameNoteLabel,
} from './decorators/notes.swagger';
import { NoteLabelDto } from './dto/note-label.dto';
import { NotesService } from './notes.service';

/** The caller's own note labels (doc/notes/notes.md). Same permission as notes. */
@ApiTags('Notes')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('note-labels')
export class NoteLabelsController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @NotesAuth()
  @ApiFindNoteLabels()
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.notesService.findLabels(actor);
  }

  @Post()
  @NotesAuth()
  @ApiCreateNoteLabel()
  create(@Body() dto: NoteLabelDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.notesService.createLabel(dto, actor);
  }

  @Patch(':id')
  @NotesAuth()
  @ApiRenameNoteLabel()
  rename(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NoteLabelDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.renameLabel(id, dto, actor);
  }

  @Delete(':id')
  @NotesAuth()
  @ApiDeleteNoteLabel()
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.deleteLabel(id, actor);
  }
}
