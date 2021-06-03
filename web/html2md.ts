import turndown from 'turndown';

export function html2md(html: string): string {
  const turndownService = new turndown({
    codeBlockStyle: 'fenced',
    headingStyle: 'atx',
    emDelimiter: '_',
    strongDelimiter: '**',
  });
  return turndownService.turndown(html)
    .replace(/ +$/gm, '') // trim trailing spaces
}
