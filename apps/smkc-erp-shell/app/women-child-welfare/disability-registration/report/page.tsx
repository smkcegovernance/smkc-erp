'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import { getReport } from '../../services/api'
import type { ApiResponse } from '../../types/formTypes'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportRow {
  REGISTRATION_NO: string
  SURNAME?: string
  FIRST_NAME?: string
  FATHER_NAME?: string
  MOBILE_NUMBER?: string
  WARD_NUMBER?: string
  PRABHAG_SAMITI?: string
  DISABILITY_PERCENTAGE?: number
  STATUS?: string
  APPLICATION_MODE?: string
  CREATED_AT?: string
  REVIEWED_AT?: string
  STATUS_REMARKS?: string
  OPERATOR_NAME?: string
}

type ReportType = 'ALL' | 'APPROVED' | 'REJECTED' | 'DUPLICATE'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeRow(item: unknown): ReportRow {
  const row = item as Record<string, unknown>
  const n: Record<string, unknown> = {}
  for (const k of Object.keys(row)) n[k.toUpperCase()] = row[k]
  return n as unknown as ReportRow
}

function extractRows(res: ApiResponse): ReportRow[] {
  if (!res.success || !res.data) return []
  if (Array.isArray(res.data)) return (res.data as unknown[]).map(normalizeRow)
  const obj = res.data as Record<string, unknown>
  const key = Object.keys(obj).find(k => Array.isArray(obj[k]))
  return key ? (obj[key] as unknown[]).map(normalizeRow) : []
}

function fullName(r: ReportRow): string {
  return [r.SURNAME, r.FIRST_NAME].filter(Boolean).join(' ')
}

function formatDate(d?: string): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('mr-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const STATUS_LABEL: Record<string, string> = {
  APPROVED:     'मंजूर',
  REJECTED:     'नाकारले',
  DUPLICATE:    'डुप्लिकेट',
  UNDER_REVIEW: 'आढाव्याधीन',
  SUBMITTED:    'नवीन',
  CANCELLED:    'रद्द',
  DRAFT:        'ड्राफ्ट',
}

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  ALL:       'सर्व (डुप्लिकेट वगळून)',
  APPROVED:  'मंजूर',
  REJECTED:  'नाकारले',
  DUPLICATE: 'डुप्लिकेट',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DisabilityReportPage() {
  const { T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const printAreaRef = useRef<HTMLDivElement>(null)

  // Filters
  const [reportType, setReportType] = useState<ReportType>('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appMode, setAppMode] = useState('')

  // Data
  const [rows, setRows] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setGenerated(false)
    const res = await getReport({
      reportType,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      applicationMode: appMode || undefined,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.message ?? 'अहवाल मिळाला नाही. कृपया पुन्हा प्रयत्न करा.')
      return
    }
    setRows(extractRows(res))
    setGenerated(true)
  }

  function handleExportExcel() {
    const BOM = '\uFEFF'
    const headers = ['#', 'नोंदणी क्र.', 'नाव', 'वडिलांचे नाव', 'मोबाइल', 'वॉर्ड', 'प्रभाग समिती', 'अपंगत्व %', 'स्थिती', 'मोड', 'सादर दिनांक', 'आढावा दिनांक', 'ऑपरेटर', 'शेरा']
    function esc(v: string) { return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v.replace(/"/g, '""')}"`  : v }
    const dataRows = rows.map((r, i) => [
      String(i + 1),
      r.REGISTRATION_NO ?? '',
      [r.SURNAME, r.FIRST_NAME].filter(Boolean).join(' '),
      r.FATHER_NAME ?? '',
      r.MOBILE_NUMBER ?? '',
      r.WARD_NUMBER ?? '',
      r.PRABHAG_SAMITI ?? '',
      r.DISABILITY_PERCENTAGE != null ? String(r.DISABILITY_PERCENTAGE) : '',
      STATUS_LABEL[r.STATUS ?? ''] ?? r.STATUS ?? '',
      r.APPLICATION_MODE === 'PUBLIC' ? 'सार्वजनिक' : r.APPLICATION_MODE === 'DEPARTMENT' ? 'विभाग' : r.APPLICATION_MODE ?? '',
      r.CREATED_AT ? formatDate(r.CREATED_AT) : '',
      r.REVIEWED_AT ? formatDate(r.REVIEWED_AT) : '',
      r.OPERATOR_NAME ?? '',
      r.STATUS_REMARKS ?? '',
    ].map(esc))
    const csv = BOM + [headers.map(esc), ...dataRows].map(row => row.join(',')).join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'दिव्यांग नोंदणी अहवाल_' + new Date().toISOString().slice(0,10) + '.csv'
    document.body.appendChild(a); a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
  }

  function handlePrint() {
    window.print()
  }

  const today = new Date().toLocaleDateString('mr-IN', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="dept-layout">
      <DeptSidebar
        deptKey="women-child-welfare"
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
      />

      <main className="erp-main">
        {/* Breadcrumb */}
        <nav className="dash-breadcrumb no-print" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep">›</span>
          <Link href="/women-child-welfare/dashboard" className="dash-breadcrumb-home">
            महिला व बालकल्याण विभाग
          </Link>
          <span className="dash-breadcrumb-sep">›</span>
          <Link href="/women-child-welfare/registrations" className="dash-breadcrumb-home">
            दिव्यांग नोंदणी अहवाल
          </Link>
          <span className="dash-breadcrumb-sep">›</span>
          <span className="dash-breadcrumb-current">दिव्यांग नोंदणी अहवाल</span>
        </nav>

        {/* Page header */}
        <div className="erp-page-header no-print">
          <div className="erp-page-header-text">
            <div className="erp-page-kicker">Reports — Women &amp; Child Welfare</div>
            <h1 className="erp-page-title">
              <button
                type="button"
                className="dept-sidebar-toggle-btn"
                style={{ marginRight: 12 }}
                onClick={() => setSidebarOpen(v => !v)}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} />
              </button>
              दिव्यांग नोंदणी अहवाल
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/women-child-welfare/registrations" className="dash-view-tab" style={{ textDecoration: 'none', gap: 6 }}>
              <i className="bi bi-arrow-left" />
              मागे
            </Link>
          </div>
        </div>

        {/* Filter card */}
        <div className="erp-card no-print" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <i className="bi bi-funnel-fill" style={{ color: '#0f5fa8' }} />
            <h6 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#18324a' }}>फिल्टर</h6>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {/* Report type */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5e7388', marginBottom: 4 }}>
                अहवाल प्रकार
              </label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value as ReportType)}
                className="dash-filter-input"
                style={{ width: '100%' }}
              >
                <option value="ALL">सर्व (डुप्लिकेट वगळून)</option>
                <option value="APPROVED">मंजूर</option>
                <option value="REJECTED">नाकारले</option>
                <option value="DUPLICATE">डुप्लिकेट</option>
              </select>
            </div>

            {/* From date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5e7388', marginBottom: 4 }}>
                दिनांक पासून
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="dash-filter-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* To date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5e7388', marginBottom: 4 }}>
                दिनांक पर्यंत
              </label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="dash-filter-input"
                style={{ width: '100%' }}
              />
            </div>

            {/* App mode */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#5e7388', marginBottom: 4 }}>
                मोड
              </label>
              <select
                value={appMode}
                onChange={e => setAppMode(e.target.value)}
                className="dash-filter-input"
                style={{ width: '100%' }}
              >
                <option value="">सर्व</option>
                <option value="PUBLIC">सार्वजनिक</option>
                <option value="DEPARTMENT">विभाग</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ gap: 6, display: 'flex', alignItems: 'center' }}
              disabled={loading}
              onClick={handleGenerate}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-1" role="status" />अहवाल लोड होत आहे...</>
                : <><i className="bi bi-bar-chart-fill me-1" />अहवाल तयार करा</>
              }
            </button>
            {generated && rows.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                style={{ gap: 6, display: 'flex', alignItems: 'center' }}
                onClick={handlePrint}
              >
                <i className="bi bi-printer me-1" />छापा काफ़ा
              </button>
            )}
            {generated && rows.length > 0 && (
              <button
                type="button"
                className="btn btn-outline-success btn-sm"
                style={{ gap: 6, display: 'flex', alignItems: 'center' }}
                onClick={handleExportExcel}
              >
                <i className="bi bi-file-earmark-excel me-1" />एक्सेल
              </button>
            )}
            {reportType === 'DUPLICATE' && (
              <span style={{ fontSize: '0.8rem', color: '#7c3aed', background: '#f5f3ff', padding: '4px 12px', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                <i className="bi bi-info-circle me-1" />डुप्लिकेट अर्ज मंजूर/नाकारले/सर्व अहवालात दिसणार नाहीत.
              </span>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fff5f5', border: '1.5px solid #f5c2c7', color: '#c63b31', fontSize: '0.88rem' }}>
              <i className="bi bi-exclamation-triangle-fill me-2" />{error}
            </div>
          )}
        </div>

        {/* Print area */}
        {generated && (
          <div ref={printAreaRef} className="erp-card print-report-area">
            {/* Print header — shown only when printing */}
            <div className="print-only" style={{ textAlign: 'center', marginBottom: 18, borderBottom: '2px solid #18324a', paddingBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>महिला व बालकल्याण विभाग</div>
              <div style={{ fontWeight: 700, fontSize: '1.15rem', marginTop: 8, color: '#0f5fa8' }}>दिव्यांग नोंदणी अहवाल</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4, color: '#5e7388' }}>
                {REPORT_TYPE_LABELS[reportType]}
                {fromDate && ` | ${fromDate}`}
                {toDate && ` – ${toDate}`}
                {appMode && ` | ${appMode === 'PUBLIC' ? 'सार्वजनिक' : 'विभाग'}`}
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: 2, color: '#5e7388' }}>कुल नोंदणी: {rows.length} | {today}</div>
            </div>

            {/* Screen heading */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: '#18324a' }}>
                  {REPORT_TYPE_LABELS[reportType]}
                </h6>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#5e7388' }}>
                  कुल नोंदणी: <strong>{rows.length}</strong>
                </p>
              </div>
            </div>

            {rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#5e7388' }}>
                <i className="bi bi-inbox" style={{ fontSize: '2.2rem', display: 'block', marginBottom: 8, opacity: 0.4 }} />
                या फिल्टरसाठी कोणतीही नोंदणी आढळली नाही.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f0f5fa', borderBottom: '2px solid #d5e1ea' }}>
                      {['#', 'नोंदणी क्र.', 'नाव', 'वडिलांचे नाव', 'मोबाइल', 'वॉर्ड', 'प्रभाग समिती', 'अपंगत्व %', 'स्थिती', 'मोड', 'सादर दिनांक', 'आढावा दिनांक', 'ऑपरेटर', 'शेरा'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: '#18324a', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.REGISTRATION_NO} style={{ borderBottom: '1px solid #e8f0f6', background: i % 2 === 0 ? '#fff' : '#fafcff' }}>
                        <td style={{ padding: '7px 10px', color: '#5e7388', fontSize: '0.75rem' }}>{i + 1}</td>
                        <td style={{ padding: '7px 10px', fontWeight: 600, color: '#0f5fa8', whiteSpace: 'nowrap' }}>{r.REGISTRATION_NO}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{fullName(r)}</td>
                        <td style={{ padding: '7px 10px' }}>{r.FATHER_NAME ?? '—'}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{r.MOBILE_NUMBER ?? '—'}</td>
                        <td style={{ padding: '7px 10px' }}>{r.WARD_NUMBER ?? '—'}</td>
                        <td style={{ padding: '7px 10px' }}>{r.PRABHAG_SAMITI ?? '—'}</td>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>{r.DISABILITY_PERCENTAGE != null ? `${r.DISABILITY_PERCENTAGE}%` : '—'}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600,
                            background: r.STATUS === 'APPROVED' ? '#d9f4ec' : r.STATUS === 'REJECTED' ? '#ffe5e1' : r.STATUS === 'DUPLICATE' ? '#f3e8ff' : '#e8f4fd',
                            color: r.STATUS === 'APPROVED' ? '#0a5240' : r.STATUS === 'REJECTED' ? '#7a2020' : r.STATUS === 'DUPLICATE' ? '#5b21b6' : '#0f5fa8',
                          }}>
                            {STATUS_LABEL[r.STATUS ?? ''] ?? r.STATUS ?? '—'}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px' }}>{r.APPLICATION_MODE === 'PUBLIC' ? 'सार्वजनिक' : r.APPLICATION_MODE === 'DEPARTMENT' ? 'विभाग' : r.APPLICATION_MODE ?? '—'}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{formatDate(r.CREATED_AT)}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{formatDate(r.REVIEWED_AT)}</td>
                        <td style={{ padding: '7px 10px' }}>{r.OPERATOR_NAME ?? '—'}</td>
                        <td style={{ padding: '7px 10px', maxWidth: 180, wordBreak: 'break-word' }}>{r.STATUS_REMARKS ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .dept-sidebar,
          .dept-sidebar-backdrop { display: none !important; }
          .dept-layout { display: block !important; }
          .erp-main { margin: 0 !important; padding: 8px !important; width: 100% !important; }
          .print-report-area { box-shadow: none !important; border: none !important; font-family: 'Nirmala UI', 'Kokila', 'Mangal', sans-serif !important; }
          body { margin: 0 !important; }
          thead { display: table-header-group !important; }
          tr { page-break-inside: avoid; }
          .print-org-name { white-space: nowrap !important; word-break: keep-all !important; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
      `}</style>
    </div>
  )
}
