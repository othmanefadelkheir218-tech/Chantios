import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import {
  ApiFindImport,
  ApiFindImports,
  ApiImportMaterials,
  ApiImportStock,
} from './decorators/imports.swagger';
import { CreateMaterialsImportDto } from './dto/create-materials-import.dto';
import { CreateStockImportDto } from './dto/create-stock-import.dto';
import { FindImportsQueryDto } from './dto/find-imports-query.dto';
import { ImportsService } from './imports.service';

@ApiTags('Imports')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('materials')
  @HttpCode(HttpStatus.ACCEPTED)
  @TenantAuth()
  @Module('stock')
  @ApiImportMaterials()
  importMaterials(
    @Body() dto: CreateMaterialsImportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.importsService.importMaterials(dto, actor);
  }

  @Post('stock')
  @HttpCode(HttpStatus.ACCEPTED)
  @TenantAuth()
  @Module('stock')
  @ApiImportStock()
  importStock(
    @Body() dto: CreateStockImportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.importsService.importStock(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('stock')
  @ApiFindImports()
  findAll(@Query() query: FindImportsQueryDto) {
    return this.importsService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('stock')
  @ApiFindImport()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.importsService.findOne(id);
  }
}
