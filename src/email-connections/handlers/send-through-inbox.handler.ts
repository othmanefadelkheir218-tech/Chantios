import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailTransport } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { decryptSecret } from '../../common/helpers/crypto.helper';
import {
  buildRawMime,
  MimeAttachment,
  textToHtml,
} from '../../email/helpers/email-mime.helper';
import { EmailService } from '../../email/email.service';
import { TenantsService } from '../../tenants/tenants.service';
import {
  getAccessToken,
  GmailAccessLostError,
  sendRawEmail,
} from '../helpers/gmail-oauth.helper';
import { fullAddress, replyAddress } from '../helpers/inbox.helper';
import { withSubjectCode } from '../../common/helpers/subject-code.helper';
import {
  EmailInboxRepository,
  InboxWithAddresses,
} from '../repositories/email-inbox.repository';
import { MarkInboxBrokenHandler } from './mark-inbox-broken.handler';

/** One email to a client, in one topic (chat builds it, this sends it). */
export interface OutboundEmail {
  inboxId: number;
  to: string[];
  cc?: string[];
  /** The topic subject (no code, no `Re:`): a reply adds `Re: ` itself. */
  subject: string;
  isReply: boolean;
  subjectCode: string;
  /** The client's last email in the topic carries our `[#code]` (a thread we started). */
  threadHasCode?: boolean;
  replyToken: string;
  /** What the user typed, sent as written. */
  text: string;
  /** The `Message-ID`s of the client's emails in this topic (newest last). */
  references: string[];
  attachments: { filename: string; url: string; mimeType: string }[];
}

export interface SentEmail {
  transport: EmailTransport;
  fromAddress: string;
  fromName: string | null;
  subject: string;
  html: string;
  inReplyTo: string | null;
  resendEmailId: string | null;
  gmailMessageId: string | null;
}

/**
 * Sends one client email from the inbox of its topic (doc/notes/client-email.md
 * § Replying, § How a client's reply finds its topic):
 *
 * - company inbox → Resend, `From: "<Company>" <primary@…>`, `Reply-To:
 *   reply-<token>@…`;
 * - Gmail inbox → Gmail API, `From: <gmail>`, NO `Reply-To`. The subject ends
 *   with `[#<code>]`, except on a reply to the client's own email (it keeps
 *   their subject, so their Gmail keeps one conversation).
 *
 * Both thread with `In-Reply-To` + `References`. A Gmail whose access is gone
 * becomes `disconnected` and the send stops with `409` — it NEVER falls back
 * to another address.
 */
@Injectable()
export class SendThroughInboxHandler {
  constructor(
    @InjectPinoLogger(SendThroughInboxHandler.name)
    private readonly logger: PinoLogger,
    private readonly inboxes: EmailInboxRepository,
    private readonly email: EmailService,
    private readonly tenants: TenantsService,
    private readonly markBroken: MarkInboxBrokenHandler,
  ) {}

  async execute(input: OutboundEmail): Promise<SentEmail> {
    const inbox = await this.inboxes.findById(input.inboxId);
    if (!inbox) throw new NotFoundException('Inbox not found');
    const subject = input.isReply ? `Re: ${input.subject}` : input.subject;
    const html = textToHtml(input.text);
    const inReplyTo = input.references.at(-1) ?? null;

    this.logger.info(
      `Sending a client email from inbox ${inbox.id} (${inbox.kind}) to ${input.to.join(', ')}`,
    );
    const sent =
      inbox.kind === 'company'
        ? await this.sendFromCompany(inbox, input, subject, html, inReplyTo)
        : await this.sendFromGmail(inbox, input, subject, html, inReplyTo);
    await this.inboxes.touchUsed(inbox.id);
    return sent;
  }

  private async sendFromCompany(
    inbox: InboxWithAddresses,
    input: OutboundEmail,
    subject: string,
    html: string,
    inReplyTo: string | null,
  ): Promise<SentEmail> {
    const primary = inbox.addresses.find((address) => address.isPrimary);
    if (!primary) {
      throw new ConflictException(
        'The company email address is not set yet (Settings → Email)',
      );
    }
    const tenant = await this.tenants.findForNotifications(inbox.tenantId);
    const fromName = tenant?.name ?? null;
    const fromAddress = fullAddress(primary.localPart);
    const { resendEmailId } = await this.email.sendThreaded({
      fromName: fromName ?? '',
      fromAddress,
      to: input.to,
      cc: input.cc,
      subject,
      html,
      text: input.text,
      replyTo: replyAddress(input.replyToken),
      inReplyTo,
      references: input.references,
      attachments: input.attachments.map((file) => ({
        filename: file.filename,
        path: file.url,
        contentType: file.mimeType,
      })),
    });
    return {
      transport: 'resend',
      fromAddress,
      fromName,
      subject,
      html,
      inReplyTo,
      resendEmailId,
      gmailMessageId: null,
    };
  }

  private async sendFromGmail(
    inbox: InboxWithAddresses,
    input: OutboundEmail,
    subject: string,
    html: string,
    inReplyTo: string | null,
  ): Promise<SentEmail> {
    if (inbox.status !== 'active' || !inbox.refreshTokenEncrypted) {
      throw new ConflictException('Your Gmail is disconnected');
    }
    const fromAddress = inbox.gmailAddress as string;
    // Keep the subject the thread already has — the client's Gmail threads
    // by subject. A topic the client started has no code (their next reply
    // finds the topic by `References`); a topic we started keeps its code
    // in every email, replies included.
    const answersClient = input.isReply && input.references.length > 0;
    const coded =
      answersClient && !input.threadHasCode
        ? subject
        : withSubjectCode(subject, input.subjectCode);
    let gmailMessageId: string;
    try {
      const accessToken = await getAccessToken(
        decryptSecret(inbox.refreshTokenEncrypted),
      );
      const raw = buildRawMime({
        from: fromAddress,
        to: input.to,
        cc: input.cc,
        subject: coded,
        text: input.text,
        html,
        inReplyTo,
        references: input.references,
        attachments: await this.download(input.attachments),
      });
      gmailMessageId = (await sendRawEmail(accessToken, raw)).id;
    } catch (error: unknown) {
      if (error instanceof GmailAccessLostError) {
        await this.markBroken.execute(inbox, error.reason);
        throw new ConflictException('Your Gmail is disconnected');
      }
      throw error;
    }
    this.logger.info(`Gmail ${inbox.id} sent message ${gmailMessageId}`);
    return {
      transport: 'gmail',
      fromAddress,
      fromName: null,
      subject: coded,
      html,
      inReplyTo,
      resendEmailId: null,
      gmailMessageId,
    };
  }

  /** The Gmail API takes the file bytes: fetch each file from ImageKit. */
  private async download(
    files: OutboundEmail['attachments'],
  ): Promise<MimeAttachment[]> {
    const result: MimeAttachment[] = [];
    for (const file of files) {
      const res = await fetch(file.url);
      if (!res.ok) {
        throw new ConflictException(`File ${file.filename} could not be read`);
      }
      result.push({
        filename: file.filename,
        mimeType: file.mimeType,
        content: Buffer.from(await res.arrayBuffer()),
      });
    }
    return result;
  }
}
