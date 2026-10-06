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
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { PermissionScope as Scope } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { PermissionScope } from '../auth/decorators/permission-scope.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { FindTimeEntriesQueryDto } from './dto/find-time-entries-query.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { TimeEntriesService } from './time-entries.service';

/**
 * The hours actually logged. `scope = 'own'` (the `worker` default) can only
 * see and log their own; deleting is manager / admin only.
 */
@ApiTags('Time entries')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  @Post()
  @TenantAuth()
  @Module('time_entries')
  create(
    @Body() dto: CreateTimeEntryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.timeEntriesService.create(dto, actor, scope);
  }

  @Get()
  @TenantAuth()
  @Module('time_entries')
  findAll(
    @Query() query: FindTimeEntriesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.timeEntriesService.findAll(query, actor, scope);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('time_entries')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTimeEntryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.timeEntriesService.update(id, dto, actor, scope);
  }

  /** Manager / admin only. */
  @Delete(':id')
  @TenantAuth()
  @Module('time_entries')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.timeEntriesService.remove(id, actor, scope);
  }
}
