import {
  Body,
  Controller,
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
import { CreateContractDto } from './dto/create-contract.dto';
import { FindContractsQueryDto } from './dto/find-contracts-query.dto';
import { SetContractStatusDto } from './dto/set-contract-status.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SubcontractorsService } from './subcontractors.service';

/**
 * One engagement per project. A second small controller inside
 * `SubcontractorsModule` (the directory and its contracts are one domain),
 * same pattern as `client-projects.controller.ts`.
 */
@ApiTags('Contracts')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly subcontractorsService: SubcontractorsService) {}

  @Post()
  @TenantAuth()
  @Module('subcontractors')
  create(
    @Body() dto: CreateContractDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subcontractorsService.createNewContract(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('subcontractors')
  findAll(@Query() query: FindContractsQueryDto) {
    return this.subcontractorsService.findAllContracts(query);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('subcontractors')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subcontractorsService.updateExistingContract(id, dto, actor);
  }

  @Patch(':id/status')
  @TenantAuth()
  @Module('subcontractors')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetContractStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.subcontractorsService.changeContractStatus(id, dto, actor);
  }
}
