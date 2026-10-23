import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { RequestActor } from '../common/decorators/actor.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { FindTenantsQueryDto } from './dto/find-tenants-query.dto';
import { SetTenantStatusDto } from './dto/suspend-tenant.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
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
import { UpdateTenantProfileHandler } from './handlers/update-tenant-profile.handler';
import { UpdateTenantHandler } from './handlers/update-tenant.handler';
import { VerifyTenantEmailHandler } from './handlers/verify-tenant-email.handler';
import { CheckVatNumberHandler } from './handlers/check-vat-number.handler';
import { TenantRepository } from './repositories/tenant.repository';

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
    private readonly updateTenantProfile: UpdateTenantProfileHandler,
    private readonly checkVatNumberHandler: CheckVatNumberHandler,
    private readonly tenants: TenantRepository,
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

  /** The company edits its own profile (`PATCH /api/tenant`, route in `company-profile`). */
  updateProfile(
    dto: UpdateTenantProfileDto,
    actor: AuthenticatedUser,
    ip: string | null,
  ) {
    return this.updateTenantProfile.execute(dto, actor, ip);
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

  /** Locale, timezone and end-of-day time of one company — used by notifications. */
  findForNotifications(id: number) {
    return this.tenants.findById(id);
  }

  /** Step 27 — country, TVA number and its VIES status: billing resolves the TVA from them. */
  findForBilling(id: number) {
    return this.tenants.findById(id);
  }

  /** Step 27 — asks VIES about a `pending` TVA number. Never throws on a VIES failure. */
  checkVatNumber(id: number) {
    return this.checkVatNumberHandler.execute(id);
  }

  /** Step 27 — the companies the VIES retry job walks. */
  findPendingVatIds() {
    return this.tenants.findPendingVatIds();
  }

  /** Id + name of these companies — the admin subscription list shows names, not ids. */
  findNamesByIds(ids: number[]) {
    return ids.length === 0
      ? Promise.resolve([])
      : this.tenants.findNamesByIds(ids);
  }

  /** The companies the crons walk (status `active`, not deleted). */
  findAllActive() {
    return this.tenants.findAllActive();
  }

  /**
   * One-line passthrough, no business decision to make (same spirit as the
   * other internal methods on `UsersService`). Called by the media module
   * after a logo upload/replace succeeds — never the other way around, to
   * avoid a circular module dependency between `tenants` and `media`.
   */
  setLogoMediaId(id: number, mediaId: number) {
    return this.tenants.setLogoMediaId(id, mediaId);
  }

  /** Platform stats: live companies per status. */
  countByStatus() {
    return this.tenants.countByStatus();
  }

  /** Platform stats: new live companies per month since `since`. */
  countCreatedPerMonth(since: Date) {
    return this.tenants.countCreatedPerMonth(since);
  }
}
