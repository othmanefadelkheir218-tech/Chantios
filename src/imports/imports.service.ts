import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateMaterialsImportDto } from './dto/create-materials-import.dto';
import { CreateStockImportDto } from './dto/create-stock-import.dto';
import { FindImportsQueryDto } from './dto/find-imports-query.dto';
import { CreateImportHandler } from './handlers/create-import.handler';
import { FindImportsHandler } from './handlers/find-imports.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class ImportsService {
  constructor(
    private readonly createImport: CreateImportHandler,
    private readonly findImports: FindImportsHandler,
  ) {}

  importMaterials(dto: CreateMaterialsImportDto, actor: AuthenticatedUser) {
    return this.createImport.materials(dto, actor);
  }

  importStock(dto: CreateStockImportDto, actor: AuthenticatedUser) {
    return this.createImport.stock(dto, actor);
  }

  findAll(query: FindImportsQueryDto) {
    return this.findImports.findAll(query);
  }

  findOne(id: number) {
    return this.findImports.findOne(id);
  }
}
