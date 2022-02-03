import MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import { selectLines } from './string/string';

function getHeadingLevel(t: Token): number | undefined {
  if (t.type !== "heading_open") {
    return undefined;
  }
  const level = t.tag.match(/^h(\d+)$/)?.[1];
  return Number(level) || undefined;
}

export function getSectionLineRange(headings: string[], markdown: string): [number, number] | undefined {
  const md = MarkdownIt();
  const tokens: Token[] = md.parse(markdown, {});
  let level = 0;
  let startLine: number | undefined; // inclusive index
  let endLine: number | undefined; // exclusive index
  let active = false;
  // start at 1 because we also look at the previous token
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const prevToken = tokens[i - 1];
    const headingLevel = getHeadingLevel(prevToken);
    if (headingLevel) {
      if (headingLevel === (level + 1) && token.content === headings[level]) {
        level++;
        if (level === headings.length) {
          startLine = token.map?.[0];
          // console.log('Setting startLine to ' + startLine, token);
          active = true;
        }
      } else if (headingLevel === level && active) {
        active = false;
      } else if (headingLevel < level) {
        level = headingLevel;
        active = false;
      }
    }
    if (active) {
      endLine = prevToken.map?.[1] || endLine;
      // console.log('Setting endLine to ' + endLine, { prevToken, token, headingLevel });
    }
  }
  if (startLine === undefined || endLine === undefined) {
    return undefined;
  } else {
    return [startLine, endLine];
  }
}

export function getSection(headings: string[], markdown: string): string | undefined {
  const range = getSectionLineRange(headings, markdown);
  if (!range) {
    return undefined;
  }
  const [startLine, endLine] = range;
  return selectLines(markdown, startLine, endLine);
}
