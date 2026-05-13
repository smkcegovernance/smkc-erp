import type { Session, User, UserRole } from '@smkc/types'

const SESSION_KEY = 'smkc_session'

const USER_ID_PATTERN = /^[A-Za-z0-9]{1,8}$/

export function isValidErpUserId(userId: string): boolean {
  return USER_ID_PATTERN.test(userId.trim())
}

/** @deprecated kept for backward compatibility — use loginWithServer instead */
export function isValidMockUserId(userId: string): boolean {
  return isValidErpUserId(userId)
}

/**
 * Assigns a role based on user-ID prefix for mock/demo purposes.
 * Prefix rules (case-insensitive):
 *   COMM → commissioner  (e.g. COMM0001)
 *   HOD  → hod           (e.g. HOD10001)
 *   ACCT → account       (e.g. ACCT0001)
 *   BANK → bank          (e.g. BANK0001)
 *   *    → operator      (any other ID)
 */
function deriveRole(userId: string): UserRole {
  const p = userId.toUpperCase()
  if (p.startsWith('COMM')) return 'commissioner'
  if (p.startsWith('HOD'))  return 'hod'
  if (p.startsWith('ACCT')) return 'account'
  if (p.startsWith('BANK')) return 'bank'
  return 'operator'
}

/** @deprecated kept for tests only — real login goes through loginWithServer */
export function createMockSession(userId: string, password: string): Session | null {
  const normalizedUserId = userId.trim()
  if (!isValidErpUserId(normalizedUserId) || password.trim().length === 0) {
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

export interface LoginResult {
  success: boolean
  message: string
  session: Session | null
}

/**
 * Authenticates against ULBERP.USERDET via the ERP auth API route.
 * Validates USER_VIFLAG, USER_LOCK, USER_FROM/USER_TO, and BASE64 password.
 */
export async function loginWithServer(userId: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch('/api/erp-auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: userId.trim().toUpperCase(), password: password.trim() }),
      cache: 'no-store',
    })

    const json = await res.json() as {
      success: boolean
      message?: string
      data?: {
        userId: string
        name: string
        status: string
        validFrom?: string
        validTo?: string
        roleId: number
        role: string
      } | null
    }

    if (!json.success || !json.data) {
      return { success: false, message: json.message ?? 'Login failed', session: null }
    }

    const d = json.data
    const role = (d.role ?? 'operator') as UserRole

    const user: User = {
      userId:   d.userId,
      name:     d.name ?? d.userId,
      role,
      roleId:   d.roleId ?? 0,
      status:   d.status ?? 'A',
    }

    const now = Date.now()
    const session: Session = {
      user,
      token:     `erp-${d.userId}-${now}`,
      expiresAt: new Date(now + 8 * 60 * 60 * 1000).toISOString(),
    }

    return { success: true, message: 'Login successful', session }
  } catch {
    return { success: false, message: 'Login service unavailable. Please check network.', session: null }
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

