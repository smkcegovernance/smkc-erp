'use client'

import { currentUser, getSession } from '@smkc/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

interface ProfileData {
  userId: string
  name: string
  status: string
  validFlag: string
  locked: string
  validFrom: string | null
  validTo: string | null
  roleId: number
  role: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { T } = useLanguage()
  const user = typeof window !== 'undefined' ? currentUser() : null

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')

  // Change password form
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changePwdError, setChangePwdError] = useState('')
  const [changePwdSuccess, setChangePwdSuccess] = useState('')
  const [changePwdLoading, setChangePwdLoading] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace('/')
      return
    }
    fetchProfile(session.user.userId)
  }, [router])

  async function fetchProfile(userId: string) {
    setProfileLoading(true)
    setProfileError('')
    try {
      const res = await fetch(`/api/erp-auth/profile/${encodeURIComponent(userId)}`)
      const json = await res.json() as { success: boolean; message?: string; data?: ProfileData }
      if (!json.success || !json.data) {
        setProfileError(json.message ?? 'Failed to load profile')
      } else {
        setProfile(json.data)
      }
    } catch {
      setProfileError('Profile service unavailable.')
    } finally {
      setProfileLoading(false)
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setChangePwdError('')
    setChangePwdSuccess('')

    if (!oldPassword || !newPassword || !confirmPassword) {
      setChangePwdError('All password fields are required.')
      return
    }
    if (!/^[A-Za-z0-9]{1,8}$/.test(newPassword)) {
      setChangePwdError('New password must be alphanumeric, maximum 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setChangePwdError('New password and confirmation do not match.')
      return
    }
    if (oldPassword === newPassword) {
      setChangePwdError('New password must be different from the current password.')
      return
    }

    const session = getSession()
    if (!session) {
      router.replace('/')
      return
    }

    setChangePwdLoading(true)
    try {
      const res = await fetch('/api/erp-auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.userId,
          oldPassword,
          newPassword,
        }),
      })
      const json = await res.json() as { success: boolean; message?: string }
      if (!json.success) {
        setChangePwdError(json.message ?? 'Password change failed.')
      } else {
        setChangePwdSuccess('Password changed successfully.')
        setOldPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setChangePwdError('Service unavailable. Please try again.')
    } finally {
      setChangePwdLoading(false)
    }
  }

  const roleLabel = (role: string) => role.charAt(0).toUpperCase() + role.slice(1)

  const statusBadge = (status: string) => {
    const isActive = status?.toUpperCase() === 'A' || status?.toLowerCase() === 'active'
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '0.2rem 0.7rem',
        borderRadius: 999,
        fontSize: '0.78rem',
        fontWeight: 700,
        background: isActive ? 'rgba(46,125,50,0.10)' : 'rgba(192,57,43,0.10)',
        color: isActive ? '#2e7d32' : '#c0392b',
      }}>
        <i className={`bi ${isActive ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`} />
        {isActive ? 'Active' : 'Inactive'}
      </span>
    )
  }

  return (
    <main className="erp-main">
      {/* Breadcrumb */}
      <nav className="dash-breadcrumb" style={{ padding: '0 1.5rem' }} aria-label="Breadcrumb">
        <Link href="/" className="dash-breadcrumb-home">
          <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
        </Link>
        <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
        <span className="dash-breadcrumb-current">My Profile</span>
      </nav>
      <div className="erp-page-header">
        <div className="erp-page-header-text">
          <p className="erp-page-kicker">SMKC ERP</p>
          <h1 className="erp-page-title">My Profile</h1>
          <p className="erp-page-subtitle">
            View your account details and manage your password.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', gap: '1.5rem', padding: '0 1.5rem 2rem' }}>

        {/* ── Profile Card ── */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, boxShadow: '0 2px 12px rgba(44,62,80,0.10)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(160deg, #C9382A 0%, #A93226 100%)', padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-person-fill" style={{ fontSize: '1.8rem', color: '#fff' }} />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                User Profile
              </div>
              <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginTop: '0.15rem' }}>
                {user?.name ?? user?.userId ?? '—'}
              </div>
            </div>
          </div>
          <div style={{ height: 4, background: 'linear-gradient(90deg, #D4AF37 0%, rgba(212,175,55,0.3) 70%, transparent 100%)' }} />

          <div style={{ padding: '1.5rem 1.75rem' }}>
            {profileLoading && (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                <i className="bi bi-hourglass-split" /> Loading profile…
              </p>
            )}
            {profileError && (
              <p style={{ color: 'var(--brand-primary)', fontSize: '0.9rem' }}>
                <i className="bi bi-exclamation-triangle-fill" /> {profileError}
              </p>
            )}
            {profile && (
              <dl style={{ display: 'grid', gap: '1rem' }}>
                {([
                  ['User ID',       profile.userId],
                  ['Full Name',     profile.name],
                  ['Role',          roleLabel(profile.role)],
                  ['Valid From',    profile.validFrom ?? '—'],
                  ['Valid To',      profile.validTo   ?? '—'],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'start' }}>
                    <dt style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '0.15rem' }}>
                      {label}
                    </dt>
                    <dd style={{ fontSize: '0.95rem', color: 'var(--color-heading)', fontWeight: 500, margin: 0 }}>
                      {value}
                    </dd>
                  </div>
                ))}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem', alignItems: 'start' }}>
                  <dt style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: '0.3rem' }}>
                    Status
                  </dt>
                  <dd style={{ margin: 0 }}>{statusBadge(profile.status)}</dd>
                </div>
                {profile.locked === 'Y' && (
                  <div style={{ background: 'rgba(192,57,43,0.08)', borderRadius: 10, padding: '0.75rem 1rem', color: '#c0392b', fontSize: '0.85rem', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <i className="bi bi-lock-fill" />
                    Account is locked. Please contact the administrator.
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>

        {/* ── Change Password Card ── */}
        <div style={{ background: 'var(--surface)', borderRadius: 18, boxShadow: '0 2px 12px rgba(44,62,80,0.10)', overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(160deg, #1a252f 0%, #2c3e50 100%)', padding: '1.5rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-shield-lock-fill" style={{ fontSize: '1.6rem', color: '#D4AF37' }} />
            </div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Security
              </div>
              <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginTop: '0.15rem' }}>
                Change Password
              </div>
            </div>
          </div>
          <div style={{ height: 4, background: 'linear-gradient(90deg, #D4AF37 0%, rgba(212,175,55,0.3) 70%, transparent 100%)' }} />

          <div style={{ padding: '1.5rem 1.75rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.55 }}>
              Password must be alphanumeric, maximum 8 characters.
            </p>

            <form onSubmit={handleChangePassword} className="auth-form" style={{ display: 'grid', gap: '1rem' }}>
              {/* Current password */}
              <div>
                <label htmlFor="oldPassword" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                  Current Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="oldPassword"
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    maxLength={8}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Current password"
                    autoComplete="current-password"
                    disabled={changePwdLoading}
                    style={{ width: '100%' }}
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowOld(v => !v)} aria-label={showOld ? 'Hide' : 'Show'}>
                    <i className={`bi ${showOld ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label htmlFor="newPassword" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="newPassword"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    maxLength={8}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Max 8 alphanumeric"
                    autoComplete="new-password"
                    disabled={changePwdLoading}
                    style={{ width: '100%' }}
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowNew(v => !v)} aria-label={showNew ? 'Hide' : 'Show'}>
                    <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label htmlFor="confirmPassword" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <div className="auth-password-wrap">
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    maxLength={8}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    disabled={changePwdLoading}
                    style={{ width: '100%' }}
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowConfirm(v => !v)} aria-label={showConfirm ? 'Hide' : 'Show'}>
                    <i className={`bi ${showConfirm ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
              </div>

              {changePwdError && (
                <p style={{ margin: 0, color: '#c0392b', fontSize: '0.85rem', fontWeight: 600, display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                  <i className="bi bi-exclamation-triangle-fill" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  {changePwdError}
                </p>
              )}

              {changePwdSuccess && (
                <p style={{ margin: 0, color: '#2e7d32', fontSize: '0.85rem', fontWeight: 600, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <i className="bi bi-check-circle-fill" />
                  {changePwdSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={changePwdLoading}
                style={{
                  height: 44,
                  border: 0,
                  borderRadius: 12,
                  background: changePwdLoading ? 'var(--color-gray-200)' : 'var(--brand-primary)',
                  color: changePwdLoading ? 'var(--color-text-muted)' : '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: changePwdLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 0.2s',
                }}
              >
                {changePwdLoading ? 'Updating…' : 'Update Password →'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </main>
  )
}
