import type { ApiResponse } from '@smkc/types'

export interface RequestOptions {
  method?: string
  body?: unknown
  token?: string
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (!res.ok) {
    return {
      success: false,
      message: `HTTP ${res.status}`,
      data: null,
      errorCode: 'HTTP_ERROR',
    }
  }

  return res.json() as Promise<ApiResponse<T>>
}

export function createApiClient(baseUrl: string, token?: string) {
  return {
    get<T>(path: string) {
      return apiRequest<T>(`${baseUrl}${path}`, { token })
    },
    post<T>(path: string, body: unknown) {
      return apiRequest<T>(`${baseUrl}${path}`, { method: 'POST', body, token })
    },
    put<T>(path: string, body: unknown) {
      return apiRequest<T>(`${baseUrl}${path}`, { method: 'PUT', body, token })
    },
    delete<T>(path: string) {
      return apiRequest<T>(`${baseUrl}${path}`, { method: 'DELETE', token })
    },
  }
}
