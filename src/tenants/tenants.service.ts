import { Injectable } from '@nestjs/common';
import { RequestActor } from '../common/decorators/actor.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FindTenantsQueryDto } from './dto/find-tenants-query.dto';
import { SetTenantStatusDto } from './dto/suspend-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateTenantHandler } from './handlers/create-tenant.handler';
import { FindTenantHandler } from './handlers/find-tenant.handler';
import { FindTenantsHandler } from './handlers/find-tenants.handler';
import { SetTenantStatusHandler } from './handlers/set-tenant-status.handler';
import { UpdateTenantHandler } from './handlers/update-tenant.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class TenantsService {
  constructor(
    private readonly createTenant: CreateTenantHandler,
    private readonly findTenants: FindTenantsHandler,
    private readonly findTenant: FindTenantHandler,
    private readonly updateTenant: UpdateTenantHandler,
    private readonly setTenantStatus: SetTenantStatusHandler,
  ) {}

  create(dto: CreateTenantDto, actor: RequestActor) {
    return this.createTenant.execute(dto, actor);
  }

  findAll(query: FindTenantsQueryDto) {
    return this.findTenants.execute(query);
  }

  findOne(id: string) {
    return this.findTenant.execute(id);
  }

  update(id: string, dto: UpdateTenantDto, actor: RequestActor) {
    return this.updateTenant.execute(id, dto, actor);
  }

  setStatus(id: string, dto: SetTenantStatusDto, actor: RequestActor) {
    return this.setTenantStatus.execute(id, dto, actor);
  }
}
