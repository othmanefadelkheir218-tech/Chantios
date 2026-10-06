import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { FindMovementsQueryDto } from './dto/find-movements-query.dto';
import { FindReservationsQueryDto } from './dto/find-reservations-query.dto';
import { StockService } from './stock.service';

/**
 * No `POST /api/stock/consumption` route on purpose — consumption is
 * declared from the site report (step 09), never directly. No reservation
 * route either — `create-reservations` is only ever called from step 06's
 * quote acceptance, through `StockService`.
 */
@ApiTags('Stock')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post('purchase')
  @TenantAuth()
  @Module('stock')
  purchase(
    @Body() dto: CreateMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.stockService.purchase(dto, actor);
  }

  @Post('adjustment')
  @TenantAuth()
  @Roles('admin', 'manager')
  adjustment(
    @Body() dto: AdjustStockDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.stockService.adjust(dto, actor);
  }

  @Get('movements')
  @TenantAuth()
  @Module('stock')
  movements(@Query() query: FindMovementsQueryDto) {
    return this.stockService.findAllMovements(query);
  }

  @Get('reservations')
  @TenantAuth()
  @Module('stock')
  reservations(@Query() query: FindReservationsQueryDto) {
    return this.stockService.findAllReservations(query);
  }
}
