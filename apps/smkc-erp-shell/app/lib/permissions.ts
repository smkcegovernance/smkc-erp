'use client'

import { useState, useEffect, useRef } from 'react'
import { DEPT_MENUS } from './dept-menus'

// ── Types ────────────────────────────────────────────────────────────────────

export interface DeptRightsItem {
  deptKey: string
  menuItems: string[]
}

export interface UserPermissions {
  userId: string
  isAdmin: boolean
  hasCustomRights: boolean
  deptCode: string | null
  deptName: string | null
  /** Lookup: deptKey → allowed menuItemKeys */
  rights: Record<string, string[]>
}

// ── Storage key ───────────────────────────────────────────────────────────────

const PERM_KEY = 'smkc_permissions'
const PERM_USER_KEY = 'smkc_permissions_user'

// ── sessionStorage cache ─────────────────────────────────────────────────────

export function savePermissions(perms: UserPermissions): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(PERM_KEY, JSON.stringify(perms))
  sessionStorage.setItem(PERM_USER_KEY, perms.userId)
}

export function getCachedPermissions(userId?: string): UserPermissions | null {
  if (typeof window === 'undefined') return null
  const cachedFor = sessionStorage.getItem(PERM_USER_KEY)
  if (userId && cachedFor !== userId) return null   // stale
  const raw = sessionStorage.getItem(PERM_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserPermissions
  } catch {
    return null
  }
}

export function clearPermissions(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(PERM_KEY)
  sessionStorage.removeItem(PERM_USER_KEY)
}

// ── Default rights (applied when user has no DB rows) ────────────────────────

/**
 * Every ERP user gets at least GAD access by default.
 * Accounts and Audit users additionally get their dept menus (seeded separately).
 */
function getDefaultRights(): Record<string, string[]> {
  const gadGroups = DEPT_MENUS['general-administration'] ?? []
  const gadItems  = gadGroups.flatMap((g) => g.items.map((i) => i.key))
  return gadItems.length > 0 ? { 'general-administration': gadItems } : {}
}

// ── Fetch from backend ────────────────────────────────────────────────────────

export async function fetchPermissions(userId: string): Promise<UserPermissions> {
  const res = await fetch(`/api/user-rights/for-user?userId=${encodeURIComponent(userId)}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch permissions (HTTP ${res.status})`)
  }

  const json = await res.json() as {
    success: boolean
    data?: {
      userId: string
      isAdmin: boolean
      hasCustomRights: boolean
      deptCode: string | null
      deptName: string | null
      rights: DeptRightsItem[]
    }
  }

  if (!json.success || !json.data) {
    throw new Error('Permission fetch failed')
  }

  const d = json.data
  const rightsMap: Record<string, string[]> = {}
  for (const item of d.rights ?? []) {
    rightsMap[item.deptKey] = item.menuItems
  }

  // If user has no custom rights in DB, grant default GAD access so they see something
  const effectiveRights = (d.isAdmin || d.hasCustomRights)
    ? rightsMap
    : { ...getDefaultRights(), ...rightsMap }

  return {
    userId:          d.userId,
    isAdmin:         d.isAdmin,
    hasCustomRights: d.hasCustomRights,
    deptCode:        d.deptCode ?? null,
    deptName:        d.deptName ?? null,
    rights:          effectiveRights,
  }
}

// ── Access helpers ────────────────────────────────────────────────────────────

/** Returns true if the user is allowed to see a specific menu item in a dept. */
export function hasMenuAccess(
  perms: UserPermissions | null,
  deptKey: string,
  menuItemKey: string,
): boolean {
  if (!perms) return false
  if (perms.isAdmin) return true
  const allowed = perms.rights[deptKey]
  if (!allowed) return false
  // Backward compatibility: allow the new Accounts report menu for users who
  // already have any Accounts rights, even if this specific key is not yet
  // present in older ERP_USER_RIGHTS rows.
  if (
    deptKey === 'accounts' &&
    (
      menuItemKey === 'budget-liability-report' ||
      menuItemKey === 'fund-wise-budget-liability-report' ||
      menuItemKey === 'ward-wise-expenditure-report' ||
      menuItemKey === 'bill-payment-report'
    ) &&
    Array.isArray(allowed) &&
    allowed.length > 0
  ) {
    return true
  }
  return allowed.includes(menuItemKey)
}

/** Returns true if the user has access to at least one menu item in the dept. */
export function hasDeptAccess(
  perms: UserPermissions | null,
  deptKey: string,
): boolean {
  if (!perms) return false
  if (perms.isAdmin) return true
  const allowed = perms.rights[deptKey]
  return Array.isArray(allowed) && allowed.length > 0
}

// ── React hook ────────────────────────────────────────────────────────────────

/**
 * Returns the current user's permissions.
 * Reads from sessionStorage cache first; falls back to API fetch.
 * While loading, `permissions` is `null` and `loading` is `true`.
 */
export function usePermissions(): { permissions: UserPermissions | null; loading: boolean } {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading]         = useState(true)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    // Read current user from session
    let userId: string | null = null
    try {
      const raw = localStorage.getItem('smkc_session')
      if (raw) {
        const session = JSON.parse(raw) as { user?: { userId?: string } }
        userId = session?.user?.userId ?? null
      }
    } catch { /* ignore */ }

    if (!userId) {
      setLoading(false)
      return
    }

    // Try cache first
    const cached = getCachedPermissions(userId)
    if (cached) {
      setPermissions(cached)
      setLoading(false)
      return
    }

    // Fetch from API
    fetchPermissions(userId)
      .then((perms) => {
        savePermissions(perms)
        setPermissions(perms)
      })
      .catch(() => {
        // On fetch error, fall back to default GAD-only access so the app is still usable
        const fallback: UserPermissions = {
          userId,
          isAdmin:         false,
          hasCustomRights: false,
          deptCode:        null,
          deptName:        null,
          rights:          getDefaultRights(),
        }
        setPermissions(fallback)
      })
      .finally(() => setLoading(false))
  }, [])

  return { permissions, loading }
}
