import { Injectable } from '@nestjs/common';
import { CreateVatRateDto } from './dto/create-vat-rate.dto';
import { UpdateVatRateDto } from './dto/update-vat-rate.dto';
import { CreateVatRateHandler } from './handlers/create-vat-rate.handler';
import { UpdateVatRateHandler } from './handlers/update-vat-rate.handler';

/** Orchestration only, WRITE side: the super-admin's TVA table. Only the admin controller uses it. */
@Injectable()
export class VatRatesAdminService {
  constructor(
    private readonly createVatRate: CreateVatRateHandler,
    private readonly updateVatRate: UpdateVatRateHandler,
  ) {}

  create(dto: CreateVatRateDto) {
    return this.createVatRate.execute(dto);
  }

  update(id: number, dto: UpdateVatRateDto) {
    return this.updateVatRate.execute(id, dto);
  }
}
