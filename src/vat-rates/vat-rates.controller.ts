import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminBillingAccessGuard } from '../admin-users/guards/admin-billing-access.guard';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { SnakeCaseInterceptor } from '../common/interceptors/snake-case.interceptor';
import {
  ApiCreateVatRate,
  ApiFindVatRates,
  ApiUpdateVatRate,
} from './decorators/vat-rates.swagger';
import { CreateVatRateDto } from './dto/create-vat-rate.dto';
import { UpdateVatRateDto } from './dto/update-vat-rate.dto';
import { VatRatesAdminService } from './vat-rates-admin.service';
import { VatRatesService } from './vat-rates.service';

@ApiTags('TVA rates (subscription)')
@UseGuards(AdminAuthGuard)
@UseInterceptors(SnakeCaseInterceptor)
@Controller('admin/vat-rates')
export class VatRatesController {
  constructor(
    private readonly vatRatesService: VatRatesService,
    private readonly vatRatesAdminService: VatRatesAdminService,
  ) {}

  @Get()
  @ApiFindVatRates()
  findAll() {
    return this.vatRatesService.findAll();
  }

  @Post()
  @UseGuards(AdminBillingAccessGuard)
  @AuditLog('create', 'vat_rate')
  @ApiCreateVatRate()
  create(@Body() dto: CreateVatRateDto) {
    return this.vatRatesAdminService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminBillingAccessGuard)
  @AuditLog('update', 'vat_rate')
  @ApiUpdateVatRate()
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVatRateDto) {
    return this.vatRatesAdminService.update(id, dto);
  }
}
