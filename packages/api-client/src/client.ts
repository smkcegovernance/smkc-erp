'use client'

/**
 * Client-side API client.
 * Calls the Next.js API routes (app/api/*) — never the .NET backend directly.
 * This keeps HMAC secrets and backend URLs server-side only.
 *
 * Import in 'use client' components or hooks only.
 */
import { SmkcApiError } from '@smkc/types'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem('smkc_session')
    if (!raw) return null
    const session = JSON.parse(raw) as { token?: string; expiresAt?: string }
    if (!session.token) return null
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) return null
    return session.token
  } catch {
    return null
  }
}

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getSessionToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    let errorCode = 'HTTP_ERROR'
    let message = `${method} ${path} failed`
    try {
      const json = JSON.parse(text) as { errorCode?: string; message?: string }
      if (json.errorCode) errorCode = json.errorCode
      if (json.message) message = json.message
    } catch {
      // plain text error body
    }
    throw new SmkcApiError(message, res.status, errorCode, text)
  }

  // Unwrap the { success, data, message } envelope produced by withRoute
  const json = (await res.json()) as Record<string, unknown>
  if (json && typeof json === 'object' && ('success' in json || 'Success' in json)) {
    const success = (json.success ?? json.Success) as boolean
    if (!success) {
      const msg = ((json.message ?? json.Message) as string) ?? 'API request failed'
      const errorCode = ((json.errorCode ?? json.ErrorCode) as string) ?? 'API_FAILURE'
      throw new SmkcApiError(msg, res.status, errorCode)
    }
    return (json.data ?? json.Data) as T
  }
  return json as unknown as T
}

export const apiClient = {
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
