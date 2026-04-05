export interface AppConfig {
  /** Base URL of the .NET backend — server-side only */
  apiBaseUrl: string
  appEnv: 'development' | 'production' | 'test'
  /** HMAC API key sent as X-API-Key — server-side only */
  apiKey: string
  /** HMAC signing secret — server-side only, never expose to the browser */
  secretKey: string
}

export function getConfig(): AppConfig {
  return {
    apiBaseUrl: process.env.SMKC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    appEnv: (process.env.NODE_ENV as AppConfig['appEnv']) ?? 'development',
    apiKey: process.env.SMKC_API_KEY ?? '',
    secretKey: process.env.SMKC_SECRET_KEY ?? '',
  }
}
