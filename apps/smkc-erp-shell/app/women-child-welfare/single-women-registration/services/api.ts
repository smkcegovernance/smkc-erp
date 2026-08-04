'use client'

import type { SWRFormData, ApiResponse } from '../types/formTypes'
import { SCHEMES_CONFIG } from '../types/formTypes'

const BASE = '/api/women-child-welfare/single-women'
const TIMEOUT_MS = 15_000

async function safeFetch(p: string, options: RequestInit = {}): Promise<ApiResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(p, { ...options, signal: controller.signal })
    clearTimeout(timer)
    let data: ApiResponse
    try { data = await res.json() as ApiResponse } catch {
      return { success: false, errorCode: 'SERVER_ERROR', message: 'सर्व्हरकडून अवैध प्रतिसाद आला.' }
    }
    if (!res.ok && !data.message) data.message = 'विनंती अयशस्वी झाली.'
    return data
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError')
      return { success: false, errorCode: 'GATEWAY_TIMEOUT', message: 'सर्व्हर प्रतिसाद देत नाही.' }
    if (typeof navigator !== 'undefined' && !navigator.onLine)
      return { success: false, errorCode: 'NO_INTERNET', message: 'इंटरनेट कनेक्शन नाही.' }
    return { success: false, errorCode: 'SERVER_UNREACHABLE', message: 'सर्व्हरशी संपर्क होत नाही.' }
  }
}

function buildSchemes(formData: SWRFormData): string[] {
  const dataAsRecord = formData as unknown as Record<string, unknown>
  return SCHEMES_CONFIG.map((entry) => {
    const code = entry[0]
    const val = dataAsRecord[code] as string | undefined
    return `${code}|${val || 'N'}`
  })
}

export async function submitSWRRegistration(formData: SWRFormData): Promise<ApiResponse> {
  const body = {
    applicationMode: 'ONLINE',
    fullName:        formData.fullName,
    dob:             formData.dob,
    mobileNumber:    formData.mobileNumber,
    aadhaarNumber:   formData.aadhaarNumber,
    district:        formData.district,
    village:         formData.village,
    ward:            formData.ward,
    womenCategory:   formData.womenCategory,
    ageGroup:        formData.ageGroup,
    occupation:      formData.occupation,
    annualIncome:    formData.annualIncome,
    childrenBelow6:  formData.childrenBelow6,
    children6To14:   formData.children6To14,
    otherInfo:       formData.otherInfo,
    schemes:         buildSchemes(formData),
  }
  return safeFetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function getSWRApplicationStatus(regNumber: string): Promise<ApiResponse> {
  return safeFetch(`${BASE}/register/${encodeURIComponent(regNumber)}`)
}
