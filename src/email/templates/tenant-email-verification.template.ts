/** `send-tenant-verification-email.handler.ts` builds the email from this. */
export function tenantEmailVerificationTemplate(code: string) {
  return {
    subject: 'Verify your email — ChantierOS',
    html: `
      <p>Here is your verification code:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;">${code}</p>
      <p>It expires in 24 hours. If you did not request this, ignore this email.</p>
    `,
  };
}
