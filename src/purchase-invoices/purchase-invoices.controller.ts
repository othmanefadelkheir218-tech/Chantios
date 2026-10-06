import {
  Body,
  Controller,
  Get,
  HttpCode,
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
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import { DueSoonQueryDto } from './dto/due-soon-query.dto';
import { FindPurchaseInvoicesQueryDto } from './dto/find-purchase-invoices-query.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
import { UpdatePurchaseInvoiceDto } from './dto/update-purchase-invoice.dto';
import { PurchaseInvoicesService } from './purchase-invoices.service';

/**
 * Every bill received, both kinds. Internal only — never shown in the client
 * portal. The received PDF is attached through `POST /api/media` with
 * `entity_type = 'purchase_invoice'` (there is no `document_url` column).
 */
@ApiTags('Purchase invoices')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('purchase-invoices')
export class PurchaseInvoicesController {
  constructor(
    private readonly purchaseInvoicesService: PurchaseInvoicesService,
  ) {}

  @Post()
  @TenantAuth()
  @Module('purchase_invoices')
  create(
    @Body() dto: CreatePurchaseInvoiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.purchaseInvoicesService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('purchase_invoices')
  findAll(@Query() query: FindPurchaseInvoicesQueryDto) {
    return this.purchaseInvoicesService.findAll(query);
  }

  /** Declared before `:id` so `due-soon` is never read as an id. */
  @Get('due-soon')
  @TenantAuth()
  @Module('purchase_invoices')
  dueSoon(@Query() query: DueSoonQueryDto) {
    return this.purchaseInvoicesService.dueSoon(query.days);
  }

  @Get(':id')
  @TenantAuth()
  @Module('purchase_invoices')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseInvoicesService.findOne(id);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('purchase_invoices')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseInvoiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.purchaseInvoicesService.update(id, dto, actor);
  }

  @Post(':id/paid')
  @HttpCode(200)
  @TenantAuth()
  @Module('purchase_invoices')
  markPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkPaidDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.purchaseInvoicesService.markPaid(id, dto, actor);
  }
}
