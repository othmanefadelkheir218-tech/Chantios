import { passwordResetTemplate } from '../templates/password-reset.template';
import { htmlToText } from './html-to-text.helper';

describe('htmlToText', () => {
  it('strips tags and keeps paragraphs on separate lines', () => {
    expect(htmlToText('<p>One</p><p>Two <b>bold</b></p>')).toBe(
      'One\nTwo bold',
    );
  });

  it('keeps a link readable: label (url), or only the url', () => {
    expect(htmlToText('<a href="https://x/y">Open</a>')).toBe(
      'Open (https://x/y)',
    );
    expect(htmlToText('<a href="https://x/y">https://x/y</a>')).toBe(
      'https://x/y',
    );
  });

  it('drops head and style, and decodes entities', () => {
    expect(
      htmlToText(
        '<head><title>T</title></head><style>p{}</style><p>a &amp; b &lt;c&gt;</p>',
      ),
    ).toBe('a & b <c>');
  });

  it('turns the real layout into readable text', () => {
    const text = htmlToText(passwordResetTemplate('482913', 'en').html);
    expect(text).toContain('Password reset');
    expect(text).toContain('482913');
    expect(text).toContain('ChantiOs');
    expect(text).not.toContain('<');
  });
});
