import { isArray } from '../types/checks';

export interface EmailLinkOpts {
  email?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject?: string;
  body?: string;
}

function ensureArray<T>(maybeArray: T | T[]): T[] {
  return isArray(maybeArray) ? maybeArray : [maybeArray];
}

export function mailto({ email, cc, bcc, subject, body }: EmailLinkOpts): string {
  const emails = !email ? '' : ensureArray(email).join(',');
  const query = new URLSearchParams();
  if (cc) {
    query.append('cc', ensureArray(cc).join(','));
  }
  if (bcc) {
    query.append('bcc', ensureArray(bcc).join(','));
  }
  if (subject) {
    query.append('subject', subject);
  }
  if (body) {
    query.append('body', body);
  }
  const queryString = query.toString();
  return `mailto:${emails}${queryString ? '?' + queryString : ''}`;
}
