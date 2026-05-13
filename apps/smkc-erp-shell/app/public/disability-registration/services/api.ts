'use client'

import type { FormData, ApiResponse } from '../../../women-child-welfare/types/formTypes'

const BASE = '/api/public/disability-registration'

async function uploadForm(method: 'POST' | 'PUT', path: string, formData: globalThis.FormData): Promise<ApiResponse> {
  const res = await fetch(path, { method, body: formData })
  if (!res.ok) {
    throw await createRequestError(method, path, res)
  }
  return res.json() as Promise<ApiResponse>
}

async function requestJson(method: 'GET', path: string): Promise<ApiResponse> {
  const res = await fetch(path, { method, cache: 'no-store' })
  if (!res.ok) {
    throw await createRequestError(method, path, res)
  }
  return res.json() as Promise<ApiResponse>
}

async function createRequestError(method: string, path: string, res: Response): Promise<Error> {
  let message = `${method} ${path} failed: ${res.status}`
  try {
    const payload = (await res.json()) as { message?: string }
    if (payload?.message) {
      message = payload.message
    }
  } catch {
    // Ignore non-JSON responses and keep the default message.
  }
  return new Error(message)
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

export async function registerDisabledPerson(data: FormData): Promise<ApiResponse> {
  return uploadForm('POST', BASE, toMultipart(data))
}

export async function getRegistration(id: string): Promise<ApiResponse> {
  return requestJson('GET', `${BASE}/${encodeURIComponent(id)}`)
}
