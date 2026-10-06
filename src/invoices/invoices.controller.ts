import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { Module } from '../auth/decorators/module.decorator';
import { TenantAuth } from '../auth/decorators/tenant-auth.decorator';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FindInvoicesQueryDto } from './dto/find-invoices-query.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { SetInvoiceLinesDto } from './dto/set-invoice-lines.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@UseInterceptors(SnakeCaseInterceptor)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @TenantAuth()
  @Module('invoices')
  create(
    @Body() dto: CreateInvoiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invoicesService.create(dto, actor);
  }

  @Get()
  @TenantAuth()
  @Module('invoices')
  findAll(@Query() query: FindInvoicesQueryDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @TenantAuth()
  @Module('invoices')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @TenantAuth()
  @Module('invoices')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invoicesService.update(id, dto, actor);
  }

  @Put(':id/lines')
  @TenantAuth()
  @Module('invoices')
  setLines(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetInvoiceLinesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invoicesService.replaceLines(id, dto, actor);
  }

  @Post(':id/send')
  @TenantAuth()
  @Module('invoices')
  send(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invoicesService.send(id, actor);
  }

  @Post(':id/cancel')
  @TenantAuth()
  @Module('invoices')
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invoicesService.cancel(id, actor);
  }

  @Post(':id/payments')
  @TenantAuth()
  @Module('invoices')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RecordPaymentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invoicesService.recordPaymentFor(id, dto, actor);
  }

  @Get(':id/payments')
  @TenantAuth()
  @Module('invoices')
  findPayments(@Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.payments(id);
  }

  @Post(':id/reminder')
  @TenantAuth()
  @Module('invoices')
  sendReminder(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.invoicesService.sendReminderFor(id, actor);
  }
}
