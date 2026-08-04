'use client'

import { useState, useEffect, useCallback } from 'react'
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
  deptCode: number
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
  width: '100%', border: '1.5px solid #c8b96a', borderRadius: 8,
  padding: '9px 12px', fontSize: '0.92rem', color: '#3a2e00',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 5, fontSize: '0.82rem',
  fontWeight: 700, color: '#7d5a00', letterSpacing: '0.02em',
}
const READONLY_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, background: '#fdf8ee', color: '#5a4800', cursor: 'not-allowed', border: '1.5px solid #d8c97a',
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AuditWorkProposalRemarksPage() {
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
  const [proposals, setProposals] = useState<ProposalListItem[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')

  // ── Remark form state ──────────────────────────────────────────────────────
  const [selectedProposal, setSelectedProposal] = useState<RemarkFormData | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [remark, setRemark] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // ── Load proposals (only accounts-processed ones) ──────────────────────────

  const loadProposals = useCallback(async (fy: string) => {
    setListLoading(true)
    setListError('')
    try {
      const params = new URLSearchParams({ finYear: fy, requireAccountRemark: 'true' })
      const res = await fetch(`/api/general-administration/work-proposals/list?${params}`)
      const json = await res.json()
      if (json.success) {
        setProposals(json.data ?? [])
      } else {
        setListError(json.message ?? 'डेटा लोड करताना त्रुटी')
      }
    } catch {
      setListError('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => { loadProposals(finYear) }, [finYear, loadProposals])

  // ── Open remark form ───────────────────────────────────────────────────────

  async function handleOpenRemark(item: ProposalListItem) {
    setSelectedProposal(null)
    setSaved(false)
    setFormLoading(true)
    try {
      const params = new URLSearchParams({ orderNo: String(item.orderNo), type: item.proposalType, remarkType: 'audit' })
      const res = await fetch(`/api/general-administration/work-proposals/for-remark?${params}`)
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data as RemarkFormData
        setSelectedProposal(d)
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
    if (!remark.trim()) {
      showPopup('warning', 'अभिप्राय आवश्यक', 'कृपया अभिप्राय लिहा.')
      return
    }

    setSaving(true)
    try {
      const body = {
        orderNo: selectedProposal.orderNo,
        proposalType: selectedProposal.proposalType,
        remarkType: 'audit',
        acSubhead: selectedProposal.acSubhead,
        budgetAmount: selectedProposal.budgetAmount,
        proposalCost: selectedProposal.proposalCost,
        remark,
        userId: user?.userId ?? 'ERP',
        deptCode: selectedProposal.deptCode,
      }
      const res = await fetch('/api/general-administration/work-proposals/save-remark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setSaved(true)
        showPopup('success', 'यशस्वी!', 'लेखापरीक्षण अभिप्राय यशस्वीपणे जतन केला.')
      } else {
        showPopup('error', 'जतन करताना त्रुटी', json.message ?? 'कृपया पुन्हा प्रयत्न करा.')
      }
    } catch {
      showPopup('error', 'सर्व्हर त्रुटी', 'सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setSaving(false)
    }
  }

  // ── Print slip ──────────────────────────────────────────────────────────────

  function handlePrint() {
    window.print()
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filtered = proposals.filter(p => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.workName?.toLowerCase().includes(q) ||
      p.deptName?.toLowerCase().includes(q) ||
      p.nastiNo?.toLowerCase().includes(q) ||
      String(p.orderNo).includes(q)
    )
  })

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Print styles ── */}
      <style>{`
        @page { size: A4 portrait; margin: 15mm 18mm; }
        @media print {
          body * { visibility: hidden !important; }
          #audit-remark-print-slip, #audit-remark-print-slip * { visibility: visible !important; }
          #audit-remark-print-slip {
            position: fixed; left: 0; top: 0; width: 100%;
            background: #fff; padding: 0; z-index: 9999;
          }
          .no-print { display: none !important; }
        }
        @media screen {
          #audit-remark-print-slip { display: none; }
        }
      `}</style>

      {/* ── Print slip (only visible during print) ── */}
      {selectedProposal && (
        <div id="audit-remark-print-slip">
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
              {[
                ['विभागाचे नाव', selectedProposal.deptName],
                ['नस्ती क्रमांक', `${selectedProposal.finYear} / ${selectedProposal.nastiNo}`],
                ['कामगिरीचे नाव', selectedProposal.workName],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td style={{ padding: '5px 8px', border: '1px solid #aaa', fontWeight: 600, width: '35%', background: '#f5f5f5' }}>{label}</td>
                  <td style={{ padding: '5px 8px', border: '1px solid #aaa' }}>{val}</td>
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
      <div className="no-print" style={{ display: 'flex', minHeight: '100vh', background: '#fdf8ee', fontFamily: "'Segoe UI','Noto Sans Devanagari',sans-serif" }}>
        <DeptSidebar deptKey="audit-department" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />

        <div style={{ flex: 1, padding: '28px 24px', minWidth: 0 }}>

          {/* Breadcrumb */}
          <nav className="dash-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="dash-breadcrumb-home">
              <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
            </Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <Link href="/audit-department/dashboard" className="dash-breadcrumb-home">{T.depts['audit-department']?.label ?? 'Audit Department'}</Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <span className="dash-breadcrumb-current">कार्य प्रस्ताव — लेखापरीक्षण अभिप्राय</span>
          </nav>

          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #7d5a00 0%, #5a3f00 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: '#fff', boxShadow: '0 4px 20px rgba(125,90,0,0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-clipboard2-check-fill" style={{ fontSize: '1.6rem' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>लेखापरीक्षण विभागाचे अभिप्राय</h1>
                <p style={{ margin: 0, opacity: 0.85, fontSize: '0.88rem' }}>लेखा विभागाने मंजूर केलेल्या प्रस्तावांवर अभिप्राय नोंदवा</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedProposal ? '1fr 440px' : '1fr', gap: 20 }}>

            {/* ── Proposals list ── */}
            <div>
              {/* Filters */}
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(90,60,0,0.07)', padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 3, fontSize: '0.78rem', fontWeight: 600, color: '#8a6a00' }}>आर्थिक वर्ष</label>
                  <select
                    value={finYear}
                    onChange={e => setFinYear(e.target.value)}
                    style={{ border: '1.5px solid #c8b96a', borderRadius: 8, padding: '7px 12px', fontSize: '0.88rem', color: '#3a2e00', background: '#fff', outline: 'none' }}
                  >
                    {FIN_YEARS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <label style={{ display: 'block', marginBottom: 3, fontSize: '0.78rem', fontWeight: 600, color: '#8a6a00' }}>शोधा</label>
                  <div style={{ position: 'relative' }}>
                    <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#c8a84a', fontSize: '0.85rem', pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="कामाचे नाव, विभाग, क्रमांक..."
                      style={{ border: '1.5px solid #c8b96a', borderRadius: 8, padding: '7px 12px 7px 32px', fontSize: '0.88rem', color: '#3a2e00', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loadProposals(finYear)}
                  style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#7d5a00', color: '#fff', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <i className="bi bi-arrow-clockwise" /> ताजे करा
                </button>
              </div>

              {/* Table */}
              <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(90,60,0,0.08)', overflow: 'hidden' }}>
                {listLoading ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#c8a84a' }}>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />प्रस्ताव लोड होत आहेत...
                  </div>
                ) : listError ? (
                  <div style={{ padding: '32px 24px', textAlign: 'center', color: '#c0392b' }}>
                    <i className="bi bi-exclamation-triangle-fill me-2" />{listError}
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: '#c8a84a' }}>
                    <i className="bi bi-inbox" style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10 }} />
                    <div style={{ fontWeight: 600 }}>लेखा विभागाने मंजूर केलेले कोणतेही प्रस्ताव आढळले नाहीत</div>
                    <div style={{ fontSize: '0.82rem', marginTop: 6, opacity: 0.7 }}>लेखा विभागाने अभिप्राय नोंदवल्यानंतर प्रस्ताव येथे दिसतील.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                      <thead>
                        <tr style={{ background: '#fdf0c0', borderBottom: '2px solid #e8c84a' }}>
                          {['#', 'नस्ती क्र.', 'विभाग', 'कामगिरीचे नाव', 'आर्थिक वर्ष', 'प्रकार', 'प्रस्तावित खर्च', 'नोंद दिनांक', ''].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#5a3f00', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((p, i) => (
                          <tr
                            key={`${p.orderNo}-${p.proposalType}`}
                            style={{ borderBottom: '1px solid #f5eaba', background: selectedProposal?.orderNo === p.orderNo ? '#fef8d8' : i % 2 === 0 ? '#fff' : '#fffdf0', cursor: 'pointer', transition: 'background 0.15s' }}
                            onClick={() => handleOpenRemark(p)}
                          >
                            <td style={{ padding: '9px 12px', color: '#a07a00' }}>{i + 1}</td>
                            <td style={{ padding: '9px 12px', fontWeight: 600, color: '#5a3f00' }}>{p.nastiNo}</td>
                            <td style={{ padding: '9px 12px', color: '#5a3f00' }}>{p.deptName}</td>
                            <td style={{ padding: '9px 12px', maxWidth: 280 }}>
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#3a2e00' }} title={p.workName}>{p.workName}</div>
                            </td>
                            <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: '#5a3f00' }}>{p.finYear}</td>
                            <td style={{ padding: '9px 12px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 700, background: p.proposalType === 'Q' ? '#fff3cd' : '#e8f5e9', color: p.proposalType === 'Q' ? '#856404' : '#2e7d32' }}>
                                {p.proposalType === 'Q' ? 'कोटेशन' : 'निविदा'}
                              </span>
                            </td>
                            <td style={{ padding: '9px 12px', textAlign: 'right', fontFamily: 'monospace', color: '#5a3f00' }}>
                              ₹ {new Intl.NumberFormat('en-IN').format(p.proposalCost)}
                            </td>
                            <td style={{ padding: '9px 12px', whiteSpace: 'nowrap', color: '#8a7040' }}>{fmtDate(p.entryDate)}</td>
                            <td style={{ padding: '9px 12px' }}>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); handleOpenRemark(p) }}
                                style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: '#7d5a00', color: '#fff', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
                              >
                                <i className="bi bi-clipboard2-check-fill me-1" />अभिप्राय
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 8, fontSize: '0.77rem', color: '#a07a00', padding: '4px 8px' }}>
                एकूण {filtered.length} प्रस्ताव (लेखा विभागाने मंजूर केलेले)
              </div>
            </div>

            {/* ── Remark panel ── */}
            {selectedProposal && (
              <div>
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 20px rgba(90,60,0,0.1)', overflow: 'hidden', position: 'sticky', top: 20 }}>
                  {/* Panel header */}
                  <div style={{ background: 'linear-gradient(135deg, #7d5a00, #5a3f00)', padding: '14px 18px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="bi bi-clipboard2-check-fill" style={{ fontSize: '1.1rem' }} />
                      <span style={{ fontWeight: 700 }}>लेखापरीक्षण अभिप्राय</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedProposal(null); setSaved(false) }}
                      style={{ background: 'rgba(255,255,255,0.18)', border: 'none', color: '#fff', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>

                  {formLoading ? (
                    <div style={{ padding: '40px 24px', textAlign: 'center', color: '#c8a84a' }}>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />लोड होत आहे...
                    </div>
                  ) : (
                    <div style={{ padding: '18px 18px 22px' }}>

                      {/* Proposal info fields */}
                      <div style={{ marginBottom: 14 }}>
                        <label style={LABEL_STYLE}>विभागाचे नाव</label>
                        <input type="text" readOnly value={selectedProposal.deptName} style={READONLY_STYLE} />
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <label style={LABEL_STYLE}>नस्ती क्रमांक</label>
                        <input type="text" readOnly value={`${selectedProposal.finYear} / ${selectedProposal.nastiNo}`} style={READONLY_STYLE} />
                      </div>

                      <div style={{ marginBottom: 18 }}>
                        <label style={LABEL_STYLE}>कामगिरीचे नाव</label>
                        <input type="text" readOnly value={selectedProposal.workName} style={READONLY_STYLE} />
                      </div>

                      {/* Divider */}
                      <div style={{ borderTop: '1.5px dashed #e8c84a', marginBottom: 18 }} />

                      {/* Remark textarea — only editable field */}
                      <div style={{ marginBottom: 20 }}>
                        <label style={LABEL_STYLE}>
                          <i className="bi bi-chat-square-text-fill me-1" style={{ color: '#b8860b' }} />
                          अभिप्राय
                          <span style={{ color: '#c0392b', marginLeft: 3 }}>*</span>
                        </label>
                        <textarea
                          value={remark}
                          onChange={e => setRemark(e.target.value)}
                          rows={6}
                          style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: "'Noto Sans Devanagari', sans-serif" }}
                          placeholder="लेखापरीक्षण अभिप्राय येथे लिहा..."
                          disabled={saved}
                        />
                      </div>

                      {/* Saved badge */}
                      {saved && (
                        <div style={{ marginBottom: 14, padding: '8px 14px', background: '#d4edda', borderRadius: 8, border: '1px solid #c3e6cb', color: '#155724', fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="bi bi-check-circle-fill" />
                          अभिप्राय यशस्वीपणे जतन केला.
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving || saved}
                          style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: saved ? '#aaa' : '#7d5a00', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: saving || saved ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                        >
                          {saving ? (
                            <><span className="spinner-border spinner-border-sm" role="status" /> जतन होत आहे...</>
                          ) : saved ? (
                            <><i className="bi bi-check-lg" /> जतन केले</>
                          ) : (
                            <><i className="bi bi-save-fill" /> अभिप्राय जतन करा</>
                          )}
                        </button>
                        {saved && (
                          <button
                            type="button"
                            onClick={handlePrint}
                            style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#5a3f00', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
                          >
                            <i className="bi bi-printer-fill" /> मुद्रण
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
