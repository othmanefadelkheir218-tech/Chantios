const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&copy;': '©',
  '&amp;': '&',
};

/**
 * The plain-text twin of an HTML email (DESIGN.md § 6: every email has one).
 * Mail programs that do not show HTML, and spam filters, use it. Links stay
 * readable: `label (url)`, or just the url when the label is the url.
 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(head|style|script)[\s\S]*?<\/\1>/gi, '')
    .replace(
      /<a\s[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
      (_match, href: string, label: string) => {
        const text = label.replace(/<[^>]+>/g, '').trim();
        return text === href ? href : `${text} (${href})`;
      },
    )
    .replace(/<\/(p|h1|div|tr)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(nbsp|lt|gt|quot|copy|amp);/g, (entity) => ENTITIES[entity])
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
