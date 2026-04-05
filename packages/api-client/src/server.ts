/**
 * Server-side API client.
 * Import only in Next.js Route Handlers (app/api/*\/route.ts) or
 * Server Components — never in 'use client' files.
 *
 * Attaches HMAC authentication headers and unwraps the .NET ApiResponse
 * envelope so callers receive the inner data directly.
 */
import { SmkcApiError } from '@smkc/types'
import { buildAuthHeaders } from './hmac'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

function getBaseUrl(): string {
  const url = process.env.SMKC_API_BASE_URL ?? ''
  if (!url) {
    throw new Error('SMKC_API_BASE_URL environment variable is not set')
  }
  return url
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const baseUrl = getBaseUrl()
  const url = new URL(path, baseUrl)
  const pathWithQuery = url.pathname + (url.search ?? '')
  const bodyStr = body ? JSON.stringify(body) : ''

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...buildAuthHeaders(method, pathWithQuery, bodyStr),
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: bodyStr || undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new SmkcApiError(
      `API ${method} ${path} failed: ${res.status}`,
      res.status,
      'HTTP_ERROR',
      text
    )
  }

  const json = (await res.json()) as Record<string, unknown>

  // Unwrap .NET ApiResponse<T> envelope (handles both PascalCase and camelCase)
  const hasWrapper = 'success' in json || 'Success' in json
  if (hasWrapper) {
    const success = (json.success ?? json.Success) as boolean
    if (!success) {
      const message = ((json.message ?? json.Message) as string) ?? 'API request failed'
      const errorCode = ((json.errorCode ?? json.ErrorCode) as string) ?? 'API_FAILURE'
      throw new SmkcApiError(message, 0, errorCode)
    }
    return (json.data ?? json.Data) as T
  }

  return json as unknown as T
}

export const apiServer = {
  get<T>(path: string) {
    return request<T>('GET', path)
  },
  post<T>(path: string, body: unknown) {
    return request<T>('POST', path, body)
  },
  put<T>(path: string, body: unknown) {
    return request<T>('PUT', path, body)
  },
  patch<T>(path: string, body: unknown) {
    return request<T>('PATCH', path, body)
  },
  delete<T>(path: string) {
    return request<T>('DELETE', path)
  },
}
