'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProposalRemarkData {
  orderNo: number
  proposalType: string
  finYear: string
  deptName: string
  nastiNo: string
  workName: string
  acSubhead: string
  acSubheadName: string
  budgetAmount: number
  proposalCost: number
  existingRemark: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)

function todayDMY(): string {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', border: '1.5px solid #f0c070', borderRadius: 8,
  padding: '9px 12px', fontSize: '0.92rem', color: '#18324a',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 5, fontSize: '0.82rem',
  fontWeight: 700, color: '#7d4f00', letterSpacing: '0.02em',
}
const READONLY_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, background: '#fdf6ec', color: '#3d3010', cursor: 'not-allowed',
  border: '1.5px solid #e8c87a',
}

// ── Inner component (uses useSearchParams) ─────────────────────────────────────

function AuditRemarkInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { T } = useLanguage()

  const orderNo = searchParams.get('orderNo') ?? ''
  const type = searchParams.get('type') ?? 'Q'

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [data, setData] = useState<ProposalRemarkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Display fields
  const [budget, setBudget] = useState('')
  const [proposalCost, setProposalCost] = useState('')
  const [remark, setRemark] = useState('')

  // ── Load proposal ──────────────────────────────────────────────────────────

  const loadProposal = useCallback(async () => {
    if (!orderNo) {
      setLoadError('प्रस्ताव क्रमांक उपलब्ध नाही.')
      setLoading(false)
      return
    }
    setLoading(true)
    setLoadError('')
    try {
      const params = new URLSearchParams({ orderNo, type, remarkType: 'audit' })
      const res = await fetch(`/api/general-administration/work-proposals/for-remark?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data as ProposalRemarkData
        setData(d)
        setBudget(String(d.budgetAmount))
        setProposalCost(String(d.proposalCost))
        setRemark(d.existingRemark?.trim() === ' ' ? '' : (d.existingRemark ?? ''))
      } else {
        setLoadError(json.message ?? 'प्रस्ताव लोड करताना त्रुटी')
      }
    } catch {
      setLoadError('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setLoading(false)
    }
  }, [orderNo, type])

  useEffect(() => { loadProposal() }, [loadProposal])

  // ── Render ─────────────────────────────────────────────────────────────────

  const remainingBudget = (parseFloat(budget) || 0) - (parseFloat(proposalCost) || 0)

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ga-audit-remark-print-slip, #ga-audit-remark-print-slip * { visibility: visible !important; }
          #ga-audit-remark-print-slip {
            position: fixed; left: 0; top: 0; width: 100%;
            background: #fff; padding: 24px 32px; z-index: 9999;
          }
          .no-print { display: none !important; }
        }
        @media screen {
          #ga-audit-remark-print-slip { display: none; }
        }
      `}</style>

      {/* ── Print slip (only visible during print) ── */}
      {data && (
        <div id="ga-audit-remark-print-slip">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: '13pt', fontWeight: 800, fontFamily: 'Times New Roman, serif' }}>
              सांगली-मिरज-कुपवाड शहर महानगरपालिका
            </div>
            <div style={{ fontSize: '11pt', fontWeight: 700, marginTop: 4 }}>लेखापरीक्षण विभागाचे अभिप्राय</div>
            <div style={{ fontSize: '9pt', color: '#555', marginTop: 2 }}>Audit Department Remarks — Work Proposal</div>
            <div style={{ borderBottom: '2px solid #000', marginTop: 10 }} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: 14 }}>
            <tbody>
              {([
                ['विभागाचे नाव', data.deptName],
                ['नस्ती क्रमांक', `${data.finYear} / ${data.nastiNo}`],
                ['कामगिरीचे नाव', data.workName],
                ['अनुज्ञेय लेखाशीर्ष', data.acSubheadName ? `${data.acSubhead} — ${data.acSubheadName}` : data.acSubhead],
                ['अर्थसंकल्पीय तरतूद', `₹ ${fmtCurrency(parseFloat(budget) || data.budgetAmount)}`],
                ['प्रस्तावित कामाचा खर्च', `₹ ${fmtCurrency(parseFloat(proposalCost) || data.proposalCost)}`],
                ['राहणारी शिल्लक रक्कम', `₹ ${fmtCurrency(remainingBudget)}`],
              ] as [string, string][]).map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '4px 8px', border: '1px solid #aaa', fontWeight: 600, width: '35%', background: '#f5f5f5' }}>{label}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #aaa' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {remark.trim() && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '10pt' }}>लेखापरीक्षण अभिप्राय:</div>
              <div style={{ padding: '8px 12px', border: '1px solid #aaa', fontSize: '10pt', lineHeight: 1.8, background: '#fafafa', minHeight: 60 }}>
                {remark}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 42 }}>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: '9pt' }}>
                <div>दिनांक: {todayDMY()}</div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>लेखापरीक्षक</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: '9pt' }}>
                <div>&nbsp;</div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>विभागप्रमुख — लेखापरीक्षण विभाग</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: '8pt', color: '#777', borderTop: '1px solid #ddd', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>क्रमांक: {data.orderNo}</span>
            <span>दिनांक: {todayDMY()}</span>
          </div>
        </div>
      )}

      {/* ── Screen UI ── */}
      <div className="no-print" style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI','Noto Sans Devanagari',sans-serif" }}>
        <DeptSidebar deptKey="general-administration" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      <div style={{ flex: 1, padding: '28px 24px', minWidth: 0 }}>

        {/* Breadcrumb */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <Link href="/general-administration/dashboard" className="dash-breadcrumb-home">{T.depts['general-administration']?.label ?? 'General Administration'}</Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <Link href="/general-administration/work-proposals" className="dash-breadcrumb-home">कार्य प्रस्ताव</Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="dash-breadcrumb-current">लेखापरीक्षण अभिप्राय</span>
        </nav>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #9d6e00 0%, #7a5200 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: '#fff', boxShadow: '0 4px 20px rgba(157,110,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-clipboard2-check-fill" style={{ fontSize: '1.6rem' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>लेखापरीक्षण विभागाचे अभिप्राय</h1>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '0.88rem' }}>
                {data ? `प्रस्ताव #${data.orderNo} — ${data.finYear}` : 'कार्य प्रस्तावावरील लेखापरीक्षण अभिप्राय'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.back()}
              style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <i className="bi bi-arrow-left" /> मागे
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 14, padding: '56px 24px', textAlign: 'center', color: '#9aabbf' }}>
            <span className="spinner-border spinner-border-sm me-2" role="status" />
            प्रस्ताव माहिती लोड होत आहे...
          </div>
        ) : loadError ? (
          <div style={{ background: '#fff5f5', borderRadius: 14, padding: '32px 24px', textAlign: 'center', color: '#c0392b' }}>
            <i className="bi bi-exclamation-triangle-fill me-2" />{loadError}
          </div>
        ) : data ? (
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(18,49,76,0.08)', overflow: 'hidden' }}>

            {/* Fixed info band */}
            <div style={{ background: '#fef9ec', borderBottom: '1.5px solid #f0c070', padding: '18px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 24px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>विभागाचे नाव</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7d4f00' }}>{data.deptName || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>नस्ती क्रमांक</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#7d4f00' }}>{data.finYear} / {data.nastiNo}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>प्रकार</div>
                  <div>
                    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, background: data.proposalType === 'Q' ? '#fff0ee' : '#e8f3ff', color: data.proposalType === 'Q' ? '#c0392b' : '#1a6db5', border: `1px solid ${data.proposalType === 'Q' ? '#c0392b40' : '#1a6db540'}` }}>
                      {data.proposalType === 'Q' ? 'दरपत्रक' : 'निविदा'}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>कामगिरीचे नाव</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#18324a' }}>{data.workName || '—'}</div>
              </div>
            </div>

            {/* Standard certification text */}
            <div style={{ padding: '16px 28px', background: '#fffdf5', borderBottom: '1px solid #f5e9c0' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#5a4a1e', lineHeight: 1.7, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                सादर प्रस्तावाची छाननी करण्यात आली असून लेखाशीर्ष प्रस्तावित कामगिरीसाठी अनुज्ञेय आहे.
                कामगिरी अन्य विभाग / अन्य योजना यातून या विभागाकडे पूर्वी प्रस्तावित झालेली नाही अथवा
                पार पडलेली नाही. कामगिरी करण्यास विभागाची शिफारस आहे.
              </p>
            </div>

            {/* Form */}
            <div style={{ padding: '28px 28px 32px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px' }}>

                {/* AC Head (read-only) */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>अनुज्ञेय लेखाशीर्ष</label>
                  <input
                    type="text"
                    value={data.acSubheadName ? `${data.acSubhead} — ${data.acSubheadName}` : data.acSubhead}
                    readOnly
                    style={READONLY_STYLE}
                  />
                </div>

                {/* Budget */}
                <div>
                  <label style={LABEL_STYLE}>अर्थसंकल्पीय तरतूद (₹)</label>
                  <input
                    type="text"
                    value={fmtCurrency(parseFloat(budget) || 0)}
                    readOnly
                    style={READONLY_STYLE}
                  />
                </div>

                {/* Proposal cost */}
                <div>
                  <label style={LABEL_STYLE}>प्रस्तावित कामाचा खर्च (₹)</label>
                  <input
                    type="text"
                    value={fmtCurrency(parseFloat(proposalCost) || 0)}
                    readOnly
                    style={READONLY_STYLE}
                  />
                </div>

                {/* Remaining budget — computed */}
                <div>
                  <label style={LABEL_STYLE}>राहणारी शिल्लक रक्कम (₹)</label>
                  <input
                    type="text"
                    value={fmtCurrency(remainingBudget)}
                    readOnly
                    style={{ ...READONLY_STYLE, fontWeight: 700, color: remainingBudget < 0 ? '#c0392b' : '#7d4f00' }}
                  />
                </div>

                {/* Remark */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>अन्य अभिप्राय</label>
                  <textarea
                    value={remark || '(अभिप्राय नाही)'}
                    readOnly
                    rows={4}
                    style={{ ...READONLY_STYLE, resize: 'none', fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                  />
                </div>

              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '10px 22px', borderRadius: 9, border: 'none',
                    background: '#9d6e00', color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <i className="bi bi-printer-fill" /> मुद्रित करा
                </button>
              </div>
            </div>
          </div>
        ) : null}

      </div>
    </div>
    </>
  )
}

// ── Page (wrapped in Suspense for useSearchParams) ─────────────────────────────

export default function AuditRemarkPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: '#9aabbf', fontFamily: 'Segoe UI, sans-serif' }}>
        <span className="spinner-border spinner-border-sm me-2" role="status" />लोड होत आहे...
      </div>
    }>
      <AuditRemarkInner />
    </Suspense>
  )
}
