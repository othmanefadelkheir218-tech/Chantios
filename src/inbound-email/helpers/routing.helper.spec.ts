import { ourRecipients } from './routing.helper';

describe('routing.helper — ourRecipients (B5)', () => {
  const domain = 'mail.example.com';

  it('splits reply tokens and our addresses, other domains left out', () => {
    expect(
      ourRecipients(
        [
          ['Reply-ABC123@Mail.Example.com'],
          ['"TEST Alpha" <test-alpha@mail.example.com>', 'eya@gmail.com'],
        ],
        domain,
      ),
    ).toEqual({ replyTokens: ['abc123'], localParts: ['test-alpha'] });
  });

  it('reads a Gmail forward address and keeps each one once', () => {
    expect(
      ourRecipients(
        [
          ['test-alpha.k2m9x7qpwz@mail.example.com'],
          ['test-alpha.k2m9x7qpwz@mail.example.com'],
        ],
        domain,
      ),
    ).toEqual({ replyTokens: [], localParts: ['test-alpha.k2m9x7qpwz'] });
  });

  it('finds nothing for an email not sent to us', () => {
    expect(ourRecipients([['a@b.com'], null, undefined], domain)).toEqual({
      replyTokens: [],
      localParts: [],
    });
  });
});
