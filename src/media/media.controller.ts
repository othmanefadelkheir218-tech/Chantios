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
import type { PermissionScope as Scope } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { PermissionScope } from '../auth/decorators/permission-scope.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiFindMedia,
  ApiFindOneMedia,
  ApiHardDeleteMedia,
  ApiRenameMedia,
  ApiReplaceTenantLogo,
  ApiRestoreMedia,
  ApiSoftDeleteMedia,
  ApiStorageUsage,
  ApiUploadMedia,
} from './decorators/media.swagger';
import { BulkMediaIdsDto } from './dto/bulk-media-ids.dto';
import { FindMediaQueryDto } from './dto/find-media-query.dto';
import { RenameMediaDto } from './dto/rename-media.dto';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MediaService } from './media.service';

@ApiTags('Media')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  @TenantAuth()
  @Module('media')
  @UseInterceptors(FileInterceptor('file'))
  @ApiUploadMedia()
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mediaService.upload(file, dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('media')
  @ApiFindMedia()
  findAll(
    @Query() query: FindMediaQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.mediaService.findAll(query, actor, scope);
  }

  // Must stay registered before `GET :id` — both match one path segment.
  @Get('storage/usage')
  @TenantAuth()
  @Module('settings')
  @ApiStorageUsage()
  storageUsage() {
    return this.mediaService.getStorageUsage();
  }

  @Get(':id')
  @TenantAuth()
  @Module('media')
  @ApiFindOneMedia()
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
    @PermissionScope() scope: Scope,
  ) {
    return this.mediaService.findOne(id, actor, scope);
  }

  // Must stay registered before `PATCH :id` — both match one path segment.
  @Patch('restore')
  @TenantAuth()
  @Module('media')
  @ApiRestoreMedia()
  restore(
    @Body() dto: BulkMediaIdsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mediaService.restore(dto, actor);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('media')
  @ApiRenameMedia()
  rename(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenameMediaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mediaService.rename(id, dto, actor);
  }

  // Must stay registered before `DELETE :id`-shaped routes — `permanent` is
  // a literal segment, not a bulk route needs none today but keep the order
  // defensive in case a single-id delete is ever added.
  @Delete('permanent')
  @TenantAuth()
  @Module('media')
  @ApiHardDeleteMedia()
  hardDelete(
    @Body() dto: BulkMediaIdsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mediaService.hardDelete(dto, actor);
  }

  @Delete()
  @TenantAuth()
  @Module('media')
  @ApiSoftDeleteMedia()
  softDelete(
    @Body() dto: BulkMediaIdsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mediaService.softDelete(dto, actor);
  }

  /**
   * Lives here, not on `tenants`, so `TenantsModule` never needs to import
   * `MediaModule` — only `MediaModule -> TenantsModule` exists (for
   * `tenants.logo_media_id`), avoiding a circular module dependency.
   * `entity_id` is `actor.tenantId` from the JWT, never a route param.
   */
  @Post('tenant-logo')
  @TenantAuth()
  @Module('settings')
  @UseInterceptors(FileInterceptor('file'))
  @ApiReplaceTenantLogo()
  replaceTenantLogo(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mediaService.replaceMedia(
      'tenant',
      actor.tenantId,
      file,
      actor,
    );
  }
}
