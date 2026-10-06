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
import { CreateSubcontractorDto } from './dto/create-subcontractor.dto';
import { FindContractsQueryDto } from './dto/find-contracts-query.dto';
import { FindSubcontractorsQueryDto } from './dto/find-subcontractors-query.dto';
import { UpdateSubcontractorDto } from './dto/update-subcontractor.dto';
import { SubcontractorsService } from './subcontractors.service';

/** The subcontractor directory. Internal — never shown to the client. */
@ApiTags('Subcontractors')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('subcontractors')
export class SubcontractorsController {
  constructor(private readonly subcontractorsService: SubcontractorsService) {}

  @Post()
  @TenantAuth()
  @Module('subcontractors')
  create(
    @Body() dto: CreateSubcontractorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subcontractorsService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('subcontractors')
  findAll(@Query() query: FindSubcontractorsQueryDto) {
    return this.subcontractorsService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('subcontractors')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.subcontractorsService.findOne(id);
  }

  /** History across projects. */
  @Get(':id/contracts')
  @TenantAuth()
  @Module('subcontractors')
  findContracts(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindContractsQueryDto,
  ) {
    return this.subcontractorsService.findContractsOfSubcontractor(id, query);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('subcontractors')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubcontractorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subcontractorsService.update(id, dto, actor);
  }

  /** Sets `is_active = false`. */
  @Delete(':id')
  @TenantAuth()
  @Module('subcontractors')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subcontractorsService.archive(id, actor);
  }
}
