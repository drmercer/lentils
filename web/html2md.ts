interface Options {
  log?: (line: string) => void;
  includeComments?: boolean;
}

interface Context extends Options { }

export function html2md(html: string, options: Options = {}): string {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const context = {
    ...options,
  };
  return element2md(parsed.body, context)
    .trim()
    .replace(/[ \t]+\n/g, '\n') // trim whitespace at EOL
    .replace(/\n{3,}/g, '\n\n') // Collapse newlines down to at most 2
}

function element2md(node: Node, context: Context): string {
  if (node instanceof HTMLImageElement && node.src) {
    // image element - special case because no contents
    // TODO put the title after the src, like [this](example "tada").
    return `![${node.alt || node.title}](${node.src})`;
  } else if (isBlock(node)) {
    context.log?.("is block node: <" + node.tagName.toLowerCase() + ">");
    // block element
    if (isCode(node)) {
      const fence = '\n```\n';

      const contents = node.textContent || "";

      const result = '\n' + fence + contents + fence + '\n';
      context.log?.(`code block <${node.nodeName}> result: ${result}`);
      return result;
    } else {

      let contents = Array.from(node.childNodes)
        .map(e => element2md(e, context))
        .join('');

      const headingLevel = maybeHeadingLevel(node);
      if (headingLevel && contents) {
        const headingPrefix = new Array(headingLevel).fill('#').join('')
        contents = headingPrefix + ' ' + contents.trim();
      }

      return contents.replace(/\b +\n? */g, ' ').replace(/^\s*|\s*$/, '\n\n');
    }
  } else {
    // inline element
    if (isComment(node)) {
      const contents = context.includeComments ? node.textContent : undefined;
      return contents ? ` <!-- ${contents} -->` : '';
    }
    if (isText(node)) {
      return node.textContent?.replace(/^\s+|\s+$/, ' ') || '';
    }
    if (!(node instanceof HTMLElement)) {
      return '';
    }
    let before = '';
    let after = '';
    if (node instanceof HTMLAnchorElement && node.href) {
      // TODO put title after link [this](example "tada").
      before = '[';
      after = '](' + node.href.trim() + ')';
    }
    if (isBold(node)) {
      context.log?.("bold!");
      before = before + '**';
      after = '**' + after;
    }
    if (isItalic(node)) {
      context.log?.("italic!");
      before = before + '_';
      after = '_' + after;
    }
    if (isCode(node)) {
      context.log?.("code!");
      before = before + '`';
      after = '`' + after;
    }

    let contents = Array.from(node.childNodes)
      .map(e => element2md(e, context))
      .join('');

    return contents ? before + contents + after : '';
  }
}

const blockLevelTagNames = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'body',
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

function isBlock(el: Node): el is HTMLElement {
  if (!(el instanceof HTMLElement)) {
    return false;
  }
  const display = el.style.display;
  if (display.includes('inline')) {
    return false;
  } else if (display.includes('block')) {
    return true;
  } else {
    return blockLevelTagNames.has(el.tagName.toLowerCase());
  }
}

function isComment(el: Node): boolean {
  return el.nodeName.toLowerCase() === '#comment';
}

function isText(el: Node): boolean {
  return el.nodeName.toLowerCase() === '#text';
}

function isBold(el: HTMLElement): boolean {
  if (el.tagName.toLowerCase() === 'b' || el.tagName.toLowerCase() === 'strong') {
    return true;
  }
  const weight = el.style.fontWeight;
  return weight.includes('bold') || +weight > 400;
}

function isItalic(el: HTMLElement): boolean {
  return el.tagName.toLowerCase() === 'i'
    || el.tagName.toLowerCase() === 'em'
    || el.style.fontStyle.includes('italic');
}

function isCode(el: HTMLElement): boolean {
  return el.tagName.toLowerCase() === 'code'
    || el.tagName.toLowerCase() == 'pre'
    || !!el.style.fontFamily.match(/\bmono(?:space)?\b/i);
}

function maybeHeadingLevel(el: HTMLElement): number | undefined {
  const level = el.tagName.toLowerCase().match(/^h(\d)$/i)?.[1];
  return level ? +level : undefined;
}
