export function html2md(html: string): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  return element2md(parsed.body).trim();
}

function element2md(node: Node): string {
  let before = '';
  let after = '';
  const tagName = node.nodeName.toLowerCase();
  switch (tagName) {
    case '#text':
      return node.textContent?.replace(/^\s+|\s+$/, ' ') ?? '';
    case '#comment':
      return `\n<!-- ${node.textContent ?? ''} -->\n`
    case 'b':
    case 'strong':
      before = after = '**';
      break;
    case 'i':
    case 'em':
      before = after = '_';
      break;
    case 'code':
      before = after = '`';
      break;
    case 'p':
      before = after = '\n';
      break;
    case 'a':
      if (node instanceof HTMLAnchorElement && node.href) {
        before = '[';
        after = '](' + node.href + ')';
      }
      break;
    case 'img':
      if (node instanceof HTMLImageElement && node.src) {
        return `![${node.alt || node.title}](${node.src})`
      }
      break;
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      const level = (tagName.substr(1) as any) << 0;
      const heading = new Array(level).fill('#').join('');
      before = `\n${heading} `;
      after = '\n';
      break;
    case 'pre':
      before = after = '\n```\n';
      break;
    case 'span':
      if (node instanceof HTMLSpanElement) {
        const weight = node.style.fontWeight;
        const style = node.style.fontStyle;
        const bold = weight.includes('bold') || +weight > 400;
        const italic = style.includes('italic');
        if (bold && italic) {
          before = '**_';
          after = '_**';
        } else if (bold) {
          before = after = '**';
        } else if (italic) {
          before = after = '_';
        }
      }
      break;

  }
  let contents = Array.from(node.childNodes)
    .map(element2md)
    .join('');
  const isBlock = node instanceof HTMLElement && isBlockLevel(node);
  if (isBlock) {
    contents = contents.trim();
  }
  contents = before + contents + after;
  if (isBlock) {
    contents = `\n\n${contents}\n\n`;
  }
  return contents;
}

const blockLevelTagNames = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'canvas',
  'dd',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'main',
  'nav',
  'noscript',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'tfoot',
  'ul',
  'video',
]);

function isBlockLevel(el: HTMLElement) {
  const display = el.style.display;
  if (display.includes('inline')) {
    return false;
  } else if (display.includes('block')) {
    return true;
  } else {
    return blockLevelTagNames.has(el.tagName.toLowerCase());
  }
}
