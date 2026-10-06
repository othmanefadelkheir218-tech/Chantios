import {
  Body,
  Controller,
  Get,
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
import { TimeEntriesService } from './time-entries.service';

/**
 * The worker logs from site. Convenience wrappers over the same handlers,
 * behind the same guards as the desktop routes (module key `time_entries`).
 */
@ApiTags('Time entries')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('mobile')
export class MobileTimeEntriesController {
  constructor(private readonly timeEntriesService: TimeEntriesService) {}

  /** Own entries only — whatever the caller's role. */
  @Get('my-entries')
  @TenantAuth()
  @Module('time_entries')
  myEntries(
    @Query() query: FindTimeEntriesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.timeEntriesService.findMine(query, actor, scope);
  }

  @Post('time-entries')
  @TenantAuth()
  @Module('time_entries')
  create(
    @Body() dto: CreateTimeEntryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.timeEntriesService.create(dto, actor, scope);
  }
}
