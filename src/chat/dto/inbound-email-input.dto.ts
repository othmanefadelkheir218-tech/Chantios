/**
 * One received email, already routed to an inbox of the current tenant, as
 * `inbound-email` hands it to `ChatService.receiveInboundEmail` (step 25).
 * Not an HTTP DTO: it never comes from a request body.
 */
export interface InboundAttachmentFile {
  filename: string;
  contentType: string | null;
  size: number;
  /** `cid:` of an inline image, referenced in the HTML. */
  contentId: string | null;
  inline: boolean;
  /** Downloads the file — called only for a file we keep (D2). */
  load: () => Promise<Buffer>;
}

export interface InboundEmailInput {
  tenantId: number;
  inboxId: number;
  /** The topic of a `reply-<token>@…` recipient (company inbox), if any. */
  replyTopicId: number | null;
  resendEmailId: string;
  headerMessageId: string | null;
  inReplyTo: string | null;
  references: string[];
  from: { address: string; name: string | null };
  to: string[];
  cc: string[];
  /** As received: prefixes and `[#code]` included. */
  subject: string;
  /** Without `Re:` / `Fwd:` / `[#code]` — the subject of a new topic. */
  topicSubject: string;
  /** D3 — the `[#code]` read from the subject, or null. */
  subjectCode: string | null;
  html: string | null;
  /** The full text, quotes included. */
  text: string | null;
  /** What the client really wrote: quotes and signature cut (`email-parse.helper`). */
  cleanText: string;
  attachments: InboundAttachmentFile[];
}
