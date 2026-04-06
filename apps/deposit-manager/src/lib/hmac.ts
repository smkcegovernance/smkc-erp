import CryptoJS from 'crypto-js'

export function unixTimestampSeconds(): string {
  return Math.floor(Date.now() / 1000).toString()
}

export function signRequest(
  method: string,
  pathWithQuery: string,
  body: string,
  timestamp: string,
  apiKey: string,
  secretKey: string
): string {
  const stringToSign = method.toUpperCase() + pathWithQuery + body + timestamp + apiKey
  return CryptoJS.HmacSHA256(stringToSign, secretKey).toString(CryptoJS.enc.Base64)
}

export function buildAuthHeaders(
  method: string,
  pathWithQuery: string,
  body: string
): HeadersInit {
  const apiKey = process.env.API_KEY ?? ''
  const secretKey = process.env.SECRET_KEY ?? ''
  const timestamp = unixTimestampSeconds()
  const signature = signRequest(method, pathWithQuery, body, timestamp, apiKey, secretKey)
  return {
    'X-API-Key': apiKey,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  }
}
