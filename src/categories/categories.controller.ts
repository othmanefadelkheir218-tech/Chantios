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
import { Module } from '../auth/decorators/module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @TenantAuth()
  @Module('catalogue')
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.categoriesService.findAll(actor.tenantId);
  }

  /** Admin only — carries the caller's own `tenant_id`, never `NULL`. */
  @Post()
  @TenantAuth()
  @Roles('admin')
  create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.categoriesService.create(dto, actor);
  }

  /** Admin only, own rows only — never a `NULL`-tenant shared default. */
  @Patch(':id')
  @TenantAuth()
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.categoriesService.update(id, dto, actor);
  }

  /** Admin only, own rows only. Sets `is_active = false`. */
  @Delete(':id')
  @TenantAuth()
  @Roles('admin')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.categoriesService.archive(id, actor);
  }
}
