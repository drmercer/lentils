import { labeledCodeBlock } from "./error";

export function diagnosticMarkdown(): string {
  const userAgent = getUserAgent();
  const nodeVersion = getNodeVersion();
  const timestamp = new Date().toUTCString();

  return (userAgent ? labeledCodeBlock('User Agent', userAgent) : '') +
    (nodeVersion ? labeledCodeBlock('Node version', nodeVersion) : '') +
    labeledCodeBlock('System time', timestamp);
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

export function getDeviceType(): string | undefined {
  const ua = getUserAgent();
  if (!ua) {
    return 'Node Program';
  } else if (ua.match(/\bMobile\b/i)) {
    return 'Mobile';
  } else {
    return 'Desktop';
  }
}
