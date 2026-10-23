import {
  cleanEmailText,
  cleanSubject,
  extractForwardConfirmLink,
  isAutoReply,
  isOwnEmail,
  parseAddress,
  parseMessageIds,
} from './email-parse.helper';
import {
  readSubjectCode,
  withSubjectCode,
} from '../../common/helpers/subject-code.helper';

describe('email-parse.helper — cleanEmailText (B4 samples)', () => {
  it('cuts a Gmail English quote, even on two lines', () => {
    const text = [
      'Gris merci',
      '',
      'On Mon, 13 Oct 2026 at 10:02, TEST Alpha Renovation <test-alpha@mail.zouadev.com>',
      'wrote:',
      '> Blanc ou gris ?',
    ].join('\n');
    expect(cleanEmailText(text)).toBe('Gris merci');
  });

  it('cuts a Gmail French quote', () => {
    const text =
      'Parfait, à mardi.\r\n\r\nLe lun. 13 oct. 2026 à 10:02, Othmane <o@gmail.com> a écrit :\r\n> On passe mardi ?\r\n';
    expect(cleanEmailText(text)).toBe('Parfait, à mardi.');
  });

  it('cuts an Outlook French quote (De : / Envoyé :)', () => {
    const text = [
      'Bonjour,',
      'Voici le plan.',
      '',
      'De : TEST Alpha <test-alpha@mail.zouadev.com>',
      'Envoyé : lundi 13 octobre 2026 10:02',
      'À : Eya <eya@x.com>',
      'Objet : Devis',
      '',
      'Ancien texte',
    ].join('\n');
    expect(cleanEmailText(text)).toBe('Bonjour,\nVoici le plan.');
  });

  it('cuts "-----Original Message-----"', () => {
    const text = 'Ok for me.\n\n-----Original Message-----\nFrom: x\nSent: y\n';
    expect(cleanEmailText(text)).toBe('Ok for me.');
  });

  it('cuts a Dutch quote', () => {
    const text =
      'Akkoord.\n\nOp ma 13 okt 2026 om 10:02 schreef Eya <eya@x.com>:\n> Vraag';
    expect(cleanEmailText(text)).toBe('Akkoord.');
  });

  it('removes [image: …] and the signature', () => {
    const text =
      'Voici la photo [image: IMG_2031.jpg]\n\n-- \nEya Jarraya\n0470 00 00 00';
    expect(cleanEmailText(text)).toBe('Voici la photo');
  });

  it('removes trailing "> quoted" lines with no header', () => {
    expect(cleanEmailText('Oui\n> Question ?\n> encore')).toBe('Oui');
  });

  it('keeps the full text when the cut leaves nothing', () => {
    const text = 'On Mon, 13 Oct 2026, Eya wrote:\n> only a quote';
    expect(cleanEmailText(text)).toContain('only a quote');
  });

  it('returns an empty string for no text', () => {
    expect(cleanEmailText(null)).toBe('');
  });
});

describe('email-parse.helper — subject, ids, addresses', () => {
  it('strips reply prefixes and the topic code', () => {
    expect(cleanSubject('RE: Fwd: TR: Devis cuisine [#K7Q2M9]')).toBe(
      'Devis cuisine',
    );
    expect(cleanSubject('Antw: AW: Offerte')).toBe('Offerte');
    expect(cleanSubject('   ')).toBe('(no subject)');
  });

  it('reads the topic code back, and never writes it twice', () => {
    const coded = withSubjectCode('Devis cuisine [#AAAAAA]', 'K7Q2M9');
    expect(coded).toBe('Devis cuisine [#K7Q2M9]');
    expect(readSubjectCode(`Re: ${coded}`)).toBe('K7Q2M9');
    expect(readSubjectCode('Devis cuisine')).toBeNull();
  });

  it('parses References and In-Reply-To ids', () => {
    expect(
      parseMessageIds('<a@mail.gmail.com>\r\n <b@eu-west-1.amazonses.com>'),
    ).toEqual(['<a@mail.gmail.com>', '<b@eu-west-1.amazonses.com>']);
    expect(parseMessageIds(undefined)).toEqual([]);
  });

  it('parses a From address', () => {
    expect(parseAddress('"Eya Jarraya" <Eya@Mail.com>')).toEqual({
      address: 'eya@mail.com',
      name: 'Eya Jarraya',
    });
    expect(parseAddress('eya@mail.com')).toEqual({
      address: 'eya@mail.com',
      name: null,
    });
  });
});

describe('email-parse.helper — auto-replies and the Gmail forward', () => {
  it('detects auto-replies', () => {
    expect(isAutoReply({ 'Auto-Submitted': 'auto-replied' })).toBe(true);
    expect(isAutoReply({ 'auto-submitted': 'no' })).toBe(false);
    expect(isAutoReply({ 'X-Autoreply': 'yes' })).toBe(true);
    expect(isAutoReply({ Precedence: 'bulk' })).toBe(true);
    expect(isAutoReply({ subject: 'x' })).toBe(false);
    expect(isAutoReply(null)).toBe(false);
  });

  it('spots our own email coming back (no alert loop)', () => {
    expect(isOwnEmail('noreply@zouadev.com', 'noreply@zouadev.com')).toBe(true);
    expect(isOwnEmail(' NoReply@Zouadev.com', 'noreply@zouadev.com')).toBe(
      true,
    );
    expect(isOwnEmail('client@gmail.com', 'noreply@zouadev.com')).toBe(false);
  });

  it('finds the Gmail forwarding confirm link', () => {
    const text =
      'To allow, click:\nhttps://mail-settings.google.com/mail/vf-%5BANGjdJ8%5D-abc123\nThanks';
    expect(extractForwardConfirmLink(text)).toBe(
      'https://mail-settings.google.com/mail/vf-%5BANGjdJ8%5D-abc123',
    );
    expect(extractForwardConfirmLink('no link')).toBeNull();
  });
});
