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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateMaterialDto } from './dto/create-material.dto';
import { FindMaterialsQueryDto } from './dto/find-materials-query.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { MaterialsService } from './materials.service';

@ApiTags('Materials')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @TenantAuth()
  @Module('stock')
  create(
    @Body() dto: CreateMaterialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.materialsService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('stock')
  findAll(@Query() query: FindMaterialsQueryDto) {
    return this.materialsService.findAll(query);
  }

  // Must stay registered before `GET :id` — both match one path segment.
  @Get('low-stock')
  @TenantAuth()
  @Module('stock')
  lowStock() {
    return this.materialsService.lowStock();
  }

  @Get(':id')
  @TenantAuth()
  @Module('stock')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.findOne(id);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('stock')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.materialsService.update(id, dto, actor);
  }

  @Delete(':id')
  @TenantAuth()
  @Module('stock')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.materialsService.archive(id, actor);
  }
}
