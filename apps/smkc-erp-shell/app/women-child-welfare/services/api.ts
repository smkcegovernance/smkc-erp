'use client'

import { apiClient } from '@smkc/api-client'
import type { FormData, ApiResponse } from '../types/formTypes'

const BASE = '/api/women-child-welfare'

// Multipart helper — preserves file uploads while attaching the session token
function getSessionToken(): string | null {
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

async function uploadForm(method: 'POST' | 'PUT', path: string, formData: globalThis.FormData): Promise<ApiResponse> {
  const headers: Record<string, string> = {}
  const token = getSessionToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(path, { method, headers, body: formData })
  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${res.status}`)
  }
  return res.json() as Promise<ApiResponse>
}

function toMultipart(data: Partial<FormData>): globalThis.FormData {
  const fd = new globalThis.FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      fd.append(key, value)
    } else if (Array.isArray(value)) {
      fd.append(key, JSON.stringify(value))
    } else if (value !== null && value !== undefined) {
      fd.append(key, String(value))
    }
  }
  return fd
}

export function registerDisabledPerson(formData: FormData): Promise<ApiResponse> {
  return uploadForm('POST', `${BASE}/register`, toMultipart(formData))
}

export function getRegistration(id: string): Promise<ApiResponse> {
  return apiClient.get<ApiResponse>(`${BASE}/register/${encodeURIComponent(id)}`)
}

export function getAllRegistrations(page = 1, limit = 10): Promise<ApiResponse> {
  return apiClient.get<ApiResponse>(`${BASE}/register?page=${page}&limit=${limit}`)
}

export function updateRegistration(id: string, formData: Partial<FormData>): Promise<ApiResponse> {
  return uploadForm('PUT', `${BASE}/register/${encodeURIComponent(id)}`, toMultipart(formData))
}

export function deleteRegistration(id: string): Promise<ApiResponse> {
  return apiClient.delete<ApiResponse>(`${BASE}/register/${encodeURIComponent(id)}`)
}

export function searchRegistrations(query: string, field = 'all'): Promise<ApiResponse> {
  return apiClient.get<ApiResponse>(
    `${BASE}/register/search?q=${encodeURIComponent(query)}&field=${encodeURIComponent(field)}`
  )
}


