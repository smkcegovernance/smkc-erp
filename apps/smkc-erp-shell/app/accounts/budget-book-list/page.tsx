'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import PrintBudgetReport, { PrintData } from '@/app/components/PrintBudgetReport'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BudgetEntry {
  bookEntryNo: number
  finalBookEntryNo: number
  finYear: string
  acSubhead: string
  acSubheadName: string
  proposedWorkAmount: number
  finalProposedWorkAmount: number
  budgetAmount: number
  remainingBudgetAmount: number
  enteredBy: string
  entryDate: string
  finalEntryDate: string | null
  status: string
  deptCode: number
  deptName: string
  workName: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildFinYears(): string[] {
  const now = new Date()
  const cal = now.getFullYear()
  const fy = now.getMonth() >= 3 ? cal : cal - 1
  const years: string[] = []
  for (let y = fy; y >= fy - 4; y--) years.push(`${y}-${y + 1}`)
  return years
}

function fmtCurrency(n: number): string {
  if (!n) return '—'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BudgetBookListPage() {
  const { T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const FIN_YEARS = buildFinYears()

  // Filters
  const [finYear, setFinYear] = useState(FIN_YEARS[0] ?? '2025-2026')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')  // '' | 'primary' | 'final'
  const [pageNo, setPageNo] = useState(1)
  const PAGE_SIZE = 20

  // Data
  const [entries, setEntries] = useState<BudgetEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Print
  const [printData, setPrintData] = useState<PrintData | null>(null)
  const [loadingPrint, setLoadingPrint] = useState<number | null>(null)

  // ── Fetch entries ──────────────────────────────────────────────────────────

  const fetchEntries = useCallback(async (fy: string, page: number, q: string, st: string) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        finYear: fy,
        pageNo: String(page),
        pageSize: String(PAGE_SIZE),
      })
      if (q.trim()) params.set('search', q.trim())
      if (st) params.set('status', st)
      const res = await fetch(`/api/accounts/budget-book/list?${params}`)
      const json = await res.json()
      if (json.success) {
        setEntries(json.data ?? [])
        setTotalCount(json.totalCount ?? 0)
        setTotalPages(json.totalPages ?? 0)
      } else {
        setError(json.message ?? 'माहिती लोड होत नाही.')
      }
    } catch {
      setError('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search input; immediate on other filter changes
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSearch = useRef(search)

  useEffect(() => {
    const isSearchChange = search !== prevSearch.current
    prevSearch.current = search
    const delay = isSearchChange ? 400 : 0
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchEntries(finYear, pageNo, search, statusFilter), delay)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [finYear, pageNo, search, statusFilter, fetchEntries])

  // ── Print a single entry ───────────────────────────────────────────────────

  const handlePrint = useCallback(async (bookEntryNo: number) => {
    setLoadingPrint(bookEntryNo)
    try {
      const res = await fetch(`/api/accounts/budget-book/primary/${bookEntryNo}`)
      const json = await res.json()
      if (json.success && json.data) {
        const e = json.data as BudgetEntry
        const isPrimary = !e.status || e.status.toLowerCase() !== 'y'
        const remainingBefore = e.remainingBudgetAmount + e.proposedWorkAmount
        const remainingAfterFinal = remainingBefore - (e.finalProposedWorkAmount || 0)

        setPrintData({
          type: isPrimary ? 'primary' : 'final',
          bookEntryNo: e.bookEntryNo,
          finalBookEntryNo: e.finalBookEntryNo ?? 0,
          finYear: e.finYear,
          deptName: e.deptName || String(e.deptCode),
          workName: e.workName,
          acSubhead: e.acSubhead,
          acSubheadName: e.acSubheadName,
          budgetAmount: e.budgetAmount,
          // Primary: remaining before primary = totalBudget (remainingStored + primaryAmt)
          // Final:   remaining before final   = remainingStored (= after primary, before final)
          remainingBefore: isPrimary ? remainingBefore : e.remainingBudgetAmount,
          proposedAmount: isPrimary ? e.proposedWorkAmount : (e.finalProposedWorkAmount || 0),
          remainingAfter: isPrimary ? e.remainingBudgetAmount : remainingAfterFinal,
          entryDate: isPrimary ? e.entryDate : (e.finalEntryDate ?? e.entryDate),
        })
      } else {
        alert('नोंद माहिती लोड होत नाही.')
      }
    } catch {
      alert('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setLoadingPrint(null)
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="dept-layout">
      <DeptSidebar deptKey="accounts" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

      <main className="erp-main">
        {/* Breadcrumb */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <Link href="/accounts/dashboard" className="dash-breadcrumb-home">{T.depts['accounts']?.label ?? 'Accounts'}</Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="dash-breadcrumb-current">लेखाशीर्ष तरतूद नोंद यादी</span>
        </nav>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1a3a5c 0%, #112540 100%)',
          padding: '20px 28px', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <i className="bi bi-journal-text" style={{ fontSize: '1.6rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              लेखा विभाग — तरतूद नोंद
            </div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
              लेखाशीर्ष तरतूद नोंद यादी
            </h1>
          </div>
          <button
            type="button"
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.85rem' }}
            onClick={() => setSidebarOpen(o => !o)}
          >
            <i className={`bi bi-layout-sidebar${sidebarOpen ? '-reverse' : ''}`} />
          </button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Filters */}
          <div style={{
            background: '#fff', borderRadius: 14,
            boxShadow: '0 2px 8px rgba(18,49,76,0.08)',
            border: '1px solid #e0eaf2', marginBottom: 20,
          }}>
            <div style={{
              padding: '14px 22px', borderBottom: '1px solid #e8f0f8',
              background: '#f7fafd', borderRadius: '14px 14px 0 0',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <i className="bi bi-funnel-fill" style={{ color: '#1a3a5c', fontSize: '1rem' }} />
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#18324a' }}>शोध फिल्टर</h2>
            </div>
            <div style={{ padding: '16px 22px', display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {/* Financial Year */}
              <div style={{ minWidth: 160 }}>
                <label style={LABEL_STYLE}>आर्थिक वर्ष <span style={{ color: '#c0392b' }}>*</span></label>
                <select
                  value={finYear}
                  onChange={e => { setFinYear(e.target.value); setPageNo(1) }}
                  style={SELECT_STYLE}
                >
                  {FIN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              {/* Search */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={LABEL_STYLE}>शोधा (कामाचे नाव / नस्ती क्र. / लेखाशीर्ष)</label>
                <div style={{ position: 'relative' }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9aabbf', fontSize: '0.9rem' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPageNo(1) }}
                    placeholder="कामाचे नाव, नस्ती क्र., लेखाशीर्ष..."
                    style={{ ...INPUT_STYLE, paddingLeft: 32 }}
                  />
                  {search && (
                    <button type="button" onClick={() => { setSearch(''); setPageNo(1) }}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aabbf', fontSize: '1rem', padding: 0, lineHeight: 1 }}
                    >×</button>
                  )}
                </div>
              </div>
              {/* Status filter */}
              <div style={{ minWidth: 150 }}>
                <label style={LABEL_STYLE}>स्थिती</label>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setPageNo(1) }}
                  style={SELECT_STYLE}
                >
                  <option value="">— सर्व —</option>
                  <option value="primary">प्राथमिक नोंद</option>
                  <option value="final">अंतिम नोंद</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div style={{
            background: '#fff', borderRadius: 14,
            boxShadow: '0 2px 8px rgba(18,49,76,0.08)',
            border: '1px solid #e0eaf2',
          }}>
            <div style={{
              padding: '14px 22px', borderBottom: '1px solid #e8f0f8',
              background: '#f7fafd', borderRadius: '14px 14px 0 0',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <i className="bi bi-table" style={{ color: '#1a3a5c', fontSize: '1rem' }} />
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#18324a' }}>
                नोंदी
                {!loading && totalCount > 0 && (
                  <span style={{ fontWeight: 400, color: '#5e7388', marginLeft: 8, fontSize: '0.85rem' }}>
                    ({totalCount} एकूण &mdash; पान {pageNo}/{totalPages || 1})
                  </span>
                )}
              </h2>
              {loading && (
                <span className="spinner-border spinner-border-sm ms-2" role="status"
                  style={{ color: '#1a3a5c' }} />
              )}
            </div>

            {error && (
              <div style={{
                padding: '14px 22px', color: '#c63b31', fontSize: '0.88rem', fontWeight: 500,
                background: '#fff5f5', borderBottom: '1px solid #f5c2c7',
              }}>
                <i className="bi bi-exclamation-triangle-fill me-2" />{error}
              </div>
            )}

            {!loading && !error && entries.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9aabbf' }}>
                <i className="bi bi-inbox" style={{ fontSize: '2rem', display: 'block', marginBottom: 8 }} />
                <div>कोणत्याही नोंदी सापडल्या नाहीत</div>
              </div>
            )}

            {entries.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse',
                  fontSize: '0.82rem',
                }}>
                  <thead>
                    <tr style={{ background: '#f0f6fc' }}>
                      {[
                        'नोंद क्र.', 'आर्थिक वर्ष', 'विभाग', 'लेखाशीर्ष',
                        'कामाचे नाव', 'प्राथमिक रक्कम', 'अंतिम रक्कम',
                        'स्थिती', 'तारीख', 'मुद्रित'
                      ].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px', textAlign: 'left',
                          color: '#3d4f60', fontWeight: 700,
                          borderBottom: '2px solid #dde6ef',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e, idx) => {
                      const isFinal = e.status?.toLowerCase() === 'y'
                      return (
                        <tr
                          key={`${e.bookEntryNo}-${idx}`}
                          style={{
                            borderBottom: '1px solid #f0f4f8',
                            background: idx % 2 === 0 ? '#fff' : '#fafcff',
                          }}
                        >
                          <td style={{ padding: '9px 12px', fontWeight: 700, color: '#1a3a5c' }}>
                            {e.bookEntryNo}
                          </td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>{e.finYear}</td>
                          <td style={{ padding: '9px 12px', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.deptName || e.deptCode}
                          </td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600 }}>{e.acSubhead}</span>
                            {e.acSubheadName && (
                              <span style={{ color: '#9aabbf', marginLeft: 4, fontSize: '0.78rem' }}>
                                {e.acSubheadName.length > 25 ? e.acSubheadName.slice(0, 25) + '…' : e.acSubheadName}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '9px 12px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.workName || '—'}
                          </td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                            ₹ {fmtCurrency(e.proposedWorkAmount)}
                          </td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', fontWeight: 500, color: isFinal ? '#117a5d' : '#9aabbf' }}>
                            {isFinal ? `₹ ${fmtCurrency(e.finalProposedWorkAmount)}` : '—'}
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700,
                              background: isFinal ? '#e6f7f1' : '#fef3e2',
                              color: isFinal ? '#0a5240' : '#92400e',
                            }}>
                              {isFinal ? 'अंतिम' : 'प्राथमिक'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: '#5e7388' }}>
                            {fmtDate(isFinal ? e.finalEntryDate : e.entryDate)}
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <button
                              type="button"
                              title="मुद्रित करा"
                              style={{
                                padding: '5px 12px', borderRadius: 6, border: 'none',
                                background: '#c0392b', color: '#fff',
                                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 5,
                                opacity: loadingPrint === e.bookEntryNo ? 0.7 : 1,
                              }}
                              disabled={loadingPrint === e.bookEntryNo}
                              onClick={() => handlePrint(e.bookEntryNo)}
                            >
                              {loadingPrint === e.bookEntryNo
                                ? <span className="spinner-border spinner-border-sm" role="status" />
                                : <i className="bi bi-printer-fill" />}
                              मुद्रित
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '12px 22px', borderTop: '1px solid #f0f4f8',
                display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap',
              }}>
                <button
                  type="button"
                  style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a3a5c', fontWeight: 600, fontSize: '0.82rem', cursor: pageNo <= 1 ? 'not-allowed' : 'pointer', opacity: pageNo <= 1 ? 0.4 : 1 }}
                  disabled={pageNo <= 1}
                  onClick={() => setPageNo(1)}
                ><i className="bi bi-chevron-double-left" /></button>
                <button
                  type="button"
                  style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a3a5c', fontWeight: 600, fontSize: '0.82rem', cursor: pageNo <= 1 ? 'not-allowed' : 'pointer', opacity: pageNo <= 1 ? 0.4 : 1 }}
                  disabled={pageNo <= 1}
                  onClick={() => setPageNo(p => p - 1)}
                ><i className="bi bi-chevron-left" /> मागे</button>

                {/* Page number buttons — show at most 7 around current */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - pageNo) <= 2)
                  .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, i) =>
                    item === 'ellipsis'
                      ? <span key={`e${i}`} style={{ padding: '5px 6px', color: '#9aabbf', fontSize: '0.82rem' }}>…</span>
                      : <button
                          key={item}
                          type="button"
                          onClick={() => setPageNo(item as number)}
                          style={{ padding: '5px 11px', borderRadius: 7, border: '1.5px solid', borderColor: pageNo === item ? '#1a3a5c' : '#d5e1ea', background: pageNo === item ? '#1a3a5c' : '#fff', color: pageNo === item ? '#fff' : '#1a3a5c', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                        >{item as number}</button>
                  )}

                <button
                  type="button"
                  style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a3a5c', fontWeight: 600, fontSize: '0.82rem', cursor: pageNo >= totalPages ? 'not-allowed' : 'pointer', opacity: pageNo >= totalPages ? 0.4 : 1 }}
                  disabled={pageNo >= totalPages}
                  onClick={() => setPageNo(p => p + 1)}
                >पुढे <i className="bi bi-chevron-right" /></button>
                <button
                  type="button"
                  style={{ padding: '5px 14px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a3a5c', fontWeight: 600, fontSize: '0.82rem', cursor: pageNo >= totalPages ? 'not-allowed' : 'pointer', opacity: pageNo >= totalPages ? 0.4 : 1 }}
                  disabled={pageNo >= totalPages}
                  onClick={() => setPageNo(totalPages)}
                ><i className="bi bi-chevron-double-right" /></button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Print modal */}
      {printData && (
        <PrintBudgetReport
          data={printData}
          onClose={() => setPrintData(null)}
        />
      )}
    </div>
  )
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 5,
  fontSize: '0.82rem', fontWeight: 600, color: '#3d4f60',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #d5e1ea', fontSize: '0.92rem', color: '#18324a',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
}

const SELECT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #d5e1ea', fontSize: '0.92rem', color: '#18324a',
  outline: 'none', background: '#fff', cursor: 'pointer', appearance: 'auto',
}
