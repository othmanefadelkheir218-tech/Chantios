import { Injectable } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { FindSuppliersQueryDto } from './dto/find-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ArchiveSupplierHandler } from './handlers/archive-supplier.handler';
import { CreateSupplierHandler } from './handlers/create-supplier.handler';
import { FindSuppliersHandler } from './handlers/find-suppliers.handler';
import { UpdateSupplierHandler } from './handlers/update-supplier.handler';
import { SupplierRepository } from './repositories/supplier.repository';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliers: SupplierRepository,
    private readonly createSupplier: CreateSupplierHandler,
    private readonly findSuppliers: FindSuppliersHandler,
    private readonly updateSupplier: UpdateSupplierHandler,
    private readonly archiveSupplier: ArchiveSupplierHandler,
  ) {}

  create(dto: CreateSupplierDto, actor: AuthenticatedUser) {
    return this.createSupplier.execute(dto, actor);
  }

  findAll(query: FindSuppliersQueryDto) {
    return this.findSuppliers.execute(query);
  }

  update(id: number, dto: UpdateSupplierDto, actor: AuthenticatedUser) {
    return this.updateSupplier.execute(id, dto, actor);
  }

  archive(id: number, actor: AuthenticatedUser) {
    return this.archiveSupplier.execute(id, actor);
  }

  // ---- Internal API for other modules (`purchase-invoices`) ----

  /** The raw row, scoped to the current tenant, or `null`. */
  findByIdRaw(id: number): Promise<Supplier | null> {
    return this.suppliers.findById(id);
  }
}
