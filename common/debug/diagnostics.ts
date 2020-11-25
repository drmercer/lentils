import { labeledCodeBlock } from "./error";

export function diagnosticMarkdown(): string {
  const url = getCurrentUrl();
  const userAgent = getUserAgent();
  const nodeVersion = getNodeVersion();
  const timestamp = new Date().toUTCString();

  return (url ? labeledCodeBlock('Page URL', url) : '') +
    (userAgent ? labeledCodeBlock('User Agent', userAgent) : '') +
    (nodeVersion ? labeledCodeBlock('Node version', nodeVersion) : '') +
    labeledCodeBlock('System time', timestamp);
}

export function getCurrentUrl(): string | undefined {
  try {
    return window.location.href.trim();
  } catch (e) {
    return undefined;
  }
}

export function getUserAgent(): string | undefined {
  try {
    return window.navigator.userAgent.trim();
  } catch (e) {
    return undefined;
  }
}

export function getNodeVersion(): string | undefined {
  try {
    if (!process.version || !process.platform || !process.arch) {
      return undefined;
    }
    return `Node ${process.version} on ${process.platform} (${process.arch})`
  } catch (e) {
    return undefined;
  }
}

export function getRuntimeName(): string | undefined {
  return getUserAgent() || getNodeVersion();
}

export function isMobile(): boolean {
  return !!getUserAgent()?.match(/\bMobile\b/i);
}

export function getDeviceType(): string {
  if (!getUserAgent()) {
    return 'Node Program';
  } else if (isMobile()) {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
}
