'use client'

import { loginWithServer, getSession, isAuthenticated, saveSession, clearSession } from '@smkc/auth'
import type { Session } from '@smkc/types'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../lib/i18n/LanguageContext'
import AdminSettingsMenu from './AdminSettingsMenu'

export default function AuthShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, T } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    const uid = userId.trim().toUpperCase()
    const pwd = password.trim()
    if (!uid || !pwd) {
      setError(T.auth.errors.required)
      return
    }
    if (!/^[A-Za-z0-9]{1,8}$/.test(uid) || !/^[A-Za-z0-9]{1,8}$/.test(pwd)) {
      setError(T.auth.errors.invalid)
      return
    }
    setIsLoading(true)
    try {
      const result = await loginWithServer(uid, pwd)
      if (!result.success || !result.session) {
        setError(result.message)
        return
      }
      saveSession(result.session)
      setSession(result.session)
      setPassword('')
      const returnTo = (pathname && pathname !== '/' && !pathname.startsWith('/public'))
        ? `${pathname}${window.location.search}`
        : '/'
      router.push(returnTo)
    } finally {
      setIsLoading(false)
    }
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
    if (pathname?.startsWith('/public')) {
      return <>{children}</>
    }
    return (
      <>
        <main className="auth-screen">
          <section className="auth-card" aria-label="SMKC ERP Login">
            <div className="auth-card-header">
              <div className="auth-brand-logo">
                <Image src="/assets/SMKC_NEW_LOGO_PNG.png" alt="SMKC Logo" width={80} height={80} style={{ objectFit: 'contain', borderRadius: '50%' }} priority />
              </div>
              <p className="auth-corp-name">{T.corpName}</p>
              <h1>{T.erpBrand}</h1>
            </div>
            {/* Language toggle on login screen */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', padding: '0 0 0.25rem' }}>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`lang-toggle-btn${lang === 'en' ? ' active' : ''}`}
                aria-pressed={lang === 'en'}
              >EN</button>
              <button
                type="button"
                onClick={() => setLang('mr')}
                className={`lang-toggle-btn${lang === 'mr' ? ' active' : ''}`}
                aria-pressed={lang === 'mr'}
              >मराठी</button>
            </div>
            <div className="auth-gold-bar" aria-hidden="true" />
            <div className="auth-card-body">
              <form className="auth-form" onSubmit={handleLogin}>
                <div>
                  <label htmlFor="userId">{T.auth.userId}</label>
                  <input id="userId" value={userId} maxLength={8} onChange={(e) => setUserId(e.target.value.toUpperCase())} placeholder={T.auth.userIdPlaceholder} autoComplete="username" disabled={isLoading} />
                </div>
                <div>
                  <label htmlFor="password">{T.auth.password}</label>
                  <div className="auth-password-wrap">
                    <input id="password" type={showPassword ? 'text' : 'password'} value={password} maxLength={8} onChange={(e) => setPassword(e.target.value)} placeholder={T.auth.passwordPlaceholder} autoComplete="current-password" disabled={isLoading} />
                    <button type="button" className="auth-password-toggle" aria-label={showPassword ? T.auth.hidePassword : T.auth.showPassword} onClick={() => setShowPassword((v) => !v)}>
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="auth-forgot-row">
                  <button type="button" className="auth-forgot-link" onClick={() => setShowForgotModal(true)}>
                    <i className="bi bi-question-circle" aria-hidden="true" /> {T.auth.forgotPassword}
                  </button>
                </div>
                {error && <p className="auth-error" role="alert">{error}</p>}
                <button type="submit" disabled={isLoading}>{isLoading ? T.auth.signingIn : T.auth.signIn}</button>
              </form>
            </div>
          </section>
        </main>
        {showForgotModal && (
          <div className="auth-modal-backdrop" role="dialog" aria-modal="true" aria-label="Forgot Password">
            <div className="auth-modal">
              <div className="auth-modal-header">
                <h2 className="auth-modal-title"><i className="bi bi-key-fill" aria-hidden="true" /> {T.auth.forgotModal.title}</h2>
                <button type="button" className="auth-modal-close" onClick={closeForgotModal} aria-label="Close"><i className="bi bi-x-lg" aria-hidden="true" /></button>
              </div>
              {!forgotSubmitted ? (
                <>
                  <p className="auth-modal-desc">{T.auth.forgotModal.desc}</p>
                  <form className="auth-form" onSubmit={handleForgotSubmit} style={{ marginTop: '1rem' }}>
                    <div>
                      <label htmlFor="forgotUserId">{T.auth.userId}</label>
                      <input id="forgotUserId" value={forgotUserId} maxLength={8} onChange={(e) => setForgotUserId(e.target.value.toUpperCase())} placeholder={T.auth.userIdPlaceholder} autoComplete="username" />
                    </div>
                    <button type="submit">{T.auth.forgotModal.submitRequest}</button>
                  </form>
                </>
              ) : (
                <div className="auth-modal-success">
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  <p>{T.auth.forgotModal.requestSubmitted(forgotUserId)}</p>
                  <span>{T.auth.forgotModal.adminNote}</span>
                  <button type="button" className="auth-modal-done" onClick={closeForgotModal}>{T.auth.forgotModal.done}</button>
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
          <Link href="/" className="erp-brand" style={{ textDecoration: 'none' }}>
            <div className="erp-brand-mark" aria-hidden="true">
              <Image src="/assets/SMKC_NEW_LOGO_PNG.png" alt="SMKC Logo" width={34} height={34} style={{ objectFit: 'contain', borderRadius: '50%' }} />
            </div>
            <div className="erp-brand-text">
              <strong>{T.erpBrand}</strong>
              <span>{T.corpName}</span>
            </div>
          </Link>
          <section className="profile-card" aria-label="User profile">
            {/* Language toggle */}
            <div className="lang-toggle-group" aria-label="Language selector">
              <button
                type="button"
                onClick={() => setLang('en')} 
                className={`lang-toggle-btn${lang === 'en' ? ' active' : ''}`}
                aria-pressed={lang === 'en'}
              >EN</button>
              <button
                type="button"
                onClick={() => setLang('mr')}
                className={`lang-toggle-btn${lang === 'mr' ? ' active' : ''}`}
                aria-pressed={lang === 'mr'}
              >मराठी</button>
            </div>
            {/* Profile */}
            <Link href="/profile" className="profile-avatar header-icon-btn" title={profileSummary} style={{ textDecoration: 'none' }}>
              <i className="bi bi-person-circle" aria-hidden="true" />
            </Link>
            {/* Admin settings menu — only visible to ADMIN001 / PTTEST01 */}
            {['ADMIN001', 'PTTEST01'].includes(session.user.userId.toUpperCase()) && (
              <AdminSettingsMenu />
            )}
            {/* Logout */}
            <button type="button" className="header-icon-btn" onClick={handleLogout} title={T.auth.signOut} aria-label={T.auth.signOut}>
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
            </button>
          </section>
        </div>
        <div className="erp-header-divider" aria-hidden="true" />
      </header>
      {children}
    </div>
  )
}