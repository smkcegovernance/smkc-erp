import type { Session, User, UserRole } from '@smkc/types'

const SESSION_KEY = 'smkc_session'

const USER_ID_PATTERN = /^[A-Za-z0-9]{8}$/

export function isValidMockUserId(userId: string): boolean {
  return USER_ID_PATTERN.test(userId.trim())
}

/**
 * Assigns a role based on user-ID prefix for mock/demo purposes.
 * Prefix rules (case-insensitive):
 *   COMM → commissioner  (e.g. COMM0001)
 *   HOD  → hod           (e.g. HOD10001)
 *   ACCT → account       (e.g. ACCT0001)
 *   BANK → bank          (e.g. BANK0001)
 *   *    → operator      (any other 8-char ID)
 */
function deriveRole(userId: string): UserRole {
  const p = userId.toUpperCase()
  if (p.startsWith('COMM')) return 'commissioner'
  if (p.startsWith('HOD'))  return 'hod'
  if (p.startsWith('ACCT')) return 'account'
  if (p.startsWith('BANK')) return 'bank'
  return 'operator'
}

export function createMockSession(userId: string, password: string): Session | null {
  const normalizedUserId = userId.trim()
  if (!isValidMockUserId(normalizedUserId) || password.trim().length === 0) {
    return null
  }

  const role = deriveRole(normalizedUserId)

  const user: User = {
    userId: normalizedUserId,
    name: `SMKC User ${normalizedUserId}`,
    role,
    roleId: 0,
    status: 'active',
  }

  const now = Date.now()

  return {
    user,
    token: `mock-${normalizedUserId}-${now}`,
    expiresAt: new Date(now + 8 * 60 * 60 * 1000).toISOString(),
  }
}

export function saveSession(session: Session): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }
}

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY)
  }
}

export function isAuthenticated(): boolean {
  const session = getSession()
  if (!session) return false
  return new Date(session.expiresAt) > new Date()
}

export function currentUser(): User | null {
  return getSession()?.user ?? null
}
