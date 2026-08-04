'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import PrintBudgetReport, { PrintData } from '@/app/components/PrintBudgetReport'
import { currentUser } from '@smkc/auth'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PrimaryEntry {
  bookEntryNo: number
  finalBookEntryNo: number
  finYear: string
  acHead: string
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
  cancelled: string
  deptCode: number
  deptName: string
  workName: string
  nastiNo: number
  fileType: string
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string): string {
  if (!d) return 'â€”'
  try { return new Date(d).toLocaleDateString('mr-IN', { day: '2-digit', month: 'short', year: 'numeric' }) }
  catch { return d }
}

// â”€â”€ Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ConfirmModalProps {
  entry: PrimaryEntry
  finalAmount: number
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}

function ConfirmModal({ entry, finalAmount, onConfirm, onCancel, saving }: ConfirmModalProps) {
  const remainingAfterFinal = entry.remainingBudgetAmount + entry.proposedWorkAmount - finalAmount

  return (
    <div style={OVERLAY_STYLE} onClick={saving ? undefined : onCancel}>
      <div style={MODAL_STYLE} onClick={e => e.stopPropagation()}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e0eaf2',
          background: 'linear-gradient(135deg, #117a5d 0%, #0a5240 100%)',
          borderRadius: '14px 14px 0 0', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <i className="bi bi-shield-check" style={{ fontSize: '1.4rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>पुष्टी करा</div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>अंतिम तरतूद नोंद जतन करायची आहे?</h4>
          </div>
        </div>

        <div style={{ padding: '14px 20px 0', background: '#fffbea', borderBottom: '1px solid #fde68a' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>
            <i className="bi bi-exclamation-triangle-fill me-2" />
            एकदा अंतिम नोंद झाल्यानंतर ही नोंद पुन्हा बदलता येणार नाही.
          </p>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <tbody>
              {[
                ['प्राथमिक नोंद क्र.', String(entry.bookEntryNo)],
                ['आर्थिक वर्ष', entry.finYear],
                ['लेखाशीर्ष', entry.acSubhead],
                ['कामाचे नाव', entry.workName || 'â€”'],
                ['प्राथमिक प्रस्तावित रक्कम', `₹ ${fmtCurrency(entry.proposedWorkAmount)}`],
                ['अंतिम प्रस्तावित रक्कम', `₹ ${fmtCurrency(finalAmount)}`],
                ['नोंदीनंतर शिल्लक', `₹ ${fmtCurrency(remainingAfterFinal)}`],
              ].map(([label, value], i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '6px 0', color: '#5e7388', width: '45%', fontWeight: 500 }}>{label}</td>
                  <td style={{
                    padding: '6px 0', fontWeight: 600, color: '#18324a',
                    ...(label === 'अंतिम प्रस्तावित रक्कम' ? { color: '#117a5d', fontSize: '1rem' } : {}),
                    ...(label === 'नोंदीनंतर शिल्लक' ? { color: remainingAfterFinal >= 0 ? '#117a5d' : '#c0392b' } : {}),
                  }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: '12px 20px 18px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f0f4f8' }}>
          <button
            type="button"
            style={{ padding: '7px 16px', borderRadius: 7, border: '1.5px solid #b0bec5', background: '#fff', color: '#5e7388', fontWeight: 600, fontSize: '0.84rem', cursor: saving ? 'not-allowed' : 'pointer' }}
            onClick={onCancel}
            disabled={saving}
          >
            रद्द करा
          </button>
          <button
            type="button"
            style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: '#117a5d', color: '#fff', fontWeight: 700, fontSize: '0.84rem', minWidth: 180, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px rgba(17,122,93,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={onConfirm}
            disabled={saving}
          >
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />जतन होत आहे...</>
              : <><i className="bi bi-check-circle-fill me-2" />होय, अंतिम जतन करा</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Shared styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1050,
  background: 'rgba(18,49,76,0.55)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
}

const MODAL_STYLE: React.CSSProperties = {
  background: '#fff', borderRadius: 14,
  boxShadow: '0 24px 60px rgba(18,49,76,0.22)',
  width: '100%', maxWidth: 520,
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 5,
  fontSize: '0.82rem', fontWeight: 600, color: '#3d4f60',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #d5e1ea', fontSize: '0.92rem', color: '#18324a',
  outline: 'none', background: '#fff', fontFamily: 'inherit',
}

const READONLY_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, background: '#f7fafd', color: '#5e7388', cursor: 'default',
}

const PREFIX_STYLE: React.CSSProperties = {
  position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
  color: '#5e7388', pointerEvents: 'none', userSelect: 'none',
}

const HINT_ERROR: React.CSSProperties = {
  fontSize: '0.82rem', color: '#c0392b', marginTop: '0.3rem',
}

const HINT_SUCCESS: React.CSSProperties = {
  fontSize: '0.82rem', color: '#27ae60', marginTop: '0.3rem',
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function FinalBudgetEntryPage() {
  const user = currentUser()
  const { T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Search state
  const [searchNo, setSearchNo] = useState('')
  const [searching, setSearching] = useState(false)
  const [entry, setEntry] = useState<PrimaryEntry | null>(null)
  const [searchError, setSearchError] = useState('')

  // Final amount
  const [finalAmount, setFinalAmount] = useState('')

  // UI state
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedEntry, setSavedEntry] = useState<PrimaryEntry | null>(null)

  const [popup, setPopup] = useState<{
    open: boolean; tone: 'success' | 'error' | 'warning'; title: string; description: string
  }>({ open: false, tone: 'success', title: '', description: '' })

  const [printData, setPrintData] = useState<PrintData | null>(null)

  // â”€â”€ Search primary entry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const doSearch = useCallback(async () => {
    const no = searchNo.trim()
    if (!no) return
    setSearching(true)
    setEntry(null)
    setSearchError('')
    setFinalAmount('')
    try {
      const res = await fetch(`/api/accounts/budget-book/primary/${encodeURIComponent(no)}`)
      const json = await res.json()
      if (res.ok && json.success) {
        const data = json.data as PrimaryEntry
        if (data.status?.toLowerCase() === 'y') {
          setSearchError('या नोंदीची अंतिम नोंद आधीच झाली आहे (नोंद क्र. ' + data.finalBookEntryNo + ').')
        } else if (data.cancelled?.toLowerCase() === 'y') {
          setSearchError('ही नोंद रद्द केलेली आहे.')
        } else {
          setEntry(data)
        }
      } else {
        setSearchError(json.message ?? 'नोंद सापडली नाही.')
      }
    } catch {
      setSearchError('सर्व्हरशी संपर्क होत नाही.')
    } finally {
      setSearching(false)
    }
  }, [searchNo])

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const finalNum = parseFloat(finalAmount.replace(/,/g, '')) || 0
  const remainingAfterFinal = entry
    ? entry.remainingBudgetAmount + entry.proposedWorkAmount - finalNum
    : 0
  const budgetInsufficient = entry !== null && finalNum > 0 && remainingAfterFinal < 0

  const canSubmit =
    entry !== null &&
    finalNum > 0 &&
    !budgetInsufficient

  // â”€â”€ Save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const doSave = useCallback(async () => {
    if (!entry) return
    setSaving(true)
    setShowConfirm(false)
    try {
      const body = {
        BookEntryNo: entry.bookEntryNo,
        FinalProposedAmount: finalNum,
        EnteredBy: user?.userId ?? 'ERP',
      }
      const res = await fetch('/api/accounts/budget-book/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setSavedEntry(entry)
        // Fetch full entry for print
        try {
          const detailRes = await fetch(`/api/accounts/budget-book/primary/${entry.bookEntryNo}`)
          const detailJson = await detailRes.json()
          if (detailJson.success && detailJson.data) {
            const e = detailJson.data as PrimaryEntry
            // remainingBefore for final = remaining AFTER primary = BEFORE final entry
            const remainingBefore = e.remainingBudgetAmount
            // remainingAfter for final = totalBudget - finalAmount (primary freed, final committed)
            const remainingAfter = e.remainingBudgetAmount + e.proposedWorkAmount - finalNum
            setPrintData({
              type: 'final',
              bookEntryNo: e.bookEntryNo,
              finalBookEntryNo: json.finalBookEntryNo ?? 0,
              finYear: e.finYear,
              deptName: e.deptName || String(e.deptCode),
              workName: e.workName,
              acSubhead: e.acSubhead,
              acSubheadName: e.acSubheadName,
              budgetAmount: e.budgetAmount,
              remainingBefore,
              proposedAmount: finalNum,
              remainingAfter,
              entryDate: e.finalEntryDate ?? e.entryDate,
            })
          }
        } catch { /* print not critical */ }
        setEntry(null)
        setSearchNo('')
        setFinalAmount('')
        setSearchError('')
      } else {
        setPopup({
          open: true, tone: 'error',
          title: 'नोंद अयशस्वी',
          description: json.message ?? 'अंतिम नोंद जतन करताना त्रुटी आली.',
        })
      }
    } catch {
      setPopup({
        open: true, tone: 'error',
        title: 'नेटवर्क त्रुटी',
        description: 'सर्व्हरशी संपर्क होत नाही. कृपया पुन्हा प्रयत्न करा.',
      })
    } finally {
      setSaving(false)
    }
  }, [entry, finalNum, user])

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
          <span className="dash-breadcrumb-current">अंतिम तरतूद नोंद</span>
        </nav>
        {/* Page header */}
        <div style={{
          background: 'linear-gradient(135deg, #117a5d 0%, #0a5240 100%)',
          padding: '20px 28px', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <i className="bi bi-file-earmark-check-fill" style={{ fontSize: '1.6rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              लेखा विभाग â€” तरतूद नोंद
            </div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
              अंतिम प्रशासकीय मान्यता लेखाशीर्ष तरतूद नोंद
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

        <div style={{ padding: '24px 28px', maxWidth: 900 }}>
          {/* Last saved success banner */}
          {savedEntry && (
            <div style={{
              padding: '12px 18px', marginBottom: 20, borderRadius: 10,
              background: '#d9f4ec', border: '1px solid #6dbfa0', color: '#0a5240',
              display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600,
            }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: '1.2rem' }} />
              नोंद क्र. {savedEntry.bookEntryNo} â€” अंतिम नोंद यशस्वीरित्या जतन झाली.
            </div>
          )}

          {/* Search box */}
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
              <i className="bi bi-search" style={{ color: '#117a5d', fontSize: '1.1rem' }} />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#18324a' }}>
                प्राथमिक नोंद शोधा
              </h2>
            </div>
            <div style={{ padding: '18px 22px' }}>
              <label style={LABEL_STYLE}>प्राथमिक नोंद क्रमा्क <span style={{ color: '#c0392b' }}>*</span></label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  type="number"
                  value={searchNo}
                  onChange={e => { setSearchNo(e.target.value); setSearchError('') }}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="प्राथमिक नोंद क्रमा्क टाका..."
                  style={{ ...INPUT_STYLE, flex: 1 }}
                  min={1}
                />
                <button
                  type="button"
                  className="btn"
                  style={{ background: '#117a5d', color: '#fff', border: 'none', minWidth: 100 }}
                  onClick={doSearch}
                  disabled={searching || !searchNo.trim()}
                >
                  {searching
                    ? <><span className="spinner-border spinner-border-sm me-1" role="status" />शोधत आहे...</>
                    : <><i className="bi bi-search me-1" />शोधा</>}
                </button>
              </div>
              {searchError && (
                <div style={{
                  marginTop: 10, padding: '10px 14px', borderRadius: 8,
                  background: '#fff5f5', border: '1px solid #f5c2c7', color: '#c63b31',
                  fontSize: '0.85rem', fontWeight: 500,
                }}>
                  <i className="bi bi-exclamation-triangle-fill me-2" />{searchError}
                </div>
              )}
            </div>
          </div>

          {/* Primary entry details + final form */}
          {entry && (
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
                <i className="bi bi-file-text-fill" style={{ color: '#117a5d', fontSize: '1.1rem' }} />
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#18324a' }}>
                  प्राथमिक नोंद तपशील â€” क्र. {entry.bookEntryNo}
                </h2>
                <span style={{
                  marginLeft: 'auto', padding: '3px 10px', borderRadius: 14,
                  background: '#fef3e2', color: '#92400e', fontSize: '0.78rem', fontWeight: 600,
                }}>
                  प्राथमिक â€” अंतिम बा्ी
                </span>
              </div>

              <div style={{ padding: '20px 28px' }}>
                {/* Read-only primary fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', marginBottom: 24 }}>
                  <div>
                    <label style={LABEL_STYLE}>प्राथमिक नोंद क्रमा्क</label>
                    <input type="text" readOnly value={entry.bookEntryNo} style={READONLY_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>आर्थिक वर्ष</label>
                    <input type="text" readOnly value={entry.finYear} style={READONLY_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>विभाग</label>
                    <input type="text" readOnly value={entry.deptName || String(entry.deptCode)} style={READONLY_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>नस्ती क्रमांक / प्रकार</label>
                    <input type="text" readOnly value={`${entry.nastiNo || 'â€”'} / ${entry.fileType || 'â€”'}`} style={READONLY_STYLE} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={LABEL_STYLE}>कामाचे नाव</label>
                    <input type="text" readOnly value={entry.workName || 'â€”'} style={READONLY_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>लेखाशीर्ष</label>
                    <input type="text" readOnly value={`${entry.acSubhead}${entry.acSubheadName ? ' - ' + entry.acSubheadName : ''}`} style={READONLY_STYLE} />
                  </div>
                  <div>
                    <label style={LABEL_STYLE}>नोंद तार्ख</label>
                    <input type="text" readOnly value={fmtDate(entry.entryDate)} style={READONLY_STYLE} />
                  </div>
                </div>

                {/* Budget cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                  <BudgetCard label="एकूण तरतूद" value={entry.budgetAmount} color="#0077b6" />
                  <BudgetCard label="प्राथमिक प्रस्तावित" value={entry.proposedWorkAmount} color="#f57f17" />
                  <BudgetCard label="शिल्लक (प्राथमिकनंतर)" value={entry.remainingBudgetAmount} color="#2e7d32" />
                  <BudgetCard
                    label="अंतिमनंतर शिल्लक"
                    value={finalNum > 0 ? remainingAfterFinal : entry.remainingBudgetAmount}
                    color={budgetInsufficient ? '#c0392b' : '#117a5d'}
                  />
                </div>

                {/* Final amount entry */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                  <div>
                    <label style={LABEL_STYLE}>
                      प्रस्तावित कामा्ी प्राथमिक प्रशासकीय मान्यता किंमत
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={PREFIX_STYLE}>₹</span>
                      <input type="text" readOnly
                        value={fmtCurrency(entry.proposedWorkAmount)}
                        style={{ ...READONLY_STYLE, paddingLeft: '2.2rem' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>
                      प्रस्तावित कामा्ी अंतिम प्रशासकीय मान्यता किंमत <span style={{ color: '#c0392b' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={PREFIX_STYLE}>₹</span>
                      <input
                        type="number"
                        value={finalAmount}
                        onChange={e => setFinalAmount(e.target.value)}
                        placeholder="फक्त आकडे भरा"
                        style={{ ...INPUT_STYLE, paddingLeft: '2.2rem', borderColor: budgetInsufficient ? '#c0392b' : undefined }}
                        min={1}
                        autoFocus
                      />
                    </div>
                    {budgetInsufficient && (
                      <p style={HINT_ERROR}>
                        <i className="bi bi-exclamation-triangle-fill me-1" />
                        अपुरा तरतूद! कमाल रक्कम: ₹ {fmtCurrency(entry.remainingBudgetAmount + entry.proposedWorkAmount)}
                      </p>
                    )}
                    {finalNum > 0 && !budgetInsufficient && (
                      <p style={HINT_SUCCESS}>
                        <i className="bi bi-check-circle me-1" />
                        अंतिमनंतर शिल्लक: ₹ {fmtCurrency(remainingAfterFinal)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label style={LABEL_STYLE}>नोंद केलेले वापरकर्ते</label>
                    <input type="text" readOnly value={user?.userId ?? 'ERP'} style={READONLY_STYLE} />
                  </div>
                </div>

                {/* Submit */}
                <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #f0f4f8', paddingTop: 20 }}>
                  <button
                    type="button"
                    style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #b0bec5', background: '#fff', color: '#5e7388', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => { setEntry(null); setSearchNo(''); setFinalAmount('') }}
                  >
                    <i className="bi bi-x-circle" />साफ करा
                  </button>
                  <button
                    type="button"
                    style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: canSubmit ? '#117a5d' : '#d5dbe0', color: canSubmit ? '#fff' : '#8a9ba8', fontWeight: 700, fontSize: '0.88rem', minWidth: 220, cursor: canSubmit ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8, boxShadow: canSubmit ? '0 2px 6px rgba(17,122,93,0.25)' : 'none' }}
                    disabled={!canSubmit || saving}
                    onClick={() => setShowConfirm(true)}
                  >
                    <i className={saving ? 'bi bi-hourglass-split' : 'bi bi-check2-all'} />
                    {saving ? 'जतन होत आहे...' : 'अंतिम नोंद जतन करा व मुद्रित करा'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation modal */}
      {showConfirm && entry && (
        <ConfirmModal
          entry={entry}
          finalAmount={finalNum}
          onConfirm={doSave}
          onCancel={() => setShowConfirm(false)}
          saving={saving}
        />
      )}

      {/* Success / Error popup */}
      {popup.open && (
        <ErpPopup
          open={true}
          tone={popup.tone}
          title={popup.title}
          description={popup.description}
          onClose={() => setPopup(p => ({ ...p, open: false }))}
        />
      )}

      {/* Print report modal */}
      {printData && (
        <PrintBudgetReport
          data={printData}
          onClose={() => setPrintData(null)}
        />
      )}
    </div>
  )
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BudgetCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 10, border: `1.5px solid ${color}22`,
      background: `${color}0d`, textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.68rem', color: '#5e7388', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color }}>
        ₹ {new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}
      </div>
    </div>
  )
}


