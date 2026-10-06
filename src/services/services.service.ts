import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { FindServicesQueryDto } from './dto/find-services-query.dto';
import { SetRecipeDto } from './dto/set-recipe.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ArchiveServiceHandler } from './handlers/archive-service.handler';
import { CreateServiceHandler } from './handlers/create-service.handler';
import { FindServiceHandler } from './handlers/find-service.handler';
import { FindServicesHandler } from './handlers/find-services.handler';
import { GetRecipeHandler } from './handlers/get-recipe.handler';
import { SetRecipeHandler } from './handlers/set-recipe.handler';
import { UpdateServiceHandler } from './handlers/update-service.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class ServicesService {
  constructor(
    private readonly createService: CreateServiceHandler,
    private readonly findServices: FindServicesHandler,
    private readonly findService: FindServiceHandler,
    private readonly updateService: UpdateServiceHandler,
    private readonly archiveService: ArchiveServiceHandler,
    private readonly setRecipe: SetRecipeHandler,
    private readonly getRecipe: GetRecipeHandler,
  ) {}

  create(dto: CreateServiceDto, actor: AuthenticatedUser) {
    return this.createService.execute(dto, actor);
  }

  findAll(query: FindServicesQueryDto) {
    return this.findServices.execute(query);
  }

  findOne(id: number) {
    return this.findService.execute(id);
  }

  update(id: number, dto: UpdateServiceDto, actor: AuthenticatedUser) {
    return this.updateService.execute(id, dto, actor);
  }

  archive(id: number, actor: AuthenticatedUser) {
    return this.archiveService.execute(id, actor);
  }

  recipe(id: number) {
    return this.getRecipe.execute(id);
  }

  replaceRecipe(id: number, dto: SetRecipeDto, actor: AuthenticatedUser) {
    return this.setRecipe.execute(id, dto, actor);
  }

  // ---- Internal API for `stock` (recipe walk, step 05) and step 09 (pre-fill) ----

  /** Raw `{ materialId, quantityPerUnit }` recipe rows for one service. */
  getRecipeRaw(serviceId: number) {
    return this.getRecipe.findRecipeRaw(serviceId);
  }
}
