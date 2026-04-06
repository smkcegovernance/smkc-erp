function isInsecureLocalhostTlsAllowed(): boolean {
  // Always require explicit opt-in to avoid insecure defaults.
  return process.env.ALLOW_INSECURE_LOCALHOST_TLS === 'true';
}

export function maybeEnableInsecureLocalhostTls(rawUrl: string): void {
  if (typeof process === 'undefined' || !isInsecureLocalhostTlsAllowed()) {
    return;
  }

  try {
    const parsed = new URL(rawUrl);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    if (isLocalhost && parsed.protocol === 'https:') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
  } catch {
    // Ignore malformed URLs and keep default TLS behavior.
  }
}