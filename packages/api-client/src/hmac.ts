import { createHmac } from 'crypto'

export function unixTimestampSeconds(): string {
  return Math.floor(Date.now() / 1000).toString()
}

/**
 * Produces HMAC-SHA256 signature identical to the .NET backend's
 * ApiKeyAuthenticationHandler: method + pathWithQuery + body + timestamp + apiKey
 */
export function signRequest(
  method: string,
  pathWithQuery: string,
  body: string,
  timestamp: string,
  apiKey: string,
  secretKey: string
): string {
  const stringToSign = method.toUpperCase() + pathWithQuery + body + timestamp + apiKey
  return createHmac('sha256', secretKey).update(stringToSign).digest('base64')
}

/**
 * Builds the three HMAC auth headers expected by the .NET backend.
 * Reads SMKC_API_KEY and SMKC_SECRET_KEY from environment (server-side only).
 */
export function buildAuthHeaders(
  method: string,
  pathWithQuery: string,
  body: string
): Record<string, string> {
  const apiKey = process.env.SMKC_API_KEY ?? ''
  const secretKey = process.env.SMKC_SECRET_KEY ?? ''
  const timestamp = unixTimestampSeconds()
  const signature = signRequest(method, pathWithQuery, body, timestamp, apiKey, secretKey)
  return {
    'X-API-Key': apiKey,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  }
}
