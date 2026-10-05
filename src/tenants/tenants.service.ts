import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestActor } from '../common/decorators/actor.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FindTenantsQueryDto } from './dto/find-tenants-query.dto';
import { SetTenantStatusDto } from './dto/suspend-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { VerifyTenantEmailDto } from './dto/verify-tenant-email.dto';
import { CreateTenantHandler } from './handlers/create-tenant.handler';
import { FindTenantHandler } from './handlers/find-tenant.handler';
import { FindTenantsHandler } from './handlers/find-tenants.handler';
import { RestoreTenantHandler } from './handlers/restore-tenant.handler';
import { RestoreTenantsHandler } from './handlers/restore-tenants.handler';
import { SendTenantVerificationEmailHandler } from './handlers/send-tenant-verification-email.handler';
import { SetTenantStatusHandler } from './handlers/set-tenant-status.handler';
import { SoftDeleteTenantHandler } from './handlers/soft-delete-tenant.handler';
import { SoftDeleteTenantsHandler } from './handlers/soft-delete-tenants.handler';
import { UpdateTenantHandler } from './handlers/update-tenant.handler';
import { VerifyTenantEmailHandler } from './handlers/verify-tenant-email.handler';

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class TenantsService {
  constructor(
    private readonly createTenant: CreateTenantHandler,
    private readonly findTenants: FindTenantsHandler,
    private readonly findTenant: FindTenantHandler,
    private readonly updateTenant: UpdateTenantHandler,
    private readonly setTenantStatus: SetTenantStatusHandler,
    private readonly softDeleteTenant: SoftDeleteTenantHandler,
    private readonly softDeleteTenants: SoftDeleteTenantsHandler,
    private readonly restoreTenant: RestoreTenantHandler,
    private readonly restoreTenants: RestoreTenantsHandler,
    private readonly sendVerificationEmail: SendTenantVerificationEmailHandler,
    private readonly verifyEmail: VerifyTenantEmailHandler,
  ) {}

  /** `tx` — step 02 registration runs this inside its own transaction. */
  create(
    dto: CreateTenantDto,
    actor: RequestActor,
    tx?: Prisma.TransactionClient,
  ) {
    return this.createTenant.execute(dto, actor, tx);
  }

  findAll(query: FindTenantsQueryDto) {
    return this.findTenants.execute(query);
  }

  findOne(id: number) {
    return this.findTenant.execute(id);
  }

  update(id: number, dto: UpdateTenantDto, actor: RequestActor) {
    return this.updateTenant.execute(id, dto, actor);
  }

  setStatus(id: number, dto: SetTenantStatusDto, actor: RequestActor) {
    return this.setTenantStatus.execute(id, dto, actor);
  }

  softDelete(id: number, actor: RequestActor) {
    return this.softDeleteTenant.execute(id, actor);
  }

  softDeleteMany(ids: number[]) {
    return this.softDeleteTenants.execute(ids);
  }

  restore(id: number, actor: RequestActor) {
    return this.restoreTenant.execute(id, actor);
  }

  restoreMany(ids: number[]) {
    return this.restoreTenants.execute(ids);
  }

  sendVerificationEmailTo(id: number) {
    return this.sendVerificationEmail.execute(id);
  }

  verifyEmailOf(id: number, dto: VerifyTenantEmailDto, actor: RequestActor) {
    return this.verifyEmail.execute(id, dto, actor);
  }
}
