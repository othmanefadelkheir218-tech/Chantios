import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { GetReceivingEmailResponseSuccess } from 'resend';
import { ChatService } from '../../chat/chat.service';
import { InboundAttachmentFile } from '../../chat/dto/inbound-email-input.dto';
import { TenantContextService } from '../../common/cls/tenant-context.service';
import { readSubjectCode } from '../../common/helpers/subject-code.helper';
import { env } from '../../config/env.config';
import { resend } from '../../config/resend.config';
import {
  EmailConnectionsService,
  InboxSummary,
} from '../../email-connections/email-connections.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  cleanEmailText,
  cleanSubject,
  extractForwardConfirmLink,
  GMAIL_FORWARD_CONFIRM_SENDER,
  header,
  isAutoReply,
  isOwnEmail,
  parseAddress,
  parseMessageIds,
} from '../helpers/email-parse.helper';
import { ourRecipients } from '../helpers/routing.helper';
import { InboundEmailEventRepository } from '../repositories/inbound-email-event.repository';

type ReceivedEmail = GetReceivingEmailResponseSuccess;

interface Route {
  tenantId: number;
  inboxId: number;
  replyTopicId: number | null;
}

/** Stops the job without a retry: the email can never be routed. */
class Unroutable extends Error {}

/**
 * The worker side of `POST /api/webhooks/resend-inbound` (doc/notes/client-email.md
 * § Which emails come in). In order:
 *
 *   1. skip an event already processed (a redelivered job);
 *   2. fetch the full email from Resend (the webhook is only a notice);
 *   3. route it: `reply-<token>` → that topic; else our address → its inbox;
 *      unknown → the event keeps the error "unknown address", nothing else;
 *   4. open the tenant in CLS;
 *   5. Gmail's forwarding confirmation → store its link + alert the owner;
 *   6. an auto-reply, or our own email coming back (an alert forwarded by a
 *      Gmail) → kept as an event only, no message, no alert — never a loop;
 *   7. hand it to chat (`receiveInboundEmail`);
 *   8. mark the event processed.
 *
 * Any other error is stored on the event and re-thrown: BullMQ retries 3×.
 */
@Injectable()
export class ProcessInboundEmailHandler {
  constructor(
    @InjectPinoLogger(ProcessInboundEmailHandler.name)
    private readonly logger: PinoLogger,
    private readonly events: InboundEmailEventRepository,
    private readonly cls: ClsService,
    private readonly tenantContext: TenantContextService,
    private readonly chat: ChatService,
    private readonly emailConnections: EmailConnectionsService,
    private readonly notifications: NotificationsService,
  ) {}

  async execute(eventRowId: number, resendEmailId: string): Promise<void> {
    const row = await this.events.findById(eventRowId);
    if (row?.processedAt) {
      this.logger.warn(`Inbound email ${resendEmailId} already processed`);
      return;
    }

    let tenantId: number | null = null;
    try {
      const email = await this.fetch(resendEmailId);
      const route = await this.route(email);
      tenantId = route.tenantId;
      const note = await this.cls.run(async () => {
        this.tenantContext.setTenantId(route.tenantId);
        return this.handle(email, route, resendEmailId);
      });
      await this.events.markProcessed(eventRowId, route.tenantId, note);
      this.logger.info(
        `Inbound email ${resendEmailId} processed (tenant ${route.tenantId})${note ? `: ${note}` : ''}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      await this.events.markError(eventRowId, message, tenantId);
      if (error instanceof Unroutable) {
        this.logger.warn(`Inbound email ${resendEmailId}: ${message}`);
        return; // no retry: it can never be routed
      }
      this.logger.error(
        { err: error },
        `Inbound email ${resendEmailId} failed`,
      );
      throw error;
    }
  }

  private async fetch(resendEmailId: string): Promise<ReceivedEmail> {
    // `cid`: inline images stay `cid:` references; chat swaps them for their URL.
    const { data, error } = await resend.emails.receiving.get(resendEmailId, {
      html_format: 'cid',
    });
    if (error || !data) {
      throw new Error(`Resend fetch failed: ${error?.message ?? 'no email'}`);
    }
    return data;
  }

  /** B5 — the reply token first (the exact topic), else our address. */
  private async route(email: ReceivedEmail): Promise<Route> {
    const { replyTokens, localParts } = ourRecipients([
      email.received_for,
      email.to,
      email.cc,
    ]);
    for (const token of replyTokens) {
      const topic = await this.chat.findReplyTopic(token);
      if (topic) {
        return {
          tenantId: topic.tenantId,
          inboxId: topic.inboxId,
          replyTopicId: topic.topicId,
        };
      }
    }
    for (const localPart of localParts) {
      const inbox = await this.emailConnections.resolveAddress(localPart);
      if (!inbox) continue;
      if (inbox.status === 'removed') {
        throw new Unroutable(`inbox ${inbox.id} removed`);
      }
      return {
        tenantId: inbox.tenantId,
        inboxId: inbox.id,
        replyTopicId: null,
      };
    }
    throw new Unroutable('unknown address');
  }

  /** Inside the tenant. Returns a note when nothing was saved on purpose. */
  private async handle(
    email: ReceivedEmail,
    route: Route,
    resendEmailId: string,
  ): Promise<string | null> {
    const inbox = await this.emailConnections.findSummary(route.inboxId);
    if (!inbox) throw new Unroutable(`inbox ${route.inboxId} not found`);
    const from = parseAddress(email.from);

    if (from.address === GMAIL_FORWARD_CONFIRM_SENDER) {
      await this.forwardConfirmation(email, inbox);
      return 'gmail forward confirmation';
    }
    if (isAutoReply(email.headers)) {
      this.logger.info(`Inbound email ${resendEmailId} is an auto-reply`);
      return 'ignored: auto-reply';
    }
    if (isOwnEmail(from.address, env.EMAIL)) {
      this.logger.info(`Inbound email ${resendEmailId} is our own email`);
      return 'ignored: our own email';
    }

    await this.chat.receiveInboundEmail({
      tenantId: route.tenantId,
      inboxId: inbox.id,
      replyTopicId: route.replyTopicId,
      resendEmailId,
      headerMessageId:
        parseMessageIds(email.message_id)[0] ?? email.message_id ?? null,
      inReplyTo:
        parseMessageIds(header(email.headers, 'in-reply-to'))[0] ?? null,
      references: parseMessageIds(header(email.headers, 'references')),
      from,
      to: email.to,
      cc: email.cc ?? [],
      subject: email.subject ?? '',
      topicSubject: cleanSubject(email.subject),
      subjectCode: readSubjectCode(email.subject),
      html: email.html,
      text: email.text,
      cleanText: cleanEmailText(email.text),
      attachments: await this.attachments(resendEmailId, email),
    });
    return null;
  }

  /** Gmail asks the owner to confirm the forward: keep the link, tell the owner. */
  private async forwardConfirmation(
    email: ReceivedEmail,
    inbox: InboxSummary,
  ): Promise<void> {
    const link =
      extractForwardConfirmLink(email.text) ??
      extractForwardConfirmLink(email.html);
    if (!link || inbox.kind !== 'gmail' || !inbox.ownerUserId) {
      this.logger.warn(`Gmail forward confirmation without a link or owner`);
      return;
    }
    await this.emailConnections.setForwardConfirmUrl(inbox.id, link);
    await this.notifications.dispatch('email_forward_confirm', {
      tenantId: inbox.tenantId,
      userIds: [inbox.ownerUserId],
      payload: {
        entity_id: inbox.id,
        inbox_id: inbox.id,
        gmail_address: inbox.gmailAddress,
        confirm_url: link,
      },
    });
  }

  /**
   * The files, with a download URL each (signed by Resend). Chat checks the
   * D2 rules first and downloads only the files it keeps.
   */
  private async attachments(
    resendEmailId: string,
    email: ReceivedEmail,
  ): Promise<InboundAttachmentFile[]> {
    if (email.attachments.length === 0) return [];
    const { data, error } = await resend.emails.receiving.attachments.list({
      emailId: resendEmailId,
    });
    if (error || !data) {
      throw new Error(`Resend attachments failed: ${error?.message ?? 'none'}`);
    }
    return data.data.map((file) => ({
      filename: file.filename ?? 'file',
      contentType: file.content_type ?? null,
      size: file.size,
      contentId: file.content_id?.replace(/^<|>$/g, '') ?? null,
      inline: file.content_disposition === 'inline',
      load: async () => {
        const res = await fetch(file.download_url);
        if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
        return Buffer.from(await res.arrayBuffer());
      },
    }));
  }
}
