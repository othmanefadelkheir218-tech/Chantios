import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { SetCompanyAddressDto } from './dto/set-company-address.dto';
import { DisconnectInboxHandler } from './handlers/disconnect-inbox.handler';
import { FindInboxesHandler } from './handlers/find-inboxes.handler';
import { FinishGmailConnectHandler } from './handlers/finish-gmail-connect.handler';
import {
  OutboundEmail,
  SendThroughInboxHandler,
} from './handlers/send-through-inbox.handler';
import { SetCompanyAddressHandler } from './handlers/set-company-address.handler';
import { StartGmailConnectHandler } from './handlers/start-gmail-connect.handler';
import { fullAddress } from './helpers/inbox.helper';
import {
  EmailInboxRepository,
  InboxWithAddresses,
} from './repositories/email-inbox.repository';

/** What other modules learn about an inbox — never its token. */
export interface InboxSummary {
  id: number;
  tenantId: number;
  kind: 'company' | 'gmail';
  status: 'active' | 'disconnected' | 'removed';
  ownerUserId: number | null;
  /** The address the client sees: the company primary address or the Gmail. */
  address: string | null;
  gmailAddress: string | null;
}

function toSummary(inbox: InboxWithAddresses): InboxSummary {
  const primary = inbox.addresses.find((address) => address.isPrimary);
  return {
    id: inbox.id,
    tenantId: inbox.tenantId,
    kind: inbox.kind,
    status: inbox.status,
    ownerUserId: inbox.ownerUserId,
    address:
      inbox.kind === 'gmail'
        ? inbox.gmailAddress
        : primary
          ? fullAddress(primary.localPart)
          : null,
    gmailAddress: inbox.gmailAddress,
  };
}

/** Orchestration only: each method calls the handler that owns the business logic. */
@Injectable()
export class EmailConnectionsService {
  constructor(
    private readonly inboxes: EmailInboxRepository,
    private readonly findInboxes: FindInboxesHandler,
    private readonly setCompanyAddress: SetCompanyAddressHandler,
    private readonly startGmailConnect: StartGmailConnectHandler,
    private readonly finishGmailConnect: FinishGmailConnectHandler,
    private readonly disconnectInbox: DisconnectInboxHandler,
    private readonly sendThroughInbox: SendThroughInboxHandler,
  ) {}

  findAll(actor: AuthenticatedUser) {
    return this.findInboxes.execute(actor);
  }

  setCompanyLocalPart(dto: SetCompanyAddressDto, actor: AuthenticatedUser) {
    return this.setCompanyAddress.execute(dto, actor);
  }

  startGmail(actor: AuthenticatedUser) {
    return this.startGmailConnect.execute(actor);
  }

  /** Returns the URL to redirect the browser to — never throws. */
  finishGmail(
    code: string | undefined,
    state: string | undefined,
    error: string | undefined,
  ) {
    return this.finishGmailConnect.execute(code, state, error);
  }

  disconnect(id: number, actor: AuthenticatedUser) {
    return this.disconnectInbox.execute(id, actor);
  }

  // ---- Internal API for chat, inbound-email and billing (step 25) ----

  /** One inbox of the current tenant, or null. */
  async findSummary(id: number): Promise<InboxSummary | null> {
    const inbox = await this.inboxes.findById(id);
    return inbox ? toSummary(inbox) : null;
  }

  async findSummaries(ids: number[]): Promise<Map<number, InboxSummary>> {
    if (ids.length === 0) return new Map();
    const rows = await this.inboxes.findByIds([...new Set(ids)]);
    return new Map(rows.map((row) => [row.id, toSummary(row)]));
  }

  /** The company inbox of the current tenant, or null when no address was picked. */
  async findCompanySummary(): Promise<InboxSummary | null> {
    const inbox = await this.inboxes.findCompanyInbox();
    return inbox ? toSummary(inbox) : null;
  }

  /** Every Gmail inbox this user owns or owned — removed ones too (read-only chats). */
  async findOwnedSummaries(userId: number): Promise<InboxSummary[]> {
    return (await this.inboxes.findEveryForUser(userId)).map(toSummary);
  }

  /** The caller's own Gmail inboxes (any status but removed). */
  async findUserSummaries(userId: number): Promise<InboxSummary[]> {
    return (await this.inboxes.findForUser(userId)).map(toSummary);
  }

  /** Sends one client email (Resend or Gmail). `409` when the Gmail is disconnected. */
  send(input: OutboundEmail) {
    return this.sendThroughInbox.execute(input);
  }

  /**
   * The webhook's address lookup (no tenant yet): the inbox a local part of
   * our domain belongs to, with its tenant. The only unscoped read.
   */
  async resolveAddress(localPart: string): Promise<InboxSummary | null> {
    const row = await this.inboxes.findAddressForRouting(localPart);
    return row ? toSummary({ ...row.inbox, addresses: [row] }) : null;
  }

  touchReceived(inboxId: number) {
    return this.inboxes.touchReceived(inboxId);
  }

  setForwardConfirmUrl(inboxId: number, url: string) {
    return this.inboxes.setForwardConfirmUrl(inboxId, url);
  }

  /** D1 — the `email_mailboxes` billing dimension: Gmail inboxes not removed. */
  countBillable(): Promise<number> {
    return this.inboxes.countBillableGmail();
  }
}
