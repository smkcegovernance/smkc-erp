'use client'

import { createMockSession, getSession, isAuthenticated, saveSession, clearSession } from '@smkc/auth'
import type { Session } from '@smkc/types'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotUserId, setForgotUserId] = useState('')
  const [forgotSubmitted, setForgotSubmitted] = useState(false)

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
      setError('User ID must be 8 alphanumeric characters and password cannot be empty.')
      return
    }
    saveSession(nextSession)
    setSession(nextSession)
    setError('')
    setPassword('')
    router.push('/')
  }

  const handleLogout = () => {
    clearSession()
    setSession(null)
    setUserId('')
    setPassword('')
  }

  const handleForgotSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (forgotUserId.trim().length > 0) {
      setForgotSubmitted(true)
    }
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setForgotUserId('')
    setForgotSubmitted(false)
  }

  const profileSummary = useMemo(() => {
    if (!session) return ''
    return `Role: ${session.user.role.toUpperCase()} | Expires: ${new Date(session.expiresAt).toLocaleString()}`
  }, [session])

  if (!session) {
    return (
      <>
        <main className="auth-screen">
          <section className="auth-card" aria-label="SMKC ERP Login">
            {/* ── Red brand header ── */}
            <div className="auth-card-header">
              <div className="auth-brand-logo">
                <Image
                  src="/assets/SMKC_NEW_LOGO_PNG.png"
                  alt="SMKC Logo"
                  width={80}
                  height={80}
                  style={{ objectFit: 'contain', borderRadius: '50%' }}
                  priority
                />
              </div>
              <p className="auth-corp-name">Sangli, Miraj and Kupwad City Municipal Corporation</p>
              <h1>SMKC ERP</h1>
            </div>

            {/* ── Gold accent bar ── */}
            <div className="auth-gold-bar" aria-hidden="true" />

            {/* ── Form body ── */}
            <div className="auth-card-body">
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
                  <div className="auth-password-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="auth-forgot-row">
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => setShowForgotModal(true)}
                  >
                    <i className="bi bi-question-circle" aria-hidden="true" /> Forgot Password?
                  </button>
                </div>

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button type="submit">Sign in →</button>
              </form>
            </div>
          </section>
        </main>

        {/* ── Forgot Password Modal ── */}
        {showForgotModal && (
          <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-label="Forgot Password">
            <div className="auth-modal">
              <div className="auth-modal-header">
                <h2 className="auth-modal-title">
                  <i className="bi bi-key-fill" aria-hidden="true" /> Forgot Password
                </h2>
                <button type="button" className="auth-modal-close" onClick={closeForgotModal} aria-label="Close">
                  <i className="bi bi-x-lg" aria-hidden="true" />
                </button>
              </div>

              {!forgotSubmitted ? (
                <>
                  <p className="auth-modal-desc">
                    Enter your User ID and your request will be forwarded to the system administrator.
                  </p>
                  <form className="auth-form" onSubmit={handleForgotSubmit} style={{ marginTop: '1rem' }}>
                    <div>
                      <label htmlFor="forgotUserId">User&nbsp;ID</label>
                      <input
                        id="forgotUserId"
                        value={forgotUserId}
                        maxLength={8}
                        onChange={(e) => setForgotUserId(e.target.value.toUpperCase())}
                        placeholder="e.g. A1B2C3D4"
                        autoComplete="username"
                      />
                    </div>
                    <button type="submit">Submit Request →</button>
                  </form>
                </>
              ) : (
                <div className="auth-modal-success">
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  <p>Request submitted for <strong>{forgotUserId}</strong>.</p>
                  <span>The system administrator will reset your password and contact you shortly.</span>
                  <button type="button" className="auth-modal-done" onClick={closeForgotModal}>
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="erp-shell">
      <header className="erp-shell-header">
        <div className="erp-shell-header-inner">
          {/* ── Brand ── */}
          <Link href="/" className="erp-brand" style={{ textDecoration: 'none' }}>
            <div className="erp-brand-mark" aria-hidden="true">
              <Image
                src="/assets/SMKC_NEW_LOGO_PNG.png"
                alt="SMKC Logo"
                width={34}
                height={34}
                style={{ objectFit: 'contain', borderRadius: '50%' }}
              />
            </div>
            <div className="erp-brand-text">
              <strong>SMKC ERP</strong>
              <span>Sangli, Miraj and Kupwad City Municipal Corporation</span>
            </div>
          </Link>

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
