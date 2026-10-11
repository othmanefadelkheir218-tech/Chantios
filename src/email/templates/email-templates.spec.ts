import { escapeHtml, renderEmailLayout, toEmailLocale } from './email-layout';
import { inviteEmployeeTemplate } from './invite-employee.template';
import { passwordResetTemplate } from './password-reset.template';
import { tenantEmailVerificationTemplate } from './tenant-email-verification.template';

describe('email layout', () => {
  const html = renderEmailLayout({
    locale: 'fr',
    title: 'Bonjour',
    bodyHtml: '<p>Texte</p>',
    button: { label: 'Ouvrir', url: 'https://app.test/x' },
    note: 'Une note',
  });

  it('has the ChantiOs black header, the orange line and the black footer', () => {
    expect(html).toContain('background:#0B0B0C');
    expect(html).toContain('Chanti<span style="color:#FF6A00;">Os</span>');
    expect(html).toContain('height:4px');
    expect(html).toContain('&copy; ChantiOs');
  });

  it('has an orange button with black text, plus a copy-the-link fallback', () => {
    expect(html).toContain('background:#FF6A00');
    expect(html).toMatch(/color:#0B0B0C;text-decoration:none;">Ouvrir<\/a>/);
    expect(html).toContain('Copiez ce lien');
  });

  it('is a phone-friendly one-column page of at most 600 px', () => {
    expect(html).toContain('name="viewport"');
    expect(html).toContain('max-width:600px');
  });

  it('shows a code in a big box, and escapes it', () => {
    const out = renderEmailLayout({
      locale: 'en',
      title: 'Code',
      bodyHtml: '',
      code: '<b>1</b>',
    });
    expect(out).toContain('letter-spacing:8px');
    expect(out).toContain('&lt;b&gt;1&lt;/b&gt;');
  });

  it('toEmailLocale keeps fr / en / nl and sends everything else to en', () => {
    expect(['fr', 'en', 'nl'].map(toEmailLocale)).toEqual(['fr', 'en', 'nl']);
    for (const bad of ['ar', 'de', '', undefined, null]) {
      expect(toEmailLocale(bad)).toBe('en');
    }
  });

  it('escapeHtml neutralises tags and quotes', () => {
    expect(escapeHtml('<a href="x">&')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;',
    );
  });
});

describe.each([
  ['fr', 'Vous êtes invité', 'Activer mon compte'],
  ['en', "You're invited", 'Activate my account'],
  ['nl', 'U bent uitgenodigd', 'Account activeren'],
] as const)('invitation email (%s)', (locale, title, button) => {
  const out = inviteEmployeeTemplate(
    'Dupont <Bouw>',
    'http://localhost:5300/i/invitations/accept?token=abc&x=1',
    locale,
  );

  it('speaks the language and says ChantiOs', () => {
    expect(out.subject).toContain('ChantiOs');
    expect(out.subject).toContain(title);
    expect(out.html).toContain(button);
    expect(out.html).toContain(`lang="${locale}"`);
  });

  it('escapes the company name and the link', () => {
    expect(out.html).toContain('Dupont &lt;Bouw&gt;');
    expect(out.html).not.toContain('<Bouw>');
    expect(out.html).toContain('token=abc&amp;x=1');
  });
});

describe.each(['fr', 'en', 'nl'] as const)('code emails (%s)', (locale) => {
  it.each([
    ['password reset', passwordResetTemplate],
    ['email verification', tenantEmailVerificationTemplate],
  ])('%s shows the code in the big box', (_name, template) => {
    const out = template('482913', locale);
    expect(out.subject).toContain('ChantiOs');
    expect(out.html).toContain('482913');
    expect(out.html).toContain('letter-spacing:8px');
    expect(out.html).toContain(`lang="${locale}"`);
  });
});

it('a missing or unknown locale gives the English email', () => {
  expect(passwordResetTemplate('1').subject).toBe('Password reset — ChantiOs');
  expect(passwordResetTemplate('1', 'ar' as unknown as 'en').subject).toBe(
    'Password reset — ChantiOs',
  );
});
