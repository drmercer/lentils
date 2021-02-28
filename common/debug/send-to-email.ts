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
  let queryString = query.toString();
  // Do these parameters manually, so we can use '%20' instead of '+' for spaces. This is needed
  // because mobile (or at least, the Gmail app) doesn't translate '+' to spaces correctly.
  if (subject) {
    queryString += '&subject=' + encodeURIComponent(subject);
  }
  if (body) {
    queryString += '&body=' + encodeURIComponent(body);
  }
  if (queryString.startsWith('&')) {
    queryString = queryString.substr(1);
  }
  return `mailto:${emails}${queryString ? '?' + queryString : ''}`;
}
