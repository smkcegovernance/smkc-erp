'use client'

import { createMockSession, getSession, isAuthenticated, saveSession, clearSession } from '@smkc/auth'
import type { Session } from '@smkc/types'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const loadSession = useCallback(() => {
    if (!isAuthenticated()) {
      clearSession()
      setSession(null)
      return
    }

    setSession(getSession())
  }, [])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextSession = createMockSession(userId, password)

    if (!nextSession) {
      setError('Use an 8-character alphanumeric User ID and a non-empty password.')
      return
    }

    saveSession(nextSession)
    setSession(nextSession)
    setError('')
    setPassword('')
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setUserId('')
    setPassword('')
  }

  const profileSummary = useMemo(() => {
    if (!session) return ''
    return `Role: ${session.user.role.toUpperCase()} | Expires: ${new Date(session.expiresAt).toLocaleString()}`
  }, [session])

  if (!session) {
    return (
      <main className="auth-screen">
        <section className="auth-card" aria-label="Unified SMKC ERP Login">
          {/* ── Red brand header ── */}
          <div className="auth-card-header">
            <div className="auth-brand-logo" aria-hidden="true">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21h22v-2H1v2zm6-2v-7H4l8-8 8 8h-3v7H7zm2-2h3v-5H9v5zm4 0h3v-5h-3v5z" />
              </svg>
            </div>
            <h1>SMKC ERP</h1>
            <p>Sangli · Miraj · Kupwad&nbsp;&nbsp;Municipal Corporation</p>
          </div>

          {/* ── Gold accent bar ── */}
          <div className="auth-gold-bar" aria-hidden="true" />

          {/* ── Form body ── */}
          <div className="auth-card-body">
            <p className="auth-kicker">Unified Access</p>
            <p className="auth-note">One login for all departments</p>

            <form className="auth-form" onSubmit={handleLogin}>
              <div>
                <label htmlFor="userId">User&nbsp;ID</label>
                <input
                  id="userId"
                  value={userId}
                  maxLength={8}
                  onChange={(event) => setUserId(event.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  autoComplete="username"
                />
              </div>

              <div>
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </div>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <button type="submit">Sign in →</button>
            </form>
          </div>
        </section>
      </main>
    )
  }

  return (
    <div className="erp-shell">
      <header className="erp-shell-header">
        <div className="erp-shell-header-inner">
          {/* ── Brand ── */}
          <div className="erp-brand">
            <div className="erp-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 21h22v-2H1v2zm6-2v-7H4l8-8 8 8h-3v7H7zm2-2h3v-5H9v5zm4 0h3v-5h-3v5z" />
              </svg>
            </div>
            <div className="erp-brand-text">
              <strong>SMKC ERP</strong>
              <span>Municipal Corporation</span>
            </div>
          </div>

          {/* ── Profile ── */}
          <section className="profile-card" aria-label="User profile">
            <div className="profile-info">
              <strong>{session.user.name}</strong>
              <small>{session.user.userId}&nbsp;·&nbsp;{session.user.role.toUpperCase()}</small>
            </div>
            <div className="profile-avatar" aria-hidden="true">
              {session.user.userId.charAt(0)}
            </div>
            <button type="button" onClick={handleLogout}>Sign out</button>
          </section>
        </div>
        <div className="erp-header-divider" aria-hidden="true" />
      </header>

      {children}
    </div>
  )
}
