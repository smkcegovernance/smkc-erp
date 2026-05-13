'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import DeptSidebar from '@/app/components/DeptSidebar'
import WorkProposalPrintReport, { type WorkProposalPrintData } from '@/app/components/WorkProposalPrintReport'
import Link from 'next/link'
import { currentUser } from '@smkc/auth'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorkProposalListItem {
  orderNo: number
  proposalType: string   // 'Q' | 'T'
  finYear: string
  deptCode: number
  deptName: string
  nastiNo: string
  workName: string
  acSubhead: string
  acSubheadName: string
  proposalCost: number
  enteredBy: string
  entryDate: string
  wardNos: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildFinYears = (): string[] => {
  const now = new Date()
  const cal = now.getFullYear()
  const fy = now.getMonth() >= 3 ? cal : cal - 1
  const years: string[] = []
  for (let y = fy; y >= fy - 2; y--) years.push(`${y}-${y + 1}`)
  return years
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
    return `${dd}-${mm}-${d.getFullYear()}`
  } catch { return iso }
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 600, color: '#5e7388',
}
const SELECT_STYLE: React.CSSProperties = {
  border: '1.5px solid #c8d8e8', borderRadius: 8, padding: '8px 12px',
  fontSize: '0.88rem', color: '#18324a', background: '#fff', outline: 'none',
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkProposalsListPage() {
  const user = currentUser()
  const { T } = useLanguage()
  const router = useRouter()
  const FIN_YEARS = buildFinYears()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [finYear, setFinYear] = useState(FIN_YEARS[0] ?? '2025-2026')
  const [typeFilter, setTypeFilter] = useState<'all' | 'Q' | 'T'>('all')
  const [search, setSearch] = useState('')

  const [proposals, setProposals] = useState<WorkProposalListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [printData, setPrintData] = useState<WorkProposalPrintData | null>(null)
  const [loadingPrint, setLoadingPrint] = useState<number | null>(null)

  // ── Load list ────────────────────────────────────────────────────────────

  const loadList = useCallback(async (fy: string) => {
    setLoading(true)
    setError('')
    try {
      const uid = user?.userId ?? ''
      const params = new URLSearchParams({ finYear: fy })
      if (uid) params.set('userId', uid)
      const res = await fetch(`/api/general-administration/work-proposals/list?${params}`)
      const json = await res.json()
      if (json.success) {
        setProposals(json.data ?? [])
      } else {
        setError(json.message ?? 'डेटा लोड करताना त्रुटी')
      }
    } catch {
      setError('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  useEffect(() => { loadList(finYear) }, [finYear, loadList])

  // ── Load detail for print ────────────────────────────────────────────────

  async function handlePrint(item: WorkProposalListItem) {
    setLoadingPrint(item.orderNo)
    try {
      const res = await fetch(`/api/general-administration/work-proposals/detail?type=${item.proposalType}&orderNo=${item.orderNo}`)
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        setPrintData({
          orderNo: d.orderNo,
          proposalType: d.proposalType,
          finYear: d.finYear,
          deptName: d.deptName,
          nastiType: d.nastiType ?? '',
          nastiNo: d.nastiNo ?? '',
          workName: d.workName,
          workPlace: d.workPlace,
          mapAttached: d.mapAttached,
          wardNos: d.wardNos,
          workNeed: d.workNeed,
          workDoneBefore: d.workDoneBefore,
          workAmount: d.workAmount,
          techApproval: d.techApproval,
          techSanctionNo: d.techSanctionNo,
          techSanctionDate: d.techSanctionDate,
          dsrRates: d.dsrRates,
          placeOwnership: d.placeOwnership,
          nocDocAttached: d.nocDocAttached,
          nocCertificate: d.nocCertificate,
          anyDispute: d.anyDispute,
          courtCase: d.courtCase,
          caseDetails: d.caseDetails,
          townPlanCheck: d.townPlanCheck,
          townPlanApproval: d.townPlanApproval,
          expendValid: d.expendValid,
          stockListAttached: d.stockListAttached,
          photoAttached: d.photoAttached,
          acSubhead: d.acSubhead,
          acSubheadName: d.acSubheadName ?? '',
          proposalCost: d.proposalCost,
          budgetAmount: d.budgetAmount,
          acHeadValid: d.acHeadValid,
          otherDept: d.otherDept,
          workSplit: d.workSplit,
          maintenancePeriod: d.maintenancePeriod,
          prevMaintenance: d.prevMaintenance,
          competentOfficer: d.competentOfficer,
          remarks: d.remarks,
          enteredBy: d.enteredBy,
          entryDate: d.entryDate,
        })
      } else {
        alert(json.message ?? 'प्रस्ताव सापडला नाही.')
      }
    } catch {
      alert('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setLoadingPrint(null)
    }
  }

  // ── Filtered data ────────────────────────────────────────────────────────

  const filtered = proposals.filter(p => {
    if (typeFilter !== 'all' && p.proposalType !== typeFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        p.workName?.toLowerCase().includes(q) ||
        p.deptName?.toLowerCase().includes(q) ||
        p.acSubhead?.toLowerCase().includes(q) ||
        p.nastiNo?.toLowerCase().includes(q) ||
        String(p.orderNo).includes(q)
      )
    }
    return true
  })

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI', 'Noto Sans Devanagari', sans-serif" }}>
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
          <span className="dash-breadcrumb-current">माझे कार्य प्रस्ताव</span>
        </nav>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: '#fff', boxShadow: '0 4px 20px rgba(45,106,79,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-journal-text" style={{ fontSize: '1.6rem' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>माझे कार्य प्रस्ताव</h1>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '0.88rem' }}>नोंदवलेले दरपत्रक व निविदा प्रस्ताव — सामान्य प्रशासन विभाग</p>
            </div>
          </div>
        </div>

        {/* Filters bar */}
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(18,49,76,0.07)', padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={LABEL_STYLE}>आर्थिक वर्ष</label>
            <select value={finYear} onChange={e => setFinYear(e.target.value)} style={SELECT_STYLE}>
              {FIN_YEARS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
            </select>
          </div>
          <div>
            <label style={LABEL_STYLE}>प्रस्ताव प्रकार</label>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as 'all' | 'Q' | 'T')} style={SELECT_STYLE}>
              <option value="all">सर्व</option>
              <option value="Q">दरपत्रक (₹10 लाखांपर्यंत)</option>
              <option value="T">निविदा (₹10 लाखांवर)</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={LABEL_STYLE}>शोधा</label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9aabbf', fontSize: '0.9rem', pointerEvents: 'none' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="कामाचे नाव, विभाग, लेखाशीर्ष, क्रमांक..."
                style={{ ...SELECT_STYLE, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => loadList(finYear)}
            style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#2d6a4f', color: '#fff', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="bi bi-arrow-clockwise" /> ताजे करा
          </button>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
          {[
            { label: 'एकूण प्रस्ताव', value: proposals.length, color: '#2d6a4f', bg: '#d8f3dc', icon: 'bi-file-earmark-text-fill' },
            { label: 'दरपत्रक प्रस्ताव', value: proposals.filter(p => p.proposalType === 'Q').length, color: '#c0392b', bg: '#fff0ee', icon: 'bi-file-earmark-plus-fill' },
            { label: 'निविदा प्रस्ताव', value: proposals.filter(p => p.proposalType === 'T').length, color: '#1a6db5', bg: '#e8f3ff', icon: 'bi-file-earmark-arrow-up-fill' },
          ].map(stat => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`bi ${stat.icon}`} style={{ color: '#fff', fontSize: '1.2rem' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#5e7388', fontWeight: 600 }}>{stat.label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color, lineHeight: 1.2 }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table card */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(18,49,76,0.08)', overflow: 'hidden' }}>

          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9aabbf' }}>
              <span className="spinner-border spinner-border-sm me-2" role="status" />
              प्रस्ताव लोड होत आहेत...
            </div>
          ) : error ? (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: '#c0392b' }}>
              <i className="bi bi-exclamation-triangle-fill me-2" />{error}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9aabbf' }}>
              <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>कोणतेही प्रस्ताव आढळले नाहीत</div>
              <div style={{ fontSize: '0.85rem', marginTop: 4 }}>
                {proposals.length === 0 ? `${finYear} साठी कोणताही प्रस्ताव नोंदवलेला नाही.` : 'निवडलेल्या फिल्टरनुसार कोणतेही प्रस्ताव नाहीत.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#f7fafd', borderBottom: '2px solid #e0eaf2' }}>
                    {['क्र.', 'प्रकार', 'क्रमांक', 'कामगिरीचे नाव', 'विभाग', 'लेखाशीर्ष', 'प्रस्तावित खर्च', 'दिनांक', 'कृती'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#3d4f60', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => (
                    <tr key={`${p.proposalType}-${p.orderNo}-${idx}`} style={{ borderBottom: '1px solid #f0f4f8', background: idx % 2 === 0 ? '#fff' : '#fafcfe' }}>
                      <td style={{ padding: '11px 14px', color: '#9aabbf', fontSize: '0.78rem' }}>{idx + 1}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 700,
                          background: p.proposalType === 'Q' ? '#fff0ee' : '#e8f3ff',
                          color: p.proposalType === 'Q' ? '#c0392b' : '#1a6db5',
                          border: `1px solid ${p.proposalType === 'Q' ? '#c0392b40' : '#1a6db540'}`,
                        }}>
                          {p.proposalType === 'Q' ? 'दरपत्रक' : 'निविदा'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#2d6a4f' }}>#{p.orderNo}</td>
                      <td style={{ padding: '11px 14px', color: '#18324a', maxWidth: 280 }}>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                          {p.workName || '—'}
                        </div>
                        {p.nastiNo && <div style={{ fontSize: '0.76rem', color: '#9aabbf', marginTop: 2 }}>नस्ती: {p.nastiNo}</div>}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#5e7388', whiteSpace: 'nowrap' }}>{p.deptName || '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#5e7388', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{p.acSubhead || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#18324a', whiteSpace: 'nowrap' }}>
                        ₹ {fmtCurrency(p.proposalCost)}
                      </td>
                      <td style={{ padding: '11px 14px', color: '#9aabbf', whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{fmtDate(p.entryDate)}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            title="मुद्रित करा"
                            onClick={() => handlePrint(p)}
                            disabled={loadingPrint === p.orderNo}
                            style={{
                              padding: '6px 10px', borderRadius: 7, border: 'none',
                              background: loadingPrint === p.orderNo ? '#e0eaf2' : '#2d6a4f',
                              color: loadingPrint === p.orderNo ? '#9aabbf' : '#fff',
                              fontWeight: 600, fontSize: '0.78rem', cursor: loadingPrint === p.orderNo ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {loadingPrint === p.orderNo
                              ? <><span className="spinner-border spinner-border-sm" role="status" /> लोड...</>
                              : <><i className="bi bi-printer-fill" /> मुद्रित</>}
                          </button>
                          <button
                            type="button"
                            title="लेखा अभिप्राय"
                            onClick={() => router.push(`/general-administration/work-proposals/account-remark?orderNo=${p.orderNo}&type=${p.proposalType}`)}
                            style={{
                              padding: '6px 10px', borderRadius: 7, border: 'none',
                              background: '#1a5276', color: '#fff',
                              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <i className="bi bi-calculator-fill" /> लेखा
                          </button>
                          <button
                            type="button"
                            title="लेखापरीक्षण अभिप्राय"
                            onClick={() => router.push(`/general-administration/work-proposals/audit-remark?orderNo=${p.orderNo}&type=${p.proposalType}`)}
                            style={{
                              padding: '6px 10px', borderRadius: 7, border: 'none',
                              background: '#9d6e00', color: '#fff',
                              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <i className="bi bi-clipboard2-check-fill" /> लेखापरीक्षण
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && !error && filtered.length > 0 && (
          <div style={{ marginTop: 12, fontSize: '0.8rem', color: '#9aabbf', textAlign: 'right' }}>
            {filtered.length} पैकी {filtered.length} प्रस्ताव दर्शवित आहे
            {search && ` (शोध: "${search}")`}
          </div>
        )}

      </div>

      {printData && <WorkProposalPrintReport data={printData} onClose={() => setPrintData(null)} />}
    </div>
  )
}
