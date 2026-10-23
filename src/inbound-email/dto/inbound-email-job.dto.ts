export const INBOUND_EMAIL_QUEUE = 'inbound-email';

/**
 * One BullMQ job: a Resend `email.received` notice already stored in
 * `inbound_email_events` (synchronously, in the webhook request). The
 * processor fetches the full email with `resendEmailId` and routes it.
 */
export interface InboundEmailJobData {
  eventRowId: number;
  resendEmailId: string;
}
