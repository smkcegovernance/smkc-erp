/**
 * Shared helpers for classifying upstream network errors and adding fetch timeouts.
 * Used by both public and department (Women & Child Welfare) API route handlers.
 */

// ---------------------------------------------------------------
// When ALLOW_INSECURE_LOCALHOST_TLS=true, disable TLS certificate
// verification so Next.js can reach https://localhost:5443 with a
// self-signed certificate (Windows Server / IIS dev setup).
// This must run before any fetch() call is made.
// ---------------------------------------------------------------
if (process.env.ALLOW_INSECURE_LOCALHOST_TLS === 'true') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}

/** How long (ms) a Next.js route handler waits for the .NET backend before aborting */
export const UPSTREAM_TIMEOUT_MS = 12_000

export type ApiErrorCode =
  | 'VALIDATION_ERROR'    // bad user input
  | 'OTP_EXPIRED'         // OTP timed out
  | 'OTP_INVALID'         // wrong OTP value
  | 'OTP_MAX_ATTEMPTS'    // too many wrong tries
  | 'RATE_LIMIT'          // too many requests
  | 'SERVER_UNREACHABLE'  // ECONNREFUSED / ENOTFOUND — .NET backend is down
  | 'GATEWAY_TIMEOUT'     // upstream took too long (AbortError)
  | 'SERVER_ERROR'        // upstream returned 5xx
  | 'UNKNOWN_ERROR'       // catch-all

/**
 * Inspect a Node.js fetch error and decide whether the problem is
 * "server unreachable" or a timeout.  Returns a structured error.
 */
export function classifyUpstreamFetchError(err: unknown): {
  code: ApiErrorCode
  message: string
  status: number
} {
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return {
        code: 'GATEWAY_TIMEOUT',
        message: 'सर्व्हर प्रतिसाद देत नाही. हे सर्व्हर नेटवर्क समस्या असू शकते. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.',
        status: 504,
      }
    }

    const cause = (err as NodeJS.ErrnoException & { cause?: NodeJS.ErrnoException }).cause
    const sysCode = cause?.code ?? (err as NodeJS.ErrnoException).code ?? ''

    if (
      sysCode === 'ECONNREFUSED' ||
      sysCode === 'ENOTFOUND' ||
      sysCode === 'ECONNRESET' ||
      sysCode === 'EHOSTUNREACH'
    ) {
      return {
        code: 'SERVER_UNREACHABLE',
        message: 'सर्व्हरशी संपर्क होत नाही. कृपया नंतर पुन्हा प्रयत्न करा.',
        status: 503,
      }
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'अनपेक्षित त्रुटी आली. कृपया पुन्हा प्रयत्न करा.',
    status: 500,
  }
}

/**
 * Wraps fetch with an AbortController timeout.
 * Returns the promise and a cancel function.
 */
export function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = UPSTREAM_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  )
}
