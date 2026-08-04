'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import { currentUser } from '@smkc/auth'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ProposalListItem {
  orderNo: number
  proposalType: string
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
}

interface RemarkFormData {
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

const buildFinYears = (): string[] => {
  const now = new Date()
  const cal = now.getFullYear()
  const fy = now.getMonth() >= 3 ? cal : cal - 1
  const years: string[] = []
  for (let y = fy; y >= fy - 2; y--) years.push(`${y}-${y + 1}`)
  return years
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)

const fmtDate = (iso: string): string => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
    return `${dd}-${mm}-${d.getFullYear()}`
  } catch { return iso }
}

const todayDMY = (): string => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', border: '1.5px solid #b6d0e8', borderRadius: 8,
  padding: '9px 12px', fontSize: '0.92rem', color: '#18324a',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 5, fontSize: '0.82rem',
  fontWeight: 700, color: '#1a5276', letterSpacing: '0.02em',
}
const READONLY_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, background: '#f0f6fb', color: '#3d5166', cursor: 'not-allowed', border: '1.5px solid #c8daea',
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkProposalRemarksPage() {
  const user = currentUser()
  const { T } = useLanguage()
  const FIN_YEARS = buildFinYears()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ── Popup state ─────────────────────────────────────────────────────────────
  type PopupTone = 'success' | 'error' | 'info' | 'warning'
  const [popup, setPopup] = useState<{ tone: PopupTone; title: string; description?: string } | null>(null)
  const showPopup = (tone: PopupTone, title: string, description?: string) => setPopup({ tone, title, description })

  // ── List state ─────────────────────────────────────────────────────────────
  const [finYear, setFinYear] = useState(FIN_YEARS[0] ?? '2025-2026')
  const [search, setSearch] = useState('')
  const [pageNo, setPageNo] = useState(1)
  const PAGE_SIZE = 20
  const [proposals, setProposals] = useState<ProposalListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')

  // ── Remark form state ──────────────────────────────────────────────────────
  const [selectedProposal, setSelectedProposal] = useState<RemarkFormData | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [budget, setBudget] = useState('')
  const [proposalCost, setProposalCost] = useState('')
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [saved, setSaved] = useState(false)

  // ── Load proposals ─────────────────────────────────────────────────────────

  const loadProposals = useCallback(async (fy: string, page: number, q: string) => {
    setListLoading(true)
    setListError('')
    try {
      const params = new URLSearchParams({
        finYear: fy,
        pageNo: String(page),
        pageSize: String(PAGE_SIZE),
      })
      if (q.trim()) params.set('search', q.trim())
      const res = await fetch(`/api/general-administration/work-proposals/list?${params}`)
      const json = await res.json()
      if (json.success) {
        setProposals(json.data ?? [])
        setTotalCount(json.totalCount ?? 0)
        setTotalPages(json.totalPages ?? 0)
      } else {
        setListError(json.message ?? 'डेटा लोड करताना त्रुटी')
      }
    } catch {
      setListError('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setListLoading(false)
    }
  }, [])

  // Debounce: 400ms on search change, immediate on finYear / pageNo change
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevSearch = useRef(search)

  useEffect(() => {
    const isSearchChange = search !== prevSearch.current
    prevSearch.current = search
    const delay = isSearchChange ? 400 : 0
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadProposals(finYear, pageNo, search), delay)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [finYear, pageNo, search, loadProposals])

  // ── Open remark form for a proposal ───────────────────────────────────────

  async function handleOpenRemark(item: ProposalListItem) {
    setSelectedProposal(null)
    setSaveMsg(null)
    setSaved(false)
    setFormLoading(true)
    try {
      const params = new URLSearchParams({ orderNo: String(item.orderNo), type: item.proposalType, remarkType: 'account' })
      const res = await fetch(`/api/general-administration/work-proposals/for-remark?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data as RemarkFormData
        setSelectedProposal(d)
        setBudget(String(d.budgetAmount))
        setProposalCost(String(d.proposalCost))
        setRemark(d.existingRemark?.trim() === ' ' ? '' : (d.existingRemark ?? ''))
      } else {
        showPopup('error', 'प्रस्ताव सापडला नाही', json.message)
      }
    } catch {
      showPopup('error', 'सर्व्हर त्रुटी', 'सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Save remark ─────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedProposal) return
    const bAmt = parseFloat(budget) || 0
    const pCost = parseFloat(proposalCost) || 0

    setSaving(true)
    setSaveMsg(null)
    try {
      const body = {
        orderNo: selectedProposal.orderNo,
        proposalType: selectedProposal.proposalType,
        remarkType: 'account',
        acSubhead: selectedProposal.acSubhead,
        budgetAmount: bAmt,
        proposalCost: pCost,
        remark,
        userId: user?.userId ?? 'ERP',
      }
      const res = await fetch('/api/general-administration/work-proposals/save-remark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setSaveMsg({ type: 'success', text: 'लेखा अभिप्राय यशस्वीपणे जतन केला.' })
        setSaved(true)
        showPopup('success', 'यशस्वी!', 'लेखा अभिप्राय यशस्वीपणे जतन केला.')
      } else {
        showPopup('error', 'जतन करताना त्रुटी', json.message ?? 'कृपया पुन्हा प्रयत्न करा.')
      }
    } catch {
      showPopup('error', 'सर्व्हर त्रुटी', 'सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setSaving(false)
    }
  }

  // ── Print remark slip ───────────────────────────────────────────────────────

  function handlePrint() {
    window.print()
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const remainingBudget = (parseFloat(budget) || 0) - (parseFloat(proposalCost) || 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @page { size: A4 portrait; margin: 15mm 18mm; }
        @media print {
          body * { visibility: hidden !important; }
          #account-remark-print-slip, #account-remark-print-slip * { visibility: visible !important; }
          #account-remark-print-slip {
            position: fixed; left: 0; top: 0; width: 100%;
            background: #fff; padding: 0; z-index: 9999;
          }
          .no-print { display: none !important; }
        }
        @media screen {
          #account-remark-print-slip { display: none; }
        }
      `}</style>

      {/* ── Print slip (only visible during print) ── */}
      {selectedProposal && (
        <div id="account-remark-print-slip">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: '13pt', fontWeight: 800, fontFamily: 'Times New Roman, serif' }}>
              सांगली-मिरज-कुपवाड शहर महानगरपालिका
            </div>
            <div style={{ fontSize: '11pt', fontWeight: 700, marginTop: 4 }}>लेखा विभागाचे अभिप्राय</div>
            <div style={{ fontSize: '9pt', color: '#555', marginTop: 2 }}>Accounts Department Remarks — Work Proposal</div>
            <div style={{ borderBottom: '2px solid #000', marginTop: 10 }} />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: 14 }}>
            <tbody>
              {[
                ['विभागाचे नाव', selectedProposal.deptName],
                ['नस्ती क्रमांक', `${selectedProposal.finYear} / ${selectedProposal.nastiNo}`],
                ['कामगिरीचे नाव', selectedProposal.workName],
                ['अनुज्ञेय लेखाशीर्ष', selectedProposal.acSubheadName ? `${selectedProposal.acSubhead} — ${selectedProposal.acSubheadName}` : selectedProposal.acSubhead],
                ['अर्थसंकल्पीय तरतूद', `₹ ${fmtCurrency(parseFloat(budget) || selectedProposal.budgetAmount)}`],
                ['प्रस्तावित कामाचा खर्च', `₹ ${fmtCurrency(parseFloat(proposalCost) || selectedProposal.proposalCost)}`],
                ['राहणारी शिल्लक रक्कम', `₹ ${fmtCurrency(remainingBudget)}`],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '4px 8px', border: '1px solid #aaa', fontWeight: 600, width: '35%', background: '#f5f5f5' }}>{label}</td>
                  <td style={{ padding: '4px 8px', border: '1px solid #aaa' }}>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '10pt' }}>सादर प्रस्तावाची छाननी:</div>
            <p style={{ fontSize: '10pt', lineHeight: 1.7, margin: 0, padding: '6px 10px', border: '1px solid #aaa', background: '#fafafa' }}>
              सादर प्रस्तावाची छाननी करण्यात आली असून लेखाशीर्ष प्रस्तावित कामगिरीसाठी अनुज्ञेय आहे.
              कामगिरी अन्य विभाग / अन्य योजना यातून या विभागाकडे पूर्वी प्रस्तावित झालेली नाही अथवा पार पडलेली नाही.
              कामगिरी करण्यास विभागाची शिफारस आहे.
            </p>
          </div>

          {remark.trim() && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: '10pt' }}>अन्य अभिप्राय:</div>
              <div style={{ padding: '6px 10px', border: '1px solid #aaa', fontSize: '10pt', lineHeight: 1.7, background: '#fafafa', minHeight: 50 }}>
                {remark}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36 }}>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: '9pt' }}>
                <div>दिनांक: {todayDMY()}</div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>लेखाधिकारी / लेखापाल</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', width: '40%' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: 6, fontSize: '9pt' }}>
                <div>&nbsp;</div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>विभागप्रमुख — लेखा विभाग</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: '8pt', color: '#777', borderTop: '1px solid #ddd', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>क्रमांक: {selectedProposal.orderNo}</span>
            <span>नोंदवलेले: {user?.userId ?? 'ERP'}</span>
            <span>दिनांक: {todayDMY()}</span>
          </div>
        </div>
      )}

      {/* ── Generic popup modal ── */}
      {popup && (
        <ErpPopup
          open
          tone={popup.tone}
          title={popup.title}
          description={popup.description}
          onClose={() => setPopup(null)}
        />
      )}

      {/* ── Screen UI ── */}
      <div className="no-print" style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI','Noto Sans Devanagari',sans-serif" }}>
        <DeptSidebar deptKey="accounts" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

        <div style={{ flex: 1, padding: '28px 24px', minWidth: 0 }}>

          {/* Breadcrumb */}
          <nav className="dash-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="dash-breadcrumb-home">
              <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
            </Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <Link href="/accounts/dashboard" className="dash-breadcrumb-home">{T.depts['accounts']?.label ?? 'Accounts'}</Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <span className="dash-breadcrumb-current">कार्य प्रस्ताव — लेखा अभिप्राय</span>
          </nav>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #1a5276 0%, #0e3460 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: '#fff', boxShadow: '0 4px 20px rgba(26,82,118,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-calculator-fill" style={{ fontSize: '1.6rem' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>लेखा विभागाचे अभिप्राय</h1>
                <p style={{ margin: 0, opacity: 0.85, fontSize: '0.88rem' }}>कार्य प्रस्तावांवर लेखा विभागाचे अभिप्राय नोंदवा</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedProposal ? '1fr 480px' : '1fr', gap: 20 }}>

            {/* ── Proposals list ── */}
            <div>
              {/* Filters */}
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(18,49,76,0.07)', padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 3, fontSize: '0.78rem', fontWeight: 600, color: '#5e7388' }}>आर्थिक वर्ष</label>
                  <select
                    value={finYear}
                    onChange={e => { setFinYear(e.target.value); setPageNo(1) }}
                    style={{ border: '1.5px solid #c8d8e8', borderRadius: 8, padding: '7px 12px', fontSize: '0.88rem', color: '#18324a', background: '#fff', outline: 'none' }}
                  >
                    {FIN_YEARS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', marginBottom: 3, fontSize: '0.78rem', fontWeight: 600, color: '#5e7388' }}>शोधा</label>
                  <div style={{ position: 'relative' }}>
                    <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9aabbf', fontSize: '0.85rem', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={search}
                      onChange={e => { setSearch(e.target.value); setPageNo(1) }}
                      placeholder="कामाचे नाव, विभाग, क्रमांक..."
                      style={{ border: '1.5px solid #c8d8e8', borderRadius: 8, padding: '7px 12px 7px 32px', fontSize: '0.88rem', color: '#18324a', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                    {search && (
                      <button type="button" onClick={() => { setSearch(''); setPageNo(1) }}
                        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aabbf', fontSize: '1rem', padding: 0, lineHeight: 1 }}
                      >×</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(18,49,76,0.08)', overflow: 'hidden' }}>
                {listLoading ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9aabbf' }}>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />प्रस्ताव लोड होत आहेत...
                  </div>
                ) : listError ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#c0392b' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2" />{listError}
                  </div>
                ) : proposals.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#9aabbf' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }} />
                    <div style={{ fontWeight: 600 }}>कोणतेही प्रस्ताव आढळले नाहीत</div>
                  </div>
                ) : (
                  <>
                  <div style={{ overflowX: 'auto' }}>
                    <div style={{ padding: '8px 14px', background: '#f7fafd', borderBottom: '1px solid #e8f0f7', fontSize: '0.78rem', color: '#5e7388', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{totalCount} एकूण प्रस्ताव</span>
                      {totalPages > 1 && <span>पान {pageNo} / {totalPages}</span>}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f0f6fb', borderBottom: '2px solid #c8daea' }}>
                          {['क्र.', 'क्रमांक', 'कामगिरीचे नाव', 'विभाग', 'खर्च', 'दिनांक', 'अभिप्राय'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#1a5276', whiteSpace: 'nowrap', fontSize: '0.78rem' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {proposals.map((p, idx) => {
                          const isSelected = selectedProposal?.orderNo === p.orderNo
                          return (
                            <tr
                              key={`${p.proposalType}-${p.orderNo}`}
                              style={{ borderBottom: '1px solid #f0f4f8', background: isSelected ? '#eaf3fb' : idx % 2 === 0 ? '#fff' : '#fafcfe', cursor: 'pointer' }}
                              onClick={() => handleOpenRemark(p)}
                            >
                              <td style={{ padding: '10px 14px', color: '#9aabbf', fontSize: '0.76rem' }}>{(pageNo - 1) * PAGE_SIZE + idx + 1}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1a5276' }}>#{p.orderNo}</td>
                              <td style={{ padding: '10px 14px', color: '#18324a', maxWidth: 240 }}>
                                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                                  {p.workName || '—'}
                                </div>
                                <div style={{ fontSize: '0.73rem', color: '#9aabbf', marginTop: 1 }}>
                                  <span style={{ background: p.proposalType === 'Q' ? '#fff0ee' : '#e8f3ff', color: p.proposalType === 'Q' ? '#c0392b' : '#1a6db5', padding: '1px 7px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700 }}>
                                    {p.proposalType === 'Q' ? 'दरपत्रक' : 'निविदा'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: '10px 14px', color: '#5e7388', fontSize: '0.82rem' }}>{p.deptName || '—'}</td>
                              <td style={{ padding: '10px 14px', fontWeight: 700, color: '#18324a', whiteSpace: 'nowrap' }}>₹ {fmtCurrency(p.proposalCost)}</td>
                              <td style={{ padding: '10px 14px', color: '#9aabbf', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{fmtDate(p.entryDate)}</td>
                              <td style={{ padding: '10px 14px' }}>
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); handleOpenRemark(p) }}
                                  style={{
                                    padding: '5px 12px', borderRadius: 7, border: 'none',
                                    background: isSelected ? '#0e3460' : '#1a5276',
                                    color: '#fff', fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  <i className="bi bi-pencil-fill" /> अभिप्राय
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div style={{
                      padding: '10px 14px', borderTop: '1px solid #f0f4f8',
                      display: 'flex', gap: 5, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap',
                    }}>
                      <button type="button"
                        style={{ padding: '4px 12px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a5276', fontWeight: 600, fontSize: '0.78rem', cursor: pageNo <= 1 ? 'not-allowed' : 'pointer', opacity: pageNo <= 1 ? 0.4 : 1 }}
                        disabled={pageNo <= 1} onClick={() => setPageNo(1)}>
                        <i className="bi bi-chevron-double-left" />
                      </button>
                      <button type="button"
                        style={{ padding: '4px 12px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a5276', fontWeight: 600, fontSize: '0.78rem', cursor: pageNo <= 1 ? 'not-allowed' : 'pointer', opacity: pageNo <= 1 ? 0.4 : 1 }}
                        disabled={pageNo <= 1} onClick={() => setPageNo(p => p - 1)}>
                        <i className="bi bi-chevron-left" /> मागे
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPages || Math.abs(p - pageNo) <= 2)
                        .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                          if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                          acc.push(p)
                          return acc
                        }, [])
                        .map((item, i) =>
                          item === 'ellipsis'
                            ? <span key={`e${i}`} style={{ padding: '4px 5px', color: '#9aabbf', fontSize: '0.78rem' }}>…</span>
                            : <button key={item} type="button" onClick={() => setPageNo(item as number)}
                                style={{ padding: '4px 10px', borderRadius: 7, border: '1.5px solid', borderColor: pageNo === item ? '#1a5276' : '#d5e1ea', background: pageNo === item ? '#1a5276' : '#fff', color: pageNo === item ? '#fff' : '#1a5276', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                              >{item as number}</button>
                        )}
                      <button type="button"
                        style={{ padding: '4px 12px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a5276', fontWeight: 600, fontSize: '0.78rem', cursor: pageNo >= totalPages ? 'not-allowed' : 'pointer', opacity: pageNo >= totalPages ? 0.4 : 1 }}
                        disabled={pageNo >= totalPages} onClick={() => setPageNo(p => p + 1)}>
                        पुढे <i className="bi bi-chevron-right" />
                      </button>
                      <button type="button"
                        style={{ padding: '4px 12px', borderRadius: 7, border: '1.5px solid #d5e1ea', background: '#fff', color: '#1a5276', fontWeight: 600, fontSize: '0.78rem', cursor: pageNo >= totalPages ? 'not-allowed' : 'pointer', opacity: pageNo >= totalPages ? 0.4 : 1 }}
                        disabled={pageNo >= totalPages} onClick={() => setPageNo(totalPages)}>
                        <i className="bi bi-chevron-double-right" />
                      </button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>

            {/* ── Remark form panel ── */}
            {selectedProposal && (
              <div>
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 20px rgba(26,82,118,0.12)', overflow: 'hidden', position: 'sticky', top: 20 }}>

                  {/* Panel header */}
                  <div style={{ background: 'linear-gradient(135deg, #1a5276 0%, #0e3460 100%)', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>लेखा अभिप्राय</div>
                      <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', marginTop: 2 }}>
                        #{selectedProposal.orderNo} — {selectedProposal.finYear}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedProposal(null); setSaveMsg(null); setSaved(false) }}
                      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '1rem' }}
                      title="बंद करा"
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>

                  {formLoading ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#9aabbf' }}>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />लोड होत आहे...
                    </div>
                  ) : (
                    <div style={{ padding: '18px 20px 24px' }}>

                      {/* Proposal info */}
                      <div style={{ background: '#eaf3fb', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7fb3d3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>विभाग</div>
                        <div style={{ fontWeight: 700, color: '#1a5276', fontSize: '0.9rem' }}>{selectedProposal.deptName}</div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7fb3d3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2, marginTop: 8 }}>कामगिरीचे नाव</div>
                        <div style={{ fontWeight: 600, color: '#18324a', fontSize: '0.88rem', lineHeight: 1.5 }}>{selectedProposal.workName}</div>
                      </div>

                      {/* Certification text */}
                      <div style={{ background: '#f7fafd', border: '1px solid #c8daea', borderRadius: 8, padding: '10px 12px', marginBottom: 18 }}>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: '#3d5166', lineHeight: 1.7, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                          सादर प्रस्तावाची छाननी करण्यात आली असून लेखाशीर्ष प्रस्तावित कामगिरीसाठी अनुज्ञेय आहे.
                          कामगिरी अन्य विभाग / अन्य योजना यातून या विभागाकडे पूर्वी प्रस्तावित झालेली नाही अथवा
                          पार पडलेली नाही. कामगिरी करण्यास विभागाची शिफारस आहे.
                        </p>
                      </div>

                      {/* AC Head */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={LABEL_STYLE}>अनुज्ञेय लेखाशीर्ष</label>
                        <input
                          type="text"
                          value={selectedProposal.acSubheadName
                            ? `${selectedProposal.acSubhead} — ${selectedProposal.acSubheadName}`
                            : selectedProposal.acSubhead}
                          readOnly
                          style={READONLY_STYLE}
                        />
                      </div>

                      {/* Budget + cost */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 14px', marginBottom: 14 }}>
                        <div>
                          <label style={LABEL_STYLE}>अर्थसंकल्पीय तरतूद (₹)</label>
                          <input
                            type="text"
                            value={fmtCurrency(parseFloat(budget) || 0)}
                            readOnly
                            style={READONLY_STYLE}
                          />
                        </div>
                        <div>
                          <label style={LABEL_STYLE}>प्रस्तावित खर्च (₹)</label>
                          <input
                            type="text"
                            value={fmtCurrency(parseFloat(proposalCost) || 0)}
                            readOnly
                            style={READONLY_STYLE}
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={LABEL_STYLE}>राहणारी शिल्लक (₹)</label>
                          <input
                            type="text"
                            value={fmtCurrency(remainingBudget)}
                            readOnly
                            style={{ ...READONLY_STYLE, fontWeight: 700, color: remainingBudget < 0 ? '#c0392b' : '#1a5276' }}
                          />
                        </div>
                      </div>

                      {/* Remark textarea */}
                      <div style={{ marginBottom: 16 }}>
                        <label style={LABEL_STYLE}>अन्य अभिप्राय (असल्यास)</label>
                        <textarea
                          value={remark}
                          onChange={e => setRemark(e.target.value)}
                          rows={4}
                          placeholder="लेखा विभागाचा अभिप्राय येथे नोंदवा..."
                          style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                        />
                      </div>

                      {/* Save message */}
                      {saveMsg && (
                        <div style={{
                          marginBottom: 14, padding: '9px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
                          background: saveMsg.type === 'success' ? '#eafaf1' : '#fdecea',
                          color: saveMsg.type === 'success' ? '#1e8449' : '#c0392b',
                          border: `1px solid ${saveMsg.type === 'success' ? '#a9dfbf' : '#f5c6cb'}`,
                        }}>
                          <i className={`bi ${saveMsg.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`} />
                          {saveMsg.text}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        {!saved ? (
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                              flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                              background: saving ? '#7fb3d3' : '#1a5276',
                              color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                              cursor: saving ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            }}
                          >
                            {saving
                              ? <><span className="spinner-border spinner-border-sm" role="status" /> जतन होत आहे...</>
                              : <><i className="bi bi-floppy-fill" /> जतन करा</>}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handlePrint}
                            style={{
                              flex: 1, padding: '10px 0', borderRadius: 9, border: 'none',
                              background: '#1a5276', color: '#fff', fontWeight: 700, fontSize: '0.88rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                            }}
                          >
                            <i className="bi bi-printer-fill" /> मुद्रित करा
                          </button>
                        )}
                        {saved && (
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                              padding: '10px 16px', borderRadius: 9, border: '1.5px solid #1a5276',
                              background: 'transparent', color: '#1a5276', fontWeight: 600, fontSize: '0.85rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            <i className="bi bi-arrow-repeat" /> पुन्हा जतन
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  )
}
