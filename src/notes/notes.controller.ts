import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { NotesAuth } from './decorators/notes-auth.decorator';
import {
  ApiAddNoteImage,
  ApiCreateNote,
  ApiDeleteNote,
  ApiEmptyTrash,
  ApiFindNote,
  ApiFindNotes,
  ApiRemoveNoteImage,
  ApiRestoreNote,
  ApiTrashNote,
  ApiUpdateNote,
} from './decorators/notes.swagger';
import { CreateNoteDto } from './dto/create-note.dto';
import { FindNotesQueryDto } from './dto/find-notes-query.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { NotesService } from './notes.service';

/**
 * Private notes like Google Keep (doc/notes/notes.md). Every route works on
 * the caller's own notes only, whatever the role.
 */
@ApiTags('Notes')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @NotesAuth()
  @ApiFindNotes()
  findAll(
    @Query() query: FindNotesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.findAll(query, actor);
  }

  @Post()
  @NotesAuth()
  @ApiCreateNote()
  create(@Body() dto: CreateNoteDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.notesService.create(dto, actor);
  }

  // Must stay registered before `DELETE :id` — both match one path segment.
  @Delete('trash')
  @NotesAuth()
  @ApiEmptyTrash()
  emptyTrash(@CurrentUser() actor: AuthenticatedUser) {
    return this.notesService.emptyTrash(actor);
  }

  @Get(':id')
  @NotesAuth()
  @ApiFindNote()
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.findOne(id, actor);
  }

  @Patch(':id/restore')
  @NotesAuth()
  @ApiRestoreNote()
  restore(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.restore(id, actor);
  }

  @Patch(':id')
  @NotesAuth()
  @ApiUpdateNote()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.update(id, dto, actor);
  }

  @Delete(':id/permanent')
  @NotesAuth()
  @ApiDeleteNote()
  deletePermanently(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.deletePermanently(id, actor);
  }

  @Delete(':id')
  @NotesAuth()
  @ApiTrashNote()
  trash(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.trash(id, actor);
  }

  @Post(':id/images')
  @NotesAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiAddNoteImage()
  addImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.addImage(id, file, actor);
  }

  @Delete(':id/images/:mediaId')
  @NotesAuth()
  @ApiRemoveNoteImage()
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notesService.removeImage(id, mediaId, actor);
  }
}
