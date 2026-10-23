import {
  checkEmailAttachment,
  isMimeAllowed,
  MAX_EMAIL_ATTACHMENT_BYTES,
  maxFileSize,
  PUBLIC_MEDIA_ENTITY_TYPES,
} from './media.helper';

const MB = 1024 * 1024;

describe('media.helper — email attachments (D2)', () => {
  it('allows 25 MB for email files, 10 MB for the rest', () => {
    expect(maxFileSize('email_attachment')).toBe(25 * MB);
    expect(maxFileSize('message')).toBe(10 * MB);
  });

  it('accepts Office, ZIP, TXT, CSV, PDF and images', () => {
    for (const [name, type] of [
      ['devis.pdf', 'application/pdf'],
      [
        'plan.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      ['prix.xlsx', 'application/vnd.ms-excel'],
      ['photos.zip', 'application/x-zip-compressed'],
      ['notes.txt', 'text/plain; charset=utf-8'],
      ['liste.csv', 'text/csv'],
      ['photo.gif', 'image/gif'],
    ]) {
      expect(checkEmailAttachment(name, type, 1000).ok).toBe(true);
    }
  });

  it('takes the type of the extension for a generic octet-stream', () => {
    expect(
      checkEmailAttachment('offre.pptx', 'application/octet-stream', 1000),
    ).toEqual({
      ok: true,
      mimeType:
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
  });

  it('blocks programs by extension and by type', () => {
    expect(
      checkEmailAttachment('setup.exe', 'application/octet-stream', 1000),
    ).toEqual({ ok: false, reason: 'blocked_type' });
    expect(
      checkEmailAttachment('facture.pdf', 'application/x-msdownload', 1000),
    ).toEqual({ ok: false, reason: 'blocked_type' });
    expect(checkEmailAttachment('run.JS', 'text/plain', 1000)).toEqual({
      ok: false,
      reason: 'blocked_type',
    });
  });

  it('refuses a type outside the list', () => {
    expect(checkEmailAttachment('film.mp4', 'video/mp4', 1000)).toEqual({
      ok: false,
      reason: 'blocked_type',
    });
  });

  it('refuses a file over 25 MB', () => {
    expect(
      checkEmailAttachment(
        'big.pdf',
        'application/pdf',
        MAX_EMAIL_ATTACHMENT_BYTES + 1,
      ),
    ).toEqual({ ok: false, reason: 'too_large' });
  });

  it('keeps email files out of the generic media routes', () => {
    expect(PUBLIC_MEDIA_ENTITY_TYPES).not.toContain('email_attachment');
    expect(isMimeAllowed('email_attachment', 'text/csv')).toBe(true);
  });
});
