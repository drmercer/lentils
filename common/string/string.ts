import { isString, isArray } from '../types/checks';

export function kebabCase(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\W+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function leftPad(str: string | number, width: number, space = ' '): string {
  let result = '' + str;
  while (result.length < width) {
    result = space + result;
  }
  return result;
}

// A template tag that does the same thing as no tag at all
export function standardTemplate(parts: TemplateStringsArray, ...interpolations: unknown[]) {
  if (interpolations.length === 1 && isArray(interpolations[0])) {
    console.warn('You passed an array to standardTemplate. Did you mean to spread it?');
  }
  let text = '';
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    text += part;
    if (i < interpolations.length) {
      text += interpolations[i];
    }
  }
  return text;
}

export function demargin(parts: TemplateStringsArray | string, ...interpolations: unknown[]) {
  let text: string;
  if (isString(parts)) {
    if (interpolations.length > 0) {
      throw new Error('Must not call demargin with a regular string and interpolations!');
    }
    text = parts;
  } else {
    text = standardTemplate(parts, ...interpolations);
  }
  // Remove the left margin
  const regex1 = /^(?:\s*\n)*([ \t]*)/;
  const marginSize = text.match(regex1)![1].length;
  const regex2 = new RegExp(`\n[ \t]{0,${marginSize}}`, 'g');
  return text
    .replace(regex1, '')
    .replace(regex2, '\n')
    .replace(/\n\s+$/, '\n');
}

export function trimTo(size: number, str: string): string {
  let title = str.trim().substring(0, size);
  if (title.length === size) {
    const ellipsizeAtMost = Math.floor(size / 3);
    title = title.replace(new RegExp(String.raw`(?:\s+\S{0,${ellipsizeAtMost}}|\S)$`), '…');
  }
  return title;
}

export function isUrl(str: string): boolean {
  try {
    return new URL(str).href === str;
  } catch (err) {
    return false;
  }
}

/**
 * Extracts the given line range out of the text
 *
 * @param str The text
 * @param start The starting line index, inclusive, 0-based
 * @param end The ending line index, exclusive, 0-based
 * @returns The given lines, or empty string if the line range is out of range
 */
export function selectLines(str: string, start: number, end: number): string {
  return str.split(/\r?\n/g).slice(start, end).join('\n');
}
