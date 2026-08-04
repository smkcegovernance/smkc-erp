// Re-exports the shared snapshot utilities with a public-specific storage prefix and URL.
import type { FormData } from '../../../women-child-welfare/types/formTypes'
import {
  buildPrintableApplicationSnapshot,
  type PrintableApplicationSnapshot,
} from '../../../women-child-welfare/utils/printableApplication'

export type { PrintableApplicationSnapshot } from '../../../women-child-welfare/utils/printableApplication'

const STORAGE_PREFIX = 'public-wcwc-printable-application:'

function getStorageKey(registrationNumber: string) {
  return `${STORAGE_PREFIX}${registrationNumber}`
}

export function savePrintableApplicationSnapshot(formData: FormData, registrationNumber: string) {
  if (typeof window === 'undefined' || !registrationNumber) {
    return
  }
  const snapshot = buildPrintableApplicationSnapshot(formData, registrationNumber)
  window.localStorage.setItem(getStorageKey(registrationNumber), JSON.stringify(snapshot))
}

export function getPrintableApplicationSnapshot(registrationNumber: string): PrintableApplicationSnapshot | null {
  if (typeof window === 'undefined' || !registrationNumber) {
    return null
  }
  const raw = window.localStorage.getItem(getStorageKey(registrationNumber))
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw) as PrintableApplicationSnapshot
  } catch {
    window.localStorage.removeItem(getStorageKey(registrationNumber))
    return null
  }
}

export function getPrintableApplicationUrl(registrationNumber: string, mode: 'print' | 'download' = 'print') {
  const params = mode === 'download' ? '?download=1' : '?autoprint=1'
  return `/public/disability-registration/print/${encodeURIComponent(registrationNumber)}${params}`
}
