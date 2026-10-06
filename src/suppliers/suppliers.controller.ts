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
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FindSuppliersQueryDto } from './dto/find-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

/** Module key `stock` — suppliers live with the stock permissions (step 07 route table). */
@ApiTags('Suppliers')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @TenantAuth()
  @Module('stock')
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.suppliersService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('stock')
  findAll(@Query() query: FindSuppliersQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('stock')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.suppliersService.update(id, dto, actor);
  }

  /** Sets `is_active = false`. */
  @Delete(':id')
  @TenantAuth()
  @Module('stock')
  archive(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.suppliersService.archive(id, actor);
  }
}
