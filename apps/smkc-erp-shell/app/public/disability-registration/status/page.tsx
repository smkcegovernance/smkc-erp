'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Header from '../../../women-child-welfare/components/Header'
import Footer from '../../../women-child-welfare/components/Footer'

interface StatusData {
  REGISTRATION_NO: string
  SURNAME?: string
  FIRST_NAME?: string
  FATHER_NAME?: string
  MOBILE_NUMBER?: string
  DISABILITY_PERCENTAGE?: number
  STATUS: string
  CREATED_AT?: string
  REVIEWED_AT?: string
  STATUS_REMARKS?: string
}

interface ApiResp { success: boolean; message?: string; data?: unknown }

function normalizeRow(item: unknown): StatusData {
  const row = item as Record<string, unknown>
  const n: Record<string, unknown> = {}
  for (const k of Object.keys(row)) n[k.toUpperCase()] = row[k]
  return n as unknown as StatusData
}

function extractRow(res: ApiResp): StatusData | null {
  if (!res.success || !res.data) return null
  if (Array.isArray(res.data)) return res.data.length ? normalizeRow(res.data[0]) : null
  const obj = res.data as Record<string, unknown>
  const key = Object.keys(obj).find(k => Array.isArray(obj[k]))
  if (key) { const arr = obj[key] as unknown[]; return arr.length ? normalizeRow(arr[0]) : null }
  return normalizeRow(res.data)
}

function formatDate(d?: string): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('mr-IN', { day: '2-digit', month: 'long', year: 'numeric' }) }
  catch { return d }
}

function maskMobile(m?: string): string {
  if (!m || m.length < 4) return '—'
  return 'XXXX-XX' + m.slice(-4)
}

type StatusConfig = { label: string; color: string; bg: string; border: string; icon: string; message: string }

const STATUS_CONFIG: Record<string, StatusConfig> = {
  SUBMITTED:    { label: 'नवीन',        color: '#0f5fa8', bg: '#e8f4fd', border: '#b3d4f0', icon: 'bi-send-check-fill',   message: 'नवीन अर्ज सादर केला आहे.' },
  UNDER_REVIEW: { label: 'आढाव्याधीन', color: '#92400e', bg: '#fef9c3', border: '#f5d591', icon: 'bi-hourglass-split',    message: 'तुमचा अर्ज आढावाधीन आहे.' },
  APPROVED:     { label: 'मंजूर',     color: '#065f46', bg: '#d1fae5', border: '#6ee7b7', icon: 'bi-patch-check-fill', message: 'तुमचा अर्ज मंजूर होण्याचे अभिनंदन!' },
  REJECTED:     { label: 'नाकारले',   color: '#7a2020', bg: '#fee2e2', border: '#fca5a5', icon: 'bi-x-circle-fill',    message: 'तुमचा अर्ज नाकारण्यात आला आहे.' },
  DUPLICATE:    { label: 'डुप्लिकेट',  color: '#5b21b6', bg: '#f5f3ff', border: '#c4b5fd', icon: 'bi-files',            message: 'तुमचा अर्ज डुप्लिकेट म्हणून चिन्हांकित केला आहे.' },
  CANCELLED:    { label: 'रद्द',       color: '#6c757d', bg: '#f3f4f6', border: '#d1d5db', icon: 'bi-slash-circle',  message: 'तुमचा अर्ज रद्द केला आहे.' },
  DRAFT:        { label: 'ड्राफ्ट',     color: '#6c757d', bg: '#f3f4f6', border: '#d1d5db', icon: 'bi-file-earmark-text', message: 'अर्ज ड्राफ्ट स्वरूपात संग्रहित.' },
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.72rem', color: '#5e7388', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: '#18324a', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function StatusChecker() {
  const searchParams = useSearchParams()
  const [regNo, setRegNo] = useState(() => searchParams.get('regNo') ?? '')
  const [loading, setLoading] = useState(false)
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function handleCheck() {
    const q = regNo.trim()
    if (!q) return
    setLoading(true)
    setErrorMsg(null)
    setStatusData(null)
    setSearched(false)
    try {
      const res = await fetch(`/api/public/disability-registration/status/${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data: ApiResp = await res.json()
      if (!data.success) {
        setErrorMsg(data.message ?? 'ही नोंदणी आढळली नाही. कृपया नोंदणी क्रमांक तपासा.')
      } else {
        const row = extractRow(data)
        if (!row) setErrorMsg('ही नोंदणी आढळली नाही. कृपया नोंदणी क्रमांक तपासा.')
        else setStatusData(row)
      }
    } catch {
      setErrorMsg('सर्व्हरशी संपर्क होत नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.')
    }
    setLoading(false)
    setSearched(true)
  }

  function handleReset() {
    setRegNo('')
    setStatusData(null)
    setErrorMsg(null)
    setSearched(false)
  }

  const cfg = statusData ? (STATUS_CONFIG[statusData.STATUS] ?? { label: statusData.STATUS, color: '#6c757d', bg: '#f3f4f6', border: '#d1d5db', icon: 'bi-question-circle', message: '' }) : null

  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 16px 60px', background: '#f0f5fa' }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 32px rgba(15,95,168,0.1)', overflow: 'hidden' }}>
          {/* Header bar */}
          <div style={{ background: 'linear-gradient(135deg, #0f5fa8, #0b457c)', padding: '22px 28px', color: '#fff' }}>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginBottom: 4 }}>श्रीमती कंचनताई नगरपालिका — महिला व बालकल्याण विभाग</div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>नोंदणी क्र.द्वारे अर्ज स्थिती तपासा</h1>
            <p style={{ margin: '6px 0 0', fontSize: '0.83rem', opacity: 0.85 }}>तुमचा नोंदणी क्रमांक (जसे WCWC-2025-00001) प्रविष्ट करा</p>
          </div>

          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                type='text'
                value={regNo}
                onChange={e => setRegNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && handleCheck()}
                placeholder='नोंदणी क्रमांक प्रविष्ट करा...'
                style={{
                  flex: 1, padding: '11px 14px', borderRadius: 10, fontSize: '0.95rem',
                  border: '1.5px solid #d5e1ea', outline: 'none', fontFamily: 'inherit', color: '#18324a',
                }}
                disabled={loading}
              />
              <button
                type='button'
                onClick={handleCheck}
                disabled={loading || !regNo.trim()}
                style={{
                  padding: '11px 18px', borderRadius: 10, background: '#0f5fa8', color: '#fff',
                  border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap',
                  opacity: loading || !regNo.trim() ? 0.6 : 1,
                }}
              >
                {loading ? <span className='spinner-border spinner-border-sm' role='status' aria-hidden='true' /> : 'स्थिती तपासा'}
              </button>
            </div>

            {searched && errorMsg && (
              <div style={{ marginTop: 20, padding: '14px 18px', borderRadius: 12, background: '#fff5f5', border: '1.5px solid #fca5a5', color: '#7a2020', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <i className='bi bi-exclamation-triangle-fill' style={{ fontSize: '1.1rem', marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem' }}>{errorMsg}</span>
              </div>
            )}

            {statusData && cfg && (
              <div style={{ marginTop: 20 }}>
                <div style={{
                  padding: '16px 20px', borderRadius: 14, border: `1.5px solid ${cfg.border}`,
                  background: cfg.bg, marginBottom: 18,
                  display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <i className={`bi ${cfg.icon}`} style={{ fontSize: '2rem', color: cfg.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: cfg.color }}>{cfg.label}</div>
                    <div style={{ fontSize: '0.86rem', color: cfg.color, opacity: 0.85, marginTop: 2 }}>{cfg.message}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                  <InfoRow label='नोंदणी क्र.' value={statusData.REGISTRATION_NO} />
                  <InfoRow label='नाव' value={[statusData.SURNAME, statusData.FIRST_NAME].filter(Boolean).join(' ') || '—'} />
                  <InfoRow label='सादर दिनांक' value={formatDate(statusData.CREATED_AT)} />
                  {statusData.REVIEWED_AT && <InfoRow label='आढावा दिनांक' value={formatDate(statusData.REVIEWED_AT)} />}
                  {statusData.DISABILITY_PERCENTAGE != null && <InfoRow label='अपंगत्व %' value={`${statusData.DISABILITY_PERCENTAGE}%`} />}
                  {statusData.MOBILE_NUMBER && <InfoRow label='मोबाइल' value={maskMobile(statusData.MOBILE_NUMBER)} />}
                </div>

                {(statusData.STATUS === 'REJECTED' || statusData.STATUS === 'DUPLICATE') && statusData.STATUS_REMARKS && (
                  <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 10, background: '#fff8f8', border: '1.5px solid #fca5a5' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#7a2020', marginBottom: 4 }}>
                      <i className='bi bi-chat-left-text me-1' />शेरा:
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#7a2020' }}>{statusData.STATUS_REMARKS}</div>
                  </div>
                )}

                <p style={{ marginTop: 14, fontSize: '0.72rem', color: '#9ab0c2', textAlign: 'center' }}>
                  नोंद: आधार क्रमांक अर्जदाराच्या गोपनीयतेसाठी आंशतः लपवलेला आहे.
                </p>

                <button
                  type='button'
                  onClick={handleReset}
                  style={{
                    display: 'block', width: '100%', marginTop: 14, padding: '10px', borderRadius: 10,
                    background: '#f0f5fa', border: '1.5px solid #d5e1ea', color: '#0f5fa8', fontWeight: 600,
                    fontSize: '0.9rem', cursor: 'pointer',
                  }}
                >
                  <i className='bi bi-search me-2' />पुन्हा तपासा
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <Link href='/public/disability-registration' style={{ color: '#0f5fa8', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            <i className='bi bi-arrow-left me-1' />नोंदणी फॉर्मवर परत जा
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <>
      <Header />
      <Suspense>
        <StatusChecker />
      </Suspense>
      <Footer />
    </>
  )
}