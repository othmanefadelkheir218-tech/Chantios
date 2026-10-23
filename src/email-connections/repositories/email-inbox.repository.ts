import { Injectable } from '@nestjs/common';
import {
  EmailAddress,
  EmailInbox,
  EmailInboxStatus,
  Prisma,
} from '@prisma/client';
import { TenantPrismaService } from '../../common/prisma/tenant-prisma.service';
import { PrismaService } from '../../prisma/prisma.service';

export type InboxWithAddresses = EmailInbox & { addresses: EmailAddress[] };

const WITH_ADDRESSES = {
  addresses: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.EmailInboxInclude;

/**
 * The only place where the email-connections module talks to the database:
 * `email_inboxes` + `email_addresses` (doc/notes/client-email.md).
 */
@Injectable()
export class EmailInboxRepository {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
  ) {}

  createCompanyInbox(tenantId: number): Promise<EmailInbox> {
    return this.tenantPrisma.db.emailInbox.create({
      data: { tenantId, kind: 'company', connectedAt: new Date() },
    });
  }

  findCompanyInbox(): Promise<InboxWithAddresses | null> {
    return this.tenantPrisma.db.emailInbox.findFirst({
      where: { kind: 'company' },
      include: WITH_ADDRESSES,
    });
  }

  findById(id: number): Promise<InboxWithAddresses | null> {
    return this.tenantPrisma.db.emailInbox.findFirst({
      where: { id },
      include: WITH_ADDRESSES,
    });
  }

  findByIds(ids: number[]): Promise<InboxWithAddresses[]> {
    return this.tenantPrisma.db.emailInbox.findMany({
      where: { id: { in: ids } },
      include: WITH_ADDRESSES,
    });
  }

  /** The Gmail inboxes of one user, removed ones left out. */
  findForUser(userId: number): Promise<InboxWithAddresses[]> {
    return this.tenantPrisma.db.emailInbox.findMany({
      where: { kind: 'gmail', ownerUserId: userId, status: { not: 'removed' } },
      include: WITH_ADDRESSES,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Every Gmail inbox this user ever owned, removed ones too (their old chats stay readable). */
  findEveryForUser(userId: number): Promise<InboxWithAddresses[]> {
    return this.tenantPrisma.db.emailInbox.findMany({
      where: { kind: 'gmail', ownerUserId: userId },
      include: WITH_ADDRESSES,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** Every Gmail inbox of the company not removed — status only is shown. */
  findAllGmail(): Promise<InboxWithAddresses[]> {
    return this.tenantPrisma.db.emailInbox.findMany({
      where: { kind: 'gmail', status: { not: 'removed' } },
      include: WITH_ADDRESSES,
      orderBy: { createdAt: 'asc' },
    });
  }

  /** The not-removed Gmail inbox of this user for this address (reconnect). */
  findGmailForOwner(
    userId: number,
    gmailAddress: string,
  ): Promise<InboxWithAddresses | null> {
    return this.tenantPrisma.db.emailInbox.findFirst({
      where: {
        kind: 'gmail',
        ownerUserId: userId,
        gmailAddress: { equals: gmailAddress, mode: 'insensitive' },
        status: { not: 'removed' },
      },
      include: WITH_ADDRESSES,
    });
  }

  createGmailInbox(data: {
    tenantId: number;
    ownerUserId: number;
    gmailAddress: string;
    refreshTokenEncrypted: string;
    scopes: string;
    localPart: string;
  }): Promise<InboxWithAddresses> {
    return this.tenantPrisma.db.emailInbox.create({
      data: {
        tenantId: data.tenantId,
        kind: 'gmail',
        ownerUserId: data.ownerUserId,
        gmailAddress: data.gmailAddress,
        refreshTokenEncrypted: data.refreshTokenEncrypted,
        scopes: data.scopes,
        connectedAt: new Date(),
        addresses: {
          // tenant_id comes from the composite relation (tenant_id, inbox_id).
          create: {
            localPart: data.localPart,
            isPrimary: true,
          },
        },
      },
      include: WITH_ADDRESSES,
    });
  }

  /** A reconnect: new token, `active` again, the error cleared. */
  setToken(id: number, encrypted: string, scopes: string): Promise<EmailInbox> {
    return this.tenantPrisma.db.emailInbox.update({
      where: { id },
      data: {
        refreshTokenEncrypted: encrypted,
        scopes,
        status: 'active',
        lastError: null,
        connectedAt: new Date(),
        disconnectedAt: null,
      },
    });
  }

  updateStatus(
    id: number,
    status: EmailInboxStatus,
    error?: string,
  ): Promise<EmailInbox> {
    const now = new Date();
    return this.tenantPrisma.db.emailInbox.update({
      where: { id },
      data: {
        status,
        lastError: error ?? null,
        ...(status === 'disconnected' && { disconnectedAt: now }),
        ...(status === 'removed' && { removedAt: now }),
      },
    });
  }

  /** `removed`: the Google token is gone for good. */
  wipeToken(id: number): Promise<EmailInbox> {
    return this.tenantPrisma.db.emailInbox.update({
      where: { id },
      data: { refreshTokenEncrypted: null, scopes: null },
    });
  }

  touchUsed(id: number): Promise<EmailInbox> {
    return this.tenantPrisma.db.emailInbox.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  touchReceived(id: number): Promise<EmailInbox> {
    return this.tenantPrisma.db.emailInbox.update({
      where: { id },
      data: { lastReceivedAt: new Date() },
    });
  }

  setForwardConfirmUrl(id: number, url: string): Promise<EmailInbox> {
    return this.tenantPrisma.db.emailInbox.update({
      where: { id },
      data: { forwardConfirmUrl: url },
    });
  }

  addAddress(
    tenantId: number,
    inboxId: number,
    localPart: string,
    isPrimary: boolean,
  ): Promise<EmailAddress> {
    return this.tenantPrisma.db.emailAddress.create({
      data: { tenantId, inboxId, localPart, isPrimary },
    });
  }

  /** The company address changes: the old one keeps working, not primary. */
  async demotePrimary(inboxId: number): Promise<void> {
    await this.tenantPrisma.db.emailAddress.updateMany({
      where: { inboxId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  /** Makes an old address of this inbox primary again (the admin picks it back). */
  async promote(addressId: number): Promise<void> {
    await this.tenantPrisma.db.emailAddress.update({
      where: { id: addressId },
      data: { isPrimary: true },
    });
  }

  findAddresses(inboxId: number): Promise<EmailAddress[]> {
    return this.tenantPrisma.db.emailAddress.findMany({
      where: { inboxId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** D1 — Gmail inboxes not removed: the `email_mailboxes` billing count. */
  countBillableGmail(): Promise<number> {
    return this.tenantPrisma.db.emailInbox.count({
      where: { kind: 'gmail', status: { not: 'removed' } },
    });
  }

  /**
   * THE ONLY BYPASS of the tenant extension in this module. The webhook knows
   * only the recipient address, not the tenant yet — so this one read runs on
   * the unwrapped client and returns the tenant it belongs to. It is also
   * what `PATCH /company` uses to tell a name taken by another company.
   */
  findAddressForRouting(
    localPart: string,
  ): Promise<(EmailAddress & { inbox: EmailInbox }) | null> {
    return this.prisma.emailAddress.findFirst({
      where: { localPart: { equals: localPart, mode: 'insensitive' } },
      include: { inbox: true },
    });
  }
}
