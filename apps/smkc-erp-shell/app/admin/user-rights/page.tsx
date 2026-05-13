'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { currentUser } from '@smkc/auth'
import { DEPT_MENUS } from '../../lib/dept-menus'
import { DEPARTMENTS } from '@smkc/types'
import { clearPermissions } from '../../lib/permissions'
import { useLanguage } from '../../lib/i18n/LanguageContext'
import { useDepts } from '../../lib/DeptContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ErpUser {
  userId: string
  name: string
  deptCode: string | null
  deptName: string | null
  hasRights: boolean
}

interface DeptRightsItem {
  deptKey: string
  menuItems: string[]
}

interface UserRightsData {
  userId: string
  isAdmin: boolean
  hasCustomRights: boolean
  deptCode: string | null
  deptName: string | null
  rights: Record<string, string[]>
}

const ADMIN_IDS = new Set(['ADMIN001', 'PTTEST01'])

const ALL_DEPT_ITEMS = Object.entries(DEPT_MENUS)
  .filter(([, groups]) => groups.length > 0)
  .map(([deptKey, groups]) => ({
    deptKey,
    deptLabel: DEPARTMENTS.find((d) => d.key === deptKey)?.label ?? deptKey,
    groups: groups.map((g) => ({
      groupKey: g.key,
      groupLabel: g.label,
      groupIcon: g.icon,
      items: g.items.map((i) => ({ key: i.key, label: i.label })),
    })),
  }))

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
    padding: '0.45rem 1.1rem', borderRadius: 7, border: 'none',
    background: '#c0392b', color: '#fff', fontWeight: 600, fontSize: '0.85rem',
    cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1,
  }
}

function btnSecondary(disabled = false): React.CSSProperties {
  return {
    padding: '0.45rem 1.1rem', borderRadius: 7, border: '1px solid #d5e1ea',
    background: '#fff', color: '#3d4f60', fontWeight: 600, fontSize: '0.85rem',
    cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.6 : 1,
  }
}

function btnGreen(disabled = false): React.CSSProperties {
  return {
    padding: '0.5rem 1.2rem', borderRadius: 7, border: 'none',
    background: '#2E7D32', color: '#fff', fontWeight: 600, fontSize: '0.88rem',
    cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1,
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 7,
  border: '1.5px solid #d5e1ea', fontSize: '0.88rem', color: '#18324a',
  outline: 'none', background: '#fff', fontFamily: 'inherit',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserRightsAdminPage() {
  const [adminId, setAdminId]   = useState<string | null>(null)
  const [isAdmin, setIsAdmin]   = useState(false)

  const [users, setUsers]               = useState<ErpUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError]     = useState<string | null>(null)

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userRights, setUserRights]         = useState<UserRightsData | null>(null)
  const [rightsLoading, setRightsLoading]   = useState(false)
  const [rightsError, setRightsError]       = useState<string | null>(null)

  const [editRights, setEditRights] = useState<Record<string, Set<string>>>({})
  const [saving, setSaving]         = useState(false)
  const [saveMsg, setSaveMsg]       = useState<string | null>(null)
  const [saveMsgOk, setSaveMsgOk]   = useState(true)

  const [seedDeptKey, setSeedDeptKey] = useState('')
  const [seedUserIds, setSeedUserIds] = useState<string[]>([])
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedMsg, setSeedMsg]         = useState<string | null>(null)
  const [seedMsgOk, setSeedMsgOk]     = useState(true)

  const [sdLoading, setSdLoading] = useState(false)
  const [sdMsg, setSdMsg]         = useState<string | null>(null)
  const [sdMsgOk, setSdMsgOk]     = useState(true)

  const [search, setSearch] = useState('')
  const [menuSearch, setMenuSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string[]>([])
  const [deptDropdownOpen, setDeptDropdownOpen] = useState(false)
  const [deptDropdownSearch, setDeptDropdownSearch] = useState('')
  const deptDropdownRef = useRef<HTMLDivElement>(null)

  const { T, tMenu, lang } = useLanguage()
  const { depts: dbDepts, getDept } = useDepts()

  // Translated labels — recompute when language or DB depts change
  const translatedDeptItems = useMemo(() =>
    ALL_DEPT_ITEMS.map((dept) => {
      const dbDept = getDept(dept.deptKey)
      const deptLabel = lang === 'mr'
        ? (dbDept?.nameMr || dbDept?.nameEn || T.depts[dept.deptKey]?.label || dept.deptLabel)
        : (dbDept?.nameEn || T.depts[dept.deptKey]?.label || dept.deptLabel)
      return {
        ...dept,
        deptLabel,
        groups: dept.groups.map((g) => ({
          ...g,
          groupLabel: (T.groups as Record<string, string>)[g.groupKey] ?? g.groupLabel,
          items: g.items.map((i) => ({
            ...i,
            label: tMenu(dept.deptKey, i.key, i.label),
          })),
        })),
      }
    }),
    [T, tMenu, lang, dbDepts, getDept]
  )

  // Filtered items for the rights editor (by dept dropdown + text search)
  const visibleDeptItems = useMemo(() => {
    let items = translatedDeptItems
    if (deptFilter.length > 0) items = items.filter((d) => deptFilter.includes(d.deptKey))
    const q = menuSearch.trim().toLowerCase()
    if (q) {
      items = items
        .map((dept) => {
          if (dept.deptLabel.toLowerCase().includes(q)) return dept
          const filteredGroups = dept.groups
            .map((g) => {
              if (g.groupLabel.toLowerCase().includes(q)) return g
              const filteredItems = g.items.filter((i) => i.label.toLowerCase().includes(q))
              return filteredItems.length > 0 ? { ...g, items: filteredItems } : null
            })
            .filter((g): g is NonNullable<typeof g> => g !== null)
          return filteredGroups.length > 0 ? { ...dept, groups: filteredGroups } : null
        })
        .filter((d): d is NonNullable<typeof d> => d !== null)
    }
    return items
  }, [translatedDeptItems, deptFilter, menuSearch])

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

  // ── Load users ────────────────────────────────────────────────────────────

  const loadUsers = useCallback(async (aid: string) => {
    setUsersLoading(true)
    setUsersError(null)
    try {
      const res = await fetch(`/api/user-rights/all-users?adminUserId=${encodeURIComponent(aid)}`)
      const json = await res.json() as { success: boolean; message?: string; data?: ErpUser[] }
      if (!json.success) throw new Error(json.message ?? 'Failed to load users')
      setUsers(json.data ?? [])
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : String(err))
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin && adminId) loadUsers(adminId)
  }, [isAdmin, adminId, loadUsers])

  // Close dept dropdown on outside click
  useEffect(() => {
    if (!deptDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(e.target as Node)) {
        setDeptDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [deptDropdownOpen])

  // ── Load rights ───────────────────────────────────────────────────────────

  const loadRights = useCallback(async (userId: string) => {
    setRightsLoading(true)
    setRightsError(null)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/user-rights/for-user?userId=${encodeURIComponent(userId)}`)
      const json = await res.json() as {
        success: boolean
        message?: string
        data?: {
          userId: string; isAdmin: boolean; hasCustomRights: boolean
          deptCode: string | null; deptName: string | null; rights: DeptRightsItem[]
        }
      }
      if (!json.success || !json.data) throw new Error(json.message ?? 'Failed to load rights')
      const d = json.data
      const rightsMap: Record<string, string[]> = {}
      for (const r of d.rights ?? []) rightsMap[r.deptKey] = r.menuItems
      setUserRights({ ...d, rights: rightsMap })
      const edit: Record<string, Set<string>> = {}
      for (const r of d.rights ?? []) edit[r.deptKey] = new Set(r.menuItems)
      setEditRights(edit)
    } catch (err) {
      setUserRights(null)
      setEditRights({})
      setRightsError(err instanceof Error ? err.message : 'Failed to load rights')
    } finally {
      setRightsLoading(false)
    }
  }, [])

  const selectUser = (userId: string) => {
    setSelectedUserId(userId)
    setMenuSearch('')
    setDeptFilter([])
    setDeptDropdownOpen(false)
    setDeptDropdownSearch('')
    loadRights(userId)
  }

  // ── Toggle helpers ────────────────────────────────────────────────────────

  const toggleItem = (deptKey: string, itemKey: string) => {
    setEditRights((prev) => {
      const next = { ...prev }
      const set = new Set(next[deptKey] ?? [])
      if (set.has(itemKey)) set.delete(itemKey)
      else set.add(itemKey)
      next[deptKey] = set
      return next
    })
  }

  const toggleAllDept = (deptKey: string, allKeys: string[], checked: boolean) => {
    setEditRights((prev) => {
      const next = { ...prev }
      next[deptKey] = checked ? new Set(allKeys) : new Set()
      return next
    })
  }

  const toggleGroup = (deptKey: string, groupKeys: string[], checked: boolean) => {
    setEditRights((prev) => {
      const next = { ...prev }
      const set = new Set(next[deptKey] ?? [])
      groupKeys.forEach((k) => checked ? set.add(k) : set.delete(k))
      next[deptKey] = set
      return next
    })
  }

  // ── Save rights ───────────────────────────────────────────────────────────

  const saveRights = async () => {
    if (!selectedUserId || !adminId) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const rights: DeptRightsItem[] = Object.entries(editRights)
        .map(([deptKey, set]) => ({ deptKey, menuItems: [...set] }))
        .filter((r) => r.menuItems.length > 0)
      const res = await fetch('/api/user-rights/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, adminUserId: adminId, rights }),
      })
      const json = await res.json() as { success: boolean; message?: string }
      setSaveMsg(json.message ?? (json.success ? 'Rights saved successfully.' : 'Save failed.'))
      setSaveMsgOk(json.success)
      if (json.success) {
        loadUsers(adminId)
        loadRights(selectedUserId)
        const user = currentUser()
        if (user?.userId === selectedUserId) clearPermissions()
      }
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Save failed')
      setSaveMsgOk(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Clear all rights ──────────────────────────────────────────────────────

  const clearRights = async () => {
    if (!selectedUserId || !adminId) return
    if (!confirm(`Clear ALL rights for ${selectedUserId}?`)) return
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(
        `/api/user-rights/clear?userId=${encodeURIComponent(selectedUserId)}&adminUserId=${encodeURIComponent(adminId)}`,
        { method: 'DELETE' }
      )
      const json = await res.json() as { success: boolean; message?: string }
      setSaveMsg(json.message ?? (json.success ? 'Rights cleared.' : 'Clear failed.'))
      setSaveMsgOk(json.success)
      if (json.success) {
        loadUsers(adminId)
        loadRights(selectedUserId)
        const user = currentUser()
        if (user?.userId === selectedUserId) clearPermissions()
      }
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : 'Clear failed')
      setSaveMsgOk(false)
    } finally {
      setSaving(false)
    }
  }

  // ── Bulk seed ─────────────────────────────────────────────────────────────

  const runBulkSeed = async () => {
    if (!adminId || !seedDeptKey || seedUserIds.length === 0) return
    const deptEntry = translatedDeptItems.find((d) => d.deptKey === seedDeptKey)
    if (!deptEntry) return
    const menuItems = deptEntry.groups.flatMap((g) => g.items.map((i) => i.key))
    if (menuItems.length === 0) return
    setSeedLoading(true)
    setSeedMsg(null)
    try {
      const res = await fetch('/api/user-rights/bulk-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId: adminId, deptKey: seedDeptKey, userIds: seedUserIds, menuItems }),
      })
      const json = await res.json() as { success: boolean; message?: string }
      setSeedMsg(json.message ?? (json.success ? 'Done.' : 'Failed.'))
      setSeedMsgOk(json.success)
      if (json.success) {
        loadUsers(adminId)
        if (selectedUserId && seedUserIds.includes(selectedUserId)) loadRights(selectedUserId)
      }
    } catch (err) {
      setSeedMsg(err instanceof Error ? err.message : 'Bulk seed failed')
      setSeedMsgOk(false)
    } finally {
      setSeedLoading(false)
    }
  }

  const toggleSeedUser = (uid: string) =>
    setSeedUserIds((prev) => prev.includes(uid) ? prev.filter((u) => u !== uid) : [...prev, uid])

  // ── Seed defaults ─────────────────────────────────────────────────────────

  const runSeedDefaults = async () => {
    if (!adminId) return
    setSdLoading(true)
    setSdMsg(null)
    try {
      const res = await fetch(`/api/user-rights/seed-defaults?adminUserId=${encodeURIComponent(adminId)}`, {
        method: 'POST',
      })
      const json = await res.json() as { success: boolean; message?: string }
      setSdMsg(json.message ?? (json.success ? 'Done.' : 'Failed.'))
      setSdMsgOk(json.success)
      if (json.success) loadUsers(adminId)
    } catch (err) {
      setSdMsg(err instanceof Error ? err.message : 'Seed defaults failed')
      setSdMsgOk(false)
    } finally {
      setSdLoading(false)
    }
  }

  // ── Filter ────────────────────────────────────────────────────────────────

  const filteredUsers = users.filter((u) =>
    search === '' ||
    u.userId.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.deptName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // ── Guard ─────────────────────────────────────────────────────────────────

  if (adminId === null) return null   // still reading session

  if (!isAdmin) {
    return (
      <main className="erp-main">
        <div className="erp-page-header">
          <h1 className="erp-page-title">Access Denied</h1>
          <p className="erp-page-subtitle">Only ADMIN001 and PTTEST01 can access this page.</p>
        </div>
      </main>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="erp-main">

      {/* Page header */}
      <div className="erp-page-header">
        <div className="erp-page-header-text">
          <p className="erp-page-kicker">प्रशासन</p>
          <h1 className="erp-page-title">वापरकर्ता अधिकार व्यवस्थापन</h1>
          <p className="erp-page-subtitle">
            User Access Rights Management — assign department/menu access to ERP users
          </p>
        </div>
      </div>

      {/* Initial setup banner */}
      <div style={{ ...card, marginBottom: '1.5rem', background: '#E8F5E9', border: '1px solid #A5D6A7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: '0.95rem', margin: '0 0 0.3rem', color: '#1B5E20', fontWeight: 700 }}>
              <i className="bi bi-rocket-takeoff-fill" style={{ marginRight: 6 }} />
              Initial Setup — Seed Default Access
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#2E7D32', margin: 0, lineHeight: 1.5 }}>
              Grants <strong>General Administration</strong> menus to ALL active users.
              Additionally grants full <strong>Accounts</strong> department access to dept&nbsp;524 users
              and <strong>Audit</strong> access to dept&nbsp;526 users.
              Already-existing rights are never overwritten.
            </p>
          </div>
          <button type="button" style={btnGreen(sdLoading)} onClick={runSeedDefaults} disabled={sdLoading}>
            {sdLoading ? 'Seeding…' : 'Seed Initial Access'}
          </button>
        </div>
        {sdMsg && (
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.82rem', padding: '0.35rem 0.6rem', borderRadius: 6, background: sdMsgOk ? '#C8E6C9' : '#FFCDD2', color: sdMsgOk ? '#1B5E20' : '#B71C1C' }}>
            {sdMsg}
          </p>
        )}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 300px) 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* LEFT: User list */}
        <div style={card}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <strong style={{ flex: 1, fontSize: '0.9rem' }}>
              ERP Users {usersLoading ? '(…)' : `(${filteredUsers.length})`}
            </strong>
            <button
              type="button"
              style={{ ...btnSecondary(usersLoading), padding: '0.3rem 0.7rem' }}
              onClick={() => adminId && loadUsers(adminId)}
              disabled={usersLoading}
              title="Refresh"
            >
              {usersLoading ? '…' : '↺'}
            </button>
          </div>

          <input
            type="search"
            placeholder="Search user / dept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, marginBottom: '0.6rem' }}
          />

          {usersError && (
            <p style={{ color: '#B71C1C', fontSize: '0.8rem', marginBottom: '0.5rem', padding: '0.4rem 0.6rem', background: '#FFEBEE', borderRadius: 6 }}>
              <i className="bi bi-exclamation-circle-fill" style={{ marginRight: 4 }} />
              {usersError}
            </p>
          )}

          {usersLoading && users.length === 0 && (
            <p style={{ color: '#888', fontSize: '0.85rem', padding: '0.5rem' }}>Loading users…</p>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 520, overflowY: 'auto' }}>
            {filteredUsers.map((u) => (
              <li key={u.userId}>
                <button
                  type="button"
                  onClick={() => selectUser(u.userId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    width: '100%', padding: '0.45rem 0.6rem', textAlign: 'left',
                    background: selectedUserId === u.userId ? '#FEF0EF' : 'transparent',
                    border: selectedUserId === u.userId ? '1px solid #F5B7B1' : '1px solid transparent',
                    borderRadius: 6, cursor: 'pointer', fontSize: '0.85rem', marginBottom: 2,
                  }}
                >
                  <span
                    title={u.hasRights ? 'Has rights configured' : 'No rights set'}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: u.hasRights ? '#2E7D32' : '#BDBDBD', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.userId}
                      {u.name && u.name !== u.userId && (
                        <span style={{ fontWeight: 400, color: '#666', marginLeft: 4 }}>— {u.name}</span>
                      )}
                    </strong>
                    {u.deptName && (
                      <span style={{ fontSize: '0.74rem', color: '#888', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.deptName}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
            {filteredUsers.length === 0 && !usersLoading && (
              <li style={{ color: '#999', fontSize: '0.85rem', padding: '0.5rem' }}>No users found.</li>
            )}
          </ul>
        </div>

        {/* RIGHT: Rights editor */}
        <div>
          {!selectedUserId ? (
            <div style={{ ...card, color: '#888', textAlign: 'center', padding: '4rem 1rem' }}>
              <i className="bi bi-arrow-left" style={{ marginRight: 6 }} />
              Select a user to manage their rights
            </div>
          ) : rightsLoading ? (
            <div style={{ ...card, textAlign: 'center', padding: '3rem', color: '#888' }}>Loading…</div>
          ) : rightsError ? (
            <div style={{ ...card, color: '#B71C1C', background: '#FFEBEE', border: '1px solid #FFCDD2' }}>
              <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }} />
              {rightsError}
              <button type="button" style={{ ...btnSecondary(), marginLeft: 12, fontSize: '0.8rem' }} onClick={() => selectedUserId && loadRights(selectedUserId)}>
                Retry
              </button>
            </div>
          ) : (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#2C3E50' }}>
                    {selectedUserId}
                    {userRights?.deptName && (
                      <span style={{ fontSize: '0.85rem', color: '#666', marginLeft: 8, fontWeight: 400 }}>
                        ({userRights.deptName})
                      </span>
                    )}
                  </h2>
                </div>

                {userRights?.isAdmin ? (
                  <span style={{ background: '#C8E6C9', color: '#1B5E20', padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                    <i className="bi bi-shield-fill-check" style={{ marginRight: 4 }} />
                    ADMIN
                  </span>
                ) : (
                  <span style={{
                    background: userRights?.hasCustomRights ? '#E3F2FD' : '#FFF3E0',
                    color: userRights?.hasCustomRights ? '#0D47A1' : '#E65100',
                    padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600,
                  }}>
                    {userRights?.hasCustomRights ? 'Custom rights set' : 'No rights configured'}
                  </span>
                )}

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" style={btnSecondary(saving)} onClick={clearRights} disabled={saving}>
                    Clear All
                  </button>
                  <button type="button" style={btnPrimary(saving)} onClick={saveRights} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Rights'}
                  </button>
                </div>
              </div>

              {saveMsg && (
                <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', padding: '0.4rem 0.75rem', borderRadius: 6, background: saveMsgOk ? '#E8F5E9' : '#FFEBEE', color: saveMsgOk ? '#1B5E20' : '#B71C1C' }}>
                  {saveMsg}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                  {/* Search + department filter toolbar */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.55rem 0.75rem', background: '#F5F8FB', borderRadius: 8, border: '1px solid #E0EAF3' }}>

                    {/* Menu text search */}
                    <div style={{ position: 'relative', flex: '0 0 200px' }}>
                      <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#8aabcc', fontSize: '0.76rem', pointerEvents: 'none' }} />
                      <input
                        type="search"
                        placeholder="Search menus…"
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        style={{ ...inputStyle, paddingLeft: 27, fontSize: '0.8rem', height: 30, padding: '4px 8px 4px 27px' }}
                      />
                    </div>

                    {/* Multi-select dept dropdown */}
                    <div ref={deptDropdownRef} style={{ position: 'relative', flex: '0 0 220px' }}>
                      {/* Trigger button */}
                      <button
                        type="button"
                        onClick={() => { setDeptDropdownOpen((o) => !o); setDeptDropdownSearch('') }}
                        style={{ width: '100%', height: 30, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 5, borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', color: '#3d4f60', textAlign: 'left' }}
                      >
                        <i className="bi bi-building" style={{ color: '#8aabcc', fontSize: '0.76rem', flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {deptFilter.length === 0
                            ? 'All departments'
                            : deptFilter.length === 1
                              ? (translatedDeptItems.find((d) => d.deptKey === deptFilter[0])?.deptLabel ?? deptFilter[0])
                              : `${deptFilter.length} departments`}
                        </span>
                        {deptFilter.length > 0 && (
                          <span
                            onClick={(e) => { e.stopPropagation(); setDeptFilter([]); setDeptDropdownOpen(false) }}
                            style={{ color: '#c0392b', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}
                            title="Clear filter"
                          >×</span>
                        )}
                        <i className={`bi bi-chevron-${deptDropdownOpen ? 'up' : 'down'}`} style={{ color: '#8aabcc', fontSize: '0.66rem', flexShrink: 0 }} />
                      </button>

                      {/* Dropdown panel */}
                      {deptDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 3, width: 260, background: '#fff', border: '1.5px solid #d5e1ea', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', padding: '0.4rem 0' }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {/* Search within dropdown */}
                          <div style={{ padding: '0 0.5rem 0.35rem' }}>
                            <input
                              autoFocus
                              type="search"
                              placeholder="Search departments…"
                              value={deptDropdownSearch}
                              onChange={(e) => setDeptDropdownSearch(e.target.value)}
                              style={{ ...inputStyle, fontSize: '0.78rem', height: 27, padding: '3px 8px' }}
                            />
                          </div>
                          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                            {/* All option */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem', borderBottom: '1px solid #f0f4f8', color: '#3d4f60', fontWeight: 600 }}>
                              <input
                                type="checkbox"
                                checked={deptFilter.length === 0}
                                onChange={() => setDeptFilter([])}
                                style={{ cursor: 'pointer', accentColor: '#c0392b' }}
                              />
                              All departments
                            </label>
                            {translatedDeptItems
                              .filter((d) => deptDropdownSearch === '' || d.deptLabel.toLowerCase().includes(deptDropdownSearch.toLowerCase()))
                              .map((d) => (
                                <label key={d.deptKey} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', cursor: 'pointer', fontSize: '0.8rem', color: '#3d4f60', background: deptFilter.includes(d.deptKey) ? '#EEF6FF' : 'transparent' }}>
                                  <input
                                    type="checkbox"
                                    checked={deptFilter.includes(d.deptKey)}
                                    onChange={() => setDeptFilter((prev) =>
                                      prev.includes(d.deptKey) ? prev.filter((k) => k !== d.deptKey) : [...prev, d.deptKey]
                                    )}
                                    style={{ cursor: 'pointer', accentColor: '#1565C0' }}
                                  />
                                  {d.deptLabel}
                                </label>
                              ))}
                          </div>
                          <div style={{ padding: '0.35rem 0.5rem 0', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setDeptDropdownOpen(false)} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: '#1565C0', cursor: 'pointer', padding: '2px 4px' }}>Done</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Active filter tags */}
                    {deptFilter.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', flex: 1 }}>
                        {deptFilter.map((key) => {
                          const label = translatedDeptItems.find((d) => d.deptKey === key)?.deptLabel ?? key
                          return (
                            <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, background: '#E3F2FD', color: '#1565C0', fontSize: '0.74rem', fontWeight: 600 }}>
                              {label}
                              <span onClick={() => setDeptFilter((prev) => prev.filter((k) => k !== key))} style={{ cursor: 'pointer', fontWeight: 700, lineHeight: 1 }}>×</span>
                            </span>
                          )
                        })}
                      </div>
                    )}

                  </div>

                  {visibleDeptItems.length === 0 && (
                    <p style={{ color: '#999', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
                      <i className="bi bi-search" style={{ marginRight: 6 }} />
                      No menus match your search.
                    </p>
                  )}

                  {visibleDeptItems.map((dept) => {
                    const allKeys = dept.groups.flatMap((g) => g.items.map((i) => i.key))
                    const currentSet = editRights[dept.deptKey] ?? new Set<string>()
                    const allChecked = allKeys.length > 0 && allKeys.every((k) => currentSet.has(k))
                    const someChecked = allKeys.some((k) => currentSet.has(k))

                    return (
                      <div key={dept.deptKey} style={{ border: '1.5px solid #D6E4F0', borderRadius: 9, overflow: 'hidden' }}>

                        {/* ── Level 1: Department ── */}
                        <div style={{ background: '#EBF3FB', padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1.5px solid #D6E4F0' }}>
                          <input
                            type="checkbox"
                            checked={allChecked}
                            ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked }}
                            onChange={(e) => toggleAllDept(dept.deptKey, allKeys, e.target.checked)}
                            id={`dept-${dept.deptKey}`}
                            style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#c0392b' }}
                          />
                          <label htmlFor={`dept-${dept.deptKey}`} style={{ fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', flex: 1, color: '#1a2940' }}>
                            <i className="bi bi-building-fill" style={{ marginRight: 6, color: '#c0392b', fontSize: '0.82rem' }} />
                            {dept.deptLabel}
                          </label>
                          <span style={{ fontSize: '0.71rem', color: '#5d7b99', background: '#D6E4F0', padding: '2px 9px', borderRadius: 10, fontWeight: 600 }}>
                            {currentSet.size} / {allKeys.length} menus
                          </span>
                        </div>

                        {/* ── Level 2: Groups ── */}
                        <div style={{ padding: '0.55rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {dept.groups.map((group) => {
                            const groupKeys = group.items.map((i) => i.key)
                            const grpAll  = groupKeys.length > 0 && groupKeys.every((k) => currentSet.has(k))
                            const grpSome = groupKeys.some((k) => currentSet.has(k))

                            return (
                              <div key={group.groupKey} style={{ border: '1px solid #E0EAF3', borderRadius: 7, overflow: 'hidden' }}>

                                {/* Group header */}
                                <div style={{ background: '#F5F8FB', padding: '0.38rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid #E0EAF3' }}>
                                  <input
                                    type="checkbox"
                                    checked={grpAll}
                                    ref={(el) => { if (el) el.indeterminate = !grpAll && grpSome }}
                                    onChange={(e) => toggleGroup(dept.deptKey, groupKeys, e.target.checked)}
                                    id={`grp-${dept.deptKey}-${group.groupKey}`}
                                    style={{ cursor: 'pointer', accentColor: '#1565C0' }}
                                  />
                                  <label htmlFor={`grp-${dept.deptKey}-${group.groupKey}`} style={{ fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', flex: 1, color: '#2C4F70' }}>
                                    <i className={`bi ${group.groupIcon}`} style={{ marginRight: 5, fontSize: '0.77rem', color: '#5d7b99' }} />
                                    {group.groupLabel}
                                  </label>
                                  <span style={{ fontSize: '0.7rem', color: '#8aabcc' }}>
                                    {groupKeys.filter((k) => currentSet.has(k)).length}/{groupKeys.length}
                                  </span>
                                </div>

                                {/* ── Level 3: Menu Items ── */}
                                <div style={{ padding: '0.45rem 0.75rem 0.45rem 2.2rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem 1.5rem', background: '#fff' }}>
                                  {group.items.map((item) => (
                                    <label
                                      key={item.key}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', cursor: 'pointer', minWidth: 210, padding: '2px 0' }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={currentSet.has(item.key)}
                                        onChange={() => toggleItem(dept.deptKey, item.key)}
                                        style={{ cursor: 'pointer', accentColor: '#2E7D32' }}
                                      />
                                      {item.label}
                                    </label>
                                  ))}
                                </div>

                              </div>
                            )
                          })}
                        </div>

                      </div>
                    )
                  })}
                </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Assign */}
      <div style={{ ...card, marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', color: '#2C3E50' }}>
          Bulk Assign Department Access
        </h2>
        <p style={{ fontSize: '0.83rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>
          Select a department and users, then grant all menu items of that department to those users at once.
          Existing rights for other departments are preserved.
        </p>

        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 220 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 5, color: '#3d4f60' }}>Department</label>
            <select
              value={seedDeptKey}
              onChange={(e) => { setSeedDeptKey(e.target.value); setSeedUserIds([]) }}
              style={{ ...inputStyle, width: 'auto', minWidth: 220 }}
            >
              <option value="">— select department —</option>
              {translatedDeptItems.map((d) => (
                <option key={d.deptKey} value={d.deptKey}>{d.deptLabel}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 260 }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: 5, color: '#3d4f60' }}>
              Select Users ({seedUserIds.length} selected)
            </label>
            <div style={{ maxHeight: 180, overflowY: 'auto', border: '1.5px solid #d5e1ea', borderRadius: 7, padding: '0.4rem 0.6rem', background: '#fff' }}>
              {users.filter((u) => !ADMIN_IDS.has(u.userId.toUpperCase())).map((u) => (
                <label key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.83rem', padding: '3px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={seedUserIds.includes(u.userId)} onChange={() => toggleSeedUser(u.userId)} style={{ cursor: 'pointer' }} />
                  <strong>{u.userId}</strong>
                  {u.deptName && <span style={{ color: '#888' }}>— {u.deptName}</span>}
                </label>
              ))}
              {users.length === 0 && <span style={{ color: '#999', fontSize: '0.8rem' }}>No users loaded.</span>}
            </div>
            <div style={{ marginTop: 5, display: 'flex', gap: '0.75rem' }}>
              <button type="button" style={{ fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#1565C0', textDecoration: 'underline', padding: 0 }}
                onClick={() => setSeedUserIds(users.filter((u) => !ADMIN_IDS.has(u.userId.toUpperCase())).map((u) => u.userId))}>
                Select All
              </button>
              <button type="button" style={{ fontSize: '0.75rem', cursor: 'pointer', background: 'none', border: 'none', color: '#1565C0', textDecoration: 'underline', padding: 0 }}
                onClick={() => setSeedUserIds([])}>
                Clear
              </button>
            </div>
          </div>

          <div style={{ alignSelf: 'flex-end', paddingBottom: 2 }}>
            <button
              type="button"
              style={btnPrimary(seedLoading || !seedDeptKey || seedUserIds.length === 0)}
              onClick={runBulkSeed}
              disabled={seedLoading || !seedDeptKey || seedUserIds.length === 0}
            >
              {seedLoading ? 'Assigning…' : 'Assign Access'}
            </button>
          </div>
        </div>

        {seedMsg && (
          <p style={{ marginTop: '0.6rem', fontSize: '0.85rem', padding: '0.4rem 0.75rem', borderRadius: 6, background: seedMsgOk ? '#E8F5E9' : '#FFEBEE', color: seedMsgOk ? '#1B5E20' : '#B71C1C' }}>
            {seedMsg}
          </p>
        )}
      </div>
    </main>
  )
}