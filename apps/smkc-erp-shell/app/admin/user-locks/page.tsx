'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { currentUser } from '@smkc/auth'

const PAGE_SIZE = 10

// ── Types ─────────────────────────────────────────────────────────────────────

interface LockedUser {
  userId: string
  name: string | null
  status: string | null
  locked: string
  validFrom: string | null
  validTo: string | null
  lastAttempt: string | null
}

// ── Inline styles ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 10,
  border: '1px solid #e5eaf0',
  padding: '1.25rem',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
}

function btnPrimary(disabled = false): React.CSSProperties {
  return {
    padding: '0.4rem 1rem', borderRadius: 7, border: 'none',
    background: '#c0392b', color: '#fff', fontWeight: 600, fontSize: '0.82rem',
    cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.55 : 1,
  }
}

function btnSecondary(disabled = false): React.CSSProperties {
  return {
    padding: '0.4rem 1rem', borderRadius: 7, border: '1px solid #d5e1ea',
    background: '#fff', color: '#3d4f60', fontWeight: 600, fontSize: '0.82rem',
    cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1,
  }
}

const ADMIN_IDS = new Set(['ADMIN001', 'PTTEST01'])

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserLocksAdminPage() {
  const [adminId, setAdminId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [users, setUsers]       = useState<LockedUser[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const [unlocking, setUnlocking]   = useState<string | null>(null) // userId being unlocked
  const [unlockMsg, setUnlockMsg]   = useState<string | null>(null)
  const [unlockOk, setUnlockOk]     = useState(true)

  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  // ── Init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    const user = currentUser()
    if (user) {
      setAdminId(user.userId)
      setIsAdmin(ADMIN_IDS.has(user.userId.toUpperCase()))
    } else {
      setAdminId('')
    }
  }, [])

  // ── Load locked users ─────────────────────────────────────────────────────

  const loadLockedUsers = useCallback(async (aid: string) => {
    setLoading(true)
    setError(null)
    setUnlockMsg(null)
    setPage(1)
    try {
      const res = await fetch(`/api/admin/locked-users?adminUserId=${encodeURIComponent(aid)}`)
      const json = await res.json() as { success: boolean; message?: string; data?: LockedUser[] }
      if (!json.success) throw new Error(json.message ?? 'Failed to load locked users')
      setUsers(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin && adminId) loadLockedUsers(adminId)
  }, [isAdmin, adminId, loadLockedUsers])

  // ── Unlock action ─────────────────────────────────────────────────────────

  const handleUnlock = async (targetUserId: string) => {
    if (!adminId) return
    setUnlocking(targetUserId)
    setUnlockMsg(null)
    try {
      const res = await fetch('/api/admin/unlock-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: adminId, targetUserId }),
      })
      const json = await res.json() as { success: boolean; message?: string }
      setUnlockOk(json.success)
      setUnlockMsg(json.message ?? (json.success ? 'User unlocked.' : 'Failed to unlock.'))
      if (json.success) {
        // Remove from list immediately for instant feedback
        setUsers((prev) => prev.filter((u) => u.userId !== targetUserId))
        setPage(1)
      }
    } catch {
      setUnlockOk(false)
      setUnlockMsg('Service unavailable. Please try again.')
    } finally {
      setUnlocking(null)
    }
  }

  // ── Filtered + paginated list ─────────────────────────────────────────────

  const filtered = useMemo(() => users.filter((u) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      u.userId.toLowerCase().includes(q) ||
      (u.name ?? '').toLowerCase().includes(q)
    )
  }), [users, search])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage    = Math.min(page, totalPages)
  const paginated   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1) }, [search])

  // ── Render ────────────────────────────────────────────────────────────────

  if (adminId === '') {
    return (
      <div style={{ padding: '2rem', color: '#c0392b', fontWeight: 600 }}>
        Please log in to access this page.
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '2rem', color: '#c0392b', fontWeight: 600 }}>
        <i className="bi bi-shield-exclamation" style={{ marginRight: 8 }} />
        Admin access required. Only ADMIN001 can manage user locks.
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <i className="bi bi-lock-fill" style={{ fontSize: '1.4rem', color: '#c0392b' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#18324a' }}>
            User Lock Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b7e8e', marginTop: 2 }}>
            Accounts locked after 3 consecutive failed login attempts
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            style={btnSecondary(loading)}
            disabled={loading}
            onClick={() => adminId && loadLockedUsers(adminId)}
            title="Refresh list"
          >
            <i className={`bi bi-arrow-clockwise${loading ? ' spin' : ''}`} style={{ marginRight: 4 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status message */}
      {unlockMsg && (
        <div style={{
          marginBottom: '1rem', padding: '0.65rem 1rem', borderRadius: 7,
          background: unlockOk ? '#e8f5e9' : '#fdecea',
          color: unlockOk ? '#2E7D32' : '#c0392b',
          border: `1px solid ${unlockOk ? '#c8e6c9' : '#f5c6cb'}`,
          fontSize: '0.88rem', fontWeight: 500,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <i className={`bi ${unlockOk ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`} />
          {unlockMsg}
        </div>
      )}

      {/* Main card */}
      <div style={card}>

        {/* Search + count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <i className="bi bi-search" style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: '#8fa9be', fontSize: '0.85rem', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Search by user ID or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 30px', borderRadius: 7,
                border: '1.5px solid #d5e1ea', fontSize: '0.85rem', color: '#18324a',
                outline: 'none', background: '#fff', fontFamily: 'inherit',
              }}
            />
          </div>
          {!loading && (
            <span style={{ fontSize: '0.82rem', color: '#6b7e8e', whiteSpace: 'nowrap' }}>
              {filtered.length === 0
                ? (users.length > 0 ? 'No results match search' : 'No locked accounts')
                : `${filtered.length} locked account${filtered.length === 1 ? '' : 's'}`}
            </span>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '0.6rem 1rem', borderRadius: 7, background: '#fdecea',
            color: '#c0392b', border: '1px solid #f5c6cb', fontSize: '0.85rem', marginBottom: '1rem',
          }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }} />
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#6b7e8e', fontSize: '0.9rem' }}>
            <i className="bi bi-hourglass-split" style={{ marginRight: 8 }} />
            Loading locked accounts…
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '3rem 1rem', color: '#6b7e8e',
          }}>
            {search.trim() ? (
              <>
                <i className="bi bi-search" style={{ fontSize: '2rem', display: 'block', marginBottom: 8, color: '#aab8c2' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#3d4f60' }}>No accounts match &quot;{search.trim()}&quot;</div>
                <div style={{ fontSize: '0.82rem', marginTop: 4 }}>Try a different user ID or name.</div>
              </>
            ) : (
              <>
                <i className="bi bi-shield-check" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10, color: '#2E7D32' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#2E7D32' }}>All clear — no locked accounts</div>
                <div style={{ fontSize: '0.83rem', marginTop: 6, color: '#6b7e8e', maxWidth: 380, margin: '6px auto 0' }}>
                  No user accounts are currently locked. Accounts get locked after 3 consecutive failed login attempts.
                </div>
              </>
            )}
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5eaf0' }}>
                  {['#', 'User ID', 'Name', 'Status', 'Valid From', 'Valid To', 'Last Failed Attempt', 'Action'].map((h) => (
                    <th key={h} style={{
                      padding: '0.5rem 0.75rem', textAlign: 'left',
                      color: '#6b7e8e', fontWeight: 600, whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((u, idx) => (
                  <tr
                    key={u.userId}
                    style={{ borderBottom: '1px solid #f0f4f8' }}
                  >
                    <td style={{ padding: '0.6rem 0.75rem', color: '#aab8c2', fontSize: '0.78rem' }}>
                      {(safePage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#18324a' }}>
                      {u.userId}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#3d4f60' }}>
                      {u.name ?? <span style={{ color: '#aab8c2' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                        background: u.status === 'A' ? '#e8f5e9' : '#fdecea',
                        color: u.status === 'A' ? '#2E7D32' : '#c0392b',
                      }}>
                        {u.status === 'A' ? 'Active' : (u.status ?? 'Unknown')}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7e8e', whiteSpace: 'nowrap' }}>
                      {u.validFrom ?? '—'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7e8e', whiteSpace: 'nowrap' }}>
                      {u.validTo ?? '—'}
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem', color: '#6b7e8e', whiteSpace: 'nowrap' }}>
                      {u.lastAttempt
                        ? <><i className="bi bi-clock-history" style={{ marginRight: 4, color: '#c0392b' }} />{u.lastAttempt}</>
                        : '—'
                      }
                    </td>
                    <td style={{ padding: '0.6rem 0.75rem' }}>
                      <button
                        style={btnPrimary(unlocking === u.userId)}
                        disabled={unlocking === u.userId}
                        onClick={() => handleUnlock(u.userId)}
                        title={`Unlock ${u.userId}`}
                      >
                        {unlocking === u.userId
                          ? <><i className="bi bi-hourglass-split" style={{ marginRight: 4 }} />Unlocking…</>
                          : <><i className="bi bi-unlock-fill" style={{ marginRight: 4 }} />Unlock</>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f0f4f8',
            }}>
              <span style={{ fontSize: '0.8rem', color: '#6b7e8e' }}>
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  style={btnSecondary(safePage === 1)}
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <i className="bi bi-chevron-left" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '0.4rem 0.7rem', borderRadius: 7, border: '1px solid',
                      borderColor: p === safePage ? '#c0392b' : '#d5e1ea',
                      background: p === safePage ? '#c0392b' : '#fff',
                      color: p === safePage ? '#fff' : '#3d4f60',
                      fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                    }}
                    aria-current={p === safePage ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  style={btnSecondary(safePage === totalPages)}
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

      {/* Info note */}
      <p style={{ marginTop: '1rem', fontSize: '0.78rem', color: '#8fa9be' }}>
        <i className="bi bi-info-circle" style={{ marginRight: 4 }} />
        Accounts are locked automatically after 3 consecutive failed login attempts. Unlocking clears the failure history for the last 24 hours.
      </p>

    </div>
  )
}
