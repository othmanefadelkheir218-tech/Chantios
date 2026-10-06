import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateMaterialDto } from './dto/create-material.dto';
import { FindMaterialsQueryDto } from './dto/find-materials-query.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { ArchiveMaterialHandler } from './handlers/archive-material.handler';
import { CreateMaterialHandler } from './handlers/create-material.handler';
import { FindLowStockHandler } from './handlers/find-low-stock.handler';
import { FindMaterialHandler } from './handlers/find-material.handler';
import { FindMaterialsHandler } from './handlers/find-materials.handler';
import { StockLevelHandler } from './handlers/stock-level.handler';
import { UpdateMaterialHandler } from './handlers/update-material.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class MaterialsService {
  constructor(
    private readonly createMaterial: CreateMaterialHandler,
    private readonly findMaterials: FindMaterialsHandler,
    private readonly findMaterial: FindMaterialHandler,
    private readonly updateMaterial: UpdateMaterialHandler,
    private readonly archiveMaterial: ArchiveMaterialHandler,
    private readonly stockLevel: StockLevelHandler,
    private readonly findLowStock: FindLowStockHandler,
  ) {}

  create(dto: CreateMaterialDto, actor: AuthenticatedUser) {
    return this.createMaterial.execute(dto, actor);
  }

  findAll(query: FindMaterialsQueryDto) {
    return this.findMaterials.execute(query);
  }

  findOne(id: number) {
    return this.stockLevel.execute(id);
  }

  update(id: number, dto: UpdateMaterialDto, actor: AuthenticatedUser) {
    return this.updateMaterial.execute(id, dto, actor);
  }

  archive(id: number, actor: AuthenticatedUser) {
    return this.archiveMaterial.execute(id, actor);
  }

  lowStock() {
    return this.findLowStock.execute();
  }

  // ---- Internal API for other modules (`services`, `stock`) ----

  /** Raw Prisma row — `services` (recipe) and `stock` (movements) validate against this. */
  findByIdRaw(id: number) {
    return this.findMaterial.findByIdRaw(id);
  }

  /** `on_hand` / `reserved` / `available` for one material — `stock`'s `check-coverage.handler`. */
  getStockLevel(materialId: number) {
    return this.stockLevel.rawLevel(materialId);
  }
}
