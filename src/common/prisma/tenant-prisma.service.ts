import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../cls/tenant-context.service';
import { applyTenantExtension } from './tenant-extension';

type TenantScopedClient = ReturnType<typeof applyTenantExtension>;

/**
 * The type of `tx` inside `this.tenantPrisma.db.$transaction(async (tx) => {...})`.
 * Extracted from the extended client's own `$transaction` signature rather
 * than typed as the raw `Prisma.TransactionClient` — a Prisma Client
 * extension's model delegates are a structurally different (if compatible
 * at runtime) generic shape, so a union of `Prisma.TransactionClient` with
 * `TenantScopedClient` does not type-check ("not callable", excessive stack
 * depth). Every repository method that threads an optional `tx` across a
 * cross-module transaction (step 06's quote-acceptance chain and onward)
 * should type it as `TenantTransactionClient`, not `Prisma.TransactionClient`.
 */
export type TenantTransactionClient = Parameters<
  Parameters<TenantScopedClient['$transaction']>[0]
>[0];

/**
 * The tenant-scoped Prisma client. Every tenant-owned table's repository
 * (`users`, `user_invitations`, `role_permissions`, and every module after
 * step 02) injects this instead of the raw `PrismaService` and reads through
 * `.db`. The raw `PrismaService` stays the only client for the 8 skip-listed
 * platform tables (unchanged, see tenant-extension.ts) and for the one
 * deliberately-unscoped query login needs (`UserRepository.findByEmail`).
 *
 * The raw client is wrapped exactly once, here, at startup — nothing else in
 * the app may construct a Prisma client.
 */
@Injectable()
export class TenantPrismaService implements OnModuleInit {
  private extendedClient!: TenantScopedClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  onModuleInit(): void {
    this.extendedClient = applyTenantExtension(this.prisma, this.tenantContext);
  }

  get db(): TenantScopedClient {
    return this.extendedClient;
  }
}
