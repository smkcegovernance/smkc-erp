export interface AppConfig {
  apiBaseUrl: string
  appEnv: 'development' | 'production' | 'test'
  sessionSecret: string
}

export function getConfig(): AppConfig {
  return {
    apiBaseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000',
    appEnv:
      (process.env.NODE_ENV as AppConfig['appEnv']) ?? 'development',
    sessionSecret: process.env.SESSION_SECRET ?? '',
  }
}
