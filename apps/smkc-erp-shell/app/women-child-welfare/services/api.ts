'use client'

import type { FormData, ApiResponse } from '../types/formTypes'

const BASE = '/api/women-child-welfare'

/** Browser-side fetch timeout in milliseconds */
const FETCH_TIMEOUT_MS = 15_000

/**
 * Detect whether the browser itself has no internet, vs the server being down.
 */
function networkErrorMessage(): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'तुमचे इंटरनेट कनेक्शन बंद आहे. कृपया इंटरनेट सुरू करून पुन्हा प्रयत्न करा.'
  }
  return 'सर्व्हरशी संपर्क होत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.'
}

/**
 * Wraps fetch with a timeout and converts all network-level failures
 * into a structured ApiResponse instead of throwing, so callers never crash.
 */
async function safeFetch(path: string, options: RequestInit = {}): Promise<ApiResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(path, { ...options, signal: controller.signal })
    clearTimeout(timer)

    let data: ApiResponse
    try {
      data = await res.json() as ApiResponse
    } catch {
      return {
        success: false,
        errorCode: 'SERVER_ERROR',
        message: 'सर्व्हरकडून अवैध प्रतिसाद आला. कृपया पुन्हा प्रयत्न करा.',
      }
    }

    if (!res.ok && !data.message) {
      data.message = 'विनंती अयशस्वी झाली. कृपया पुन्हा प्रयत्न करा.'
    }
    return data
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        errorCode: 'GATEWAY_TIMEOUT',
        message: 'सर्व्हर प्रतिसाद देत नाही. हे सर्व्हर नेटवर्क समस्या असू शकते. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.',
      }
    }
    return {
      success: false,
      errorCode: 'SERVER_UNREACHABLE',
      message: networkErrorMessage(),
    }
  }
}

async function uploadForm(method: 'POST' | 'PUT', path: string, formData: globalThis.FormData): Promise<ApiResponse> {
  return safeFetch(path, { method, body: formData })
}

async function requestJson(method: string, path: string, body?: unknown): Promise<ApiResponse> {
  const init: RequestInit = { method, cache: 'no-store' }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return safeFetch(path, init)
}

function toMultipart(data: Partial<FormData>): globalThis.FormData {
  const fd = new globalThis.FormData()
  const payload: Record<string, unknown> = {}
  const payloadKeyMap: Record<string, string> = {
    disabilityTypes: 'disabilitySelections',
    assistiveDevices: 'assistiveDeviceSelections',
  }

  for (const [key, value] of Object.entries(data)) {
    if (value instanceof File) {
      fd.append(key, value)
    } else if (value !== null && value !== undefined) {
      payload[payloadKeyMap[key] ?? key] = value
    }
  }

  fd.append(
    'payload',
    new Blob([JSON.stringify(payload)], { type: 'application/json;charset=UTF-8' }),
    'payload.json'
  )

  return fd
}

export function registerDisabledPerson(formData: FormData): Promise<ApiResponse> {
  return uploadForm('POST', `${BASE}/register`, toMultipart(formData))
}

export function getRegistration(id: string): Promise<ApiResponse> {
  return requestJson('GET', `${BASE}/register/${encodeURIComponent(id)}`)
}

export function getAllRegistrations(page = 1, limit = 10): Promise<ApiResponse> {
  return requestJson('GET', `${BASE}/register?page=${page}&limit=${limit}`)
}

export function listRegistrations(filters?: { status?: string; q?: string }): Promise<ApiResponse> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.q) params.set('q', filters.q)
  const query = params.toString()
  return requestJson('GET', `${BASE}/register${query ? `?${query}` : ''}`)
}

export function updateRegistrationStatus(
  registrationNo: string,
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED',
  remarks?: string,
  operatorUserId?: number
): Promise<ApiResponse> {
  return requestJson(
    'PATCH',
    `${BASE}/register/${encodeURIComponent(registrationNo)}/status`,
    { status, remarks: remarks ?? '', operatorUserId }
  )
}

export function updateRegistration(id: string, formData: Partial<FormData>): Promise<ApiResponse> {
  return uploadForm('PUT', `${BASE}/register/${encodeURIComponent(id)}`, toMultipart(formData))
}

export function deleteRegistration(id: string): Promise<ApiResponse> {
  return requestJson('DELETE', `${BASE}/register/${encodeURIComponent(id)}`)
}

export function searchRegistrations(query: string, field = 'all'): Promise<ApiResponse> {
  return requestJson('GET', `${BASE}/register/search?q=${encodeURIComponent(query)}&field=${encodeURIComponent(field)}`)
}


