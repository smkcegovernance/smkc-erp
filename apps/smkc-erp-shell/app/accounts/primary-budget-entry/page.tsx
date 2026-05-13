'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import PrintBudgetReport, { PrintData } from '@/app/components/PrintBudgetReport'
import { currentUser } from '@smkc/auth'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface DeptOption { deptCode: number; deptName: string; deptNameLL: string; deptNameLLUnicode: string }
interface SubheadOption { acSubhead: string; acSubheadName: string; acSubheadNameLL: string; acSubheadNameLLUnicode: string; totalBudget: number }
interface BudgetRemaining { acSubhead: string; finYear: string; totalBudget: number; effectiveBudget: number; capPercentage?: number | null; capAmount?: number | null; committedAmount: number; remainingBudget: number }

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

// â”€â”€ Financial years â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function buildFinYears(): string[] {
  const now = new Date()
  const cal = now.getFullYear()
  const fy = now.getMonth() >= 3 ? cal : cal - 1 // April onwards = new FY
  const years: string[] = []
  for (let y = fy; y >= fy - 2; y--) {
    years.push(`${y}-${y + 1}`)
  }
  return years
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)
}

// â”€â”€ SearchableSelect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface SearchableOption { value: string; label: string }

interface SearchableSelectProps {
  options: SearchableOption[]
  value: string
  onChange: (val: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
}

function SearchableSelect({ options, value, onChange, placeholder = '-- निवडा --', disabled, id }: SearchableSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.value === value)

  const filtered = query.trim().length === 0
    ? options
    : options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.value.toLowerCase().includes(query.toLowerCase())
      )

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function select(val: string) {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setQuery('') }
    if (e.key === 'ArrowDown' && filtered.length > 0) {
      const el = wrapRef.current?.querySelector<HTMLButtonElement>('[data-option]')
      el?.focus()
    }
  }

  function handleOptionKeyDown(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key === 'ArrowDown') {
      const next = wrapRef.current?.querySelectorAll<HTMLButtonElement>('[data-option]')[idx + 1]
      next?.focus()
    } else if (e.key === 'ArrowUp') {
      if (idx === 0) { wrapRef.current?.querySelector<HTMLInputElement>('input')?.focus() }
      else { wrapRef.current?.querySelectorAll<HTMLButtonElement>('[data-option]')[idx - 1]?.focus() }
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} id={id}>
      {/* Trigger */}
      <div
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) setOpen(o => !o) } }}
        style={{
          ...SELECT_STYLE,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: disabled ? '#f7fafd' : '#fff',
          userSelect: 'none',
        }}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? '#18324a' : '#9aabbf' }}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', color: '#9aabbf', flexShrink: 0, marginLeft: 8 }} />
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', borderRadius: 10,
          boxShadow: '0 8px 32px rgba(18,49,76,0.18)', border: '1px solid #dde6ef',
          overflow: 'hidden',
        }}>
          {/* Search input */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', background: '#f7fafd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #c8d8e8', borderRadius: 7, padding: '5px 10px' }}>
              <i className="bi bi-search" style={{ color: '#9aabbf', fontSize: '0.85rem', flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="शोधा..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.88rem', background: 'transparent', color: '#18324a' }}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aabbf', padding: 0, lineHeight: 1 }}>
                  <i className="bi bi-x" style={{ fontSize: '1rem' }} />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <ul role="listbox" style={{ maxHeight: 240, overflowY: 'auto', margin: 0, padding: '4px 0', listStyle: 'none' }}>
            {filtered.length === 0 ? (
              <li style={{ padding: '12px 14px', color: '#9aabbf', fontSize: '0.86rem', textAlign: 'center' }}>कोणताही पर्याय आढळला नाही</li>
            ) : filtered.map((o, idx) => (
              <li key={`${o.value}-${idx}`} role="option" aria-selected={o.value === value}>
                <button
                  type="button"
                  data-option
                  onKeyDown={e => handleOptionKeyDown(e, idx)}
                  onClick={() => select(o.value)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 14px', border: 'none', cursor: 'pointer',
                    fontSize: '0.875rem', lineHeight: 1.4,
                    background: o.value === value ? 'rgba(192,57,43,0.08)' : 'transparent',
                    color: o.value === value ? '#c0392b' : '#18324a',
                    fontWeight: o.value === value ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = '#f0f6fc' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = o.value === value ? 'rgba(192,57,43,0.08)' : 'transparent' }}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// â”€â”€ Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface ConfirmModalProps {
  dept: string
  workName: string
  acSubhead: string
  finYear: string
  proposed: number
  totalBudget: number
  remaining: number
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}

function ConfirmModal({
  dept, workName, acSubhead, finYear, proposed, totalBudget, remaining, onConfirm, onCancel, saving
}: ConfirmModalProps) {
  return (
    <div style={OVERLAY_STYLE} onClick={saving ? undefined : onCancel}>
      <div style={MODAL_STYLE} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #e0eaf2',
          background: 'linear-gradient(135deg, #c0392b 0%, #962d22 100%)',
          borderRadius: '14px 14px 0 0', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <i className="bi bi-shield-exclamation" style={{ fontSize: '1.4rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>पुष्टी करा</div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              प्राथमिक तरतूद नोंद जतन करायची आहे?
            </h4>
          </div>
        </div>

        {/* Warning */}
        <div style={{ padding: '14px 20px 0', background: '#fffbea', borderBottom: '1px solid #fde68a' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: 500 }}>
            <i className="bi bi-exclamation-triangle-fill me-2" />
            एकदा जतन केल्यानंतर ही नोंद संपादित करता येणार नाही. कृपया खाली दिलेली माहिती तपासा.
          </p>
        </div>

        {/* Details */}
        <div style={{ padding: '16px 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <tbody>
              {[
                ['विभाग', dept],
                ['कामाचे नाव', workName],
                ['लेखाशीर्ष कोड', acSubhead],
                ['आर्थिक वर्ष', finYear],
                ['एकूण तरतूद', `₹ ${fmtCurrency(totalBudget)}`],
                ['आधीच वापरलेली रक्कम', `₹ ${fmtCurrency(totalBudget - remaining)}`],
                ['शिल्लक तरतूद (आधी)', `₹ ${fmtCurrency(remaining)}`],
                ['प्रस्तावित रक्कम', `₹ ${fmtCurrency(proposed)}`],
                ['नोंदीनंतर शिल्लक', `₹ ${fmtCurrency(remaining - proposed)}`],
              ].map(([label, value], i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                  <td style={{ padding: '6px 0', color: '#5e7388', width: '45%', fontWeight: 500 }}>{label}</td>
                  <td style={{
                    padding: '6px 0', fontWeight: 600, color: '#18324a',
                    ...(label === 'प्रस्तावित रक्कम' ? { color: '#c0392b', fontSize: '1rem' } : {}),
                    ...(label === 'नोंदीनंतर शिल्लक' ? { color: '#117a5d' } : {}),
                  }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
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
            style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: '#c0392b', color: '#fff', fontWeight: 700, fontSize: '0.84rem', minWidth: 160, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px rgba(192,57,43,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={onConfirm}
            disabled={saving}
          >
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />जतन होत आहे...</>
              : <><i className="bi bi-check-circle-fill me-2" />होय, जतन करा</>}
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

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function PrimaryBudgetEntryPage() {
  const user = currentUser()
  const { lang, T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const FIN_YEARS = buildFinYears()

  // Form state
  const [deptCode, setDeptCode] = useState<string>('')
  const [workName, setWorkName] = useState('')
  const [acSubhead, setAcSubhead] = useState<string>('')
  const [finYear, setFinYear] = useState(FIN_YEARS[0] ?? '2025-2026')
  const [proposedAmount, setProposedAmount] = useState('')
  const [nastiNo, setNastiNo] = useState('')
  const [fileType, setFileType] = useState('')

  // Proposal picker state
  const [showProposalPicker, setShowProposalPicker] = useState(false)
  const [proposals, setProposals] = useState<ProposalListItem[]>([])
  const [loadingProposals, setLoadingProposals] = useState(false)
  const [proposalFilter, setProposalFilter] = useState('')
  const [selectedProposal, setSelectedProposal] = useState<ProposalListItem | null>(null)

  // Data
  const [departments, setDepartments] = useState<DeptOption[]>([])
  const [subheads, setSubheads] = useState<SubheadOption[]>([])
  const [budgetInfo, setBudgetInfo] = useState<BudgetRemaining | null>(null)

  // UI state
  const [loadingDepts, setLoadingDepts] = useState(true)
  const [loadingSubheads, setLoadingSubheads] = useState(false)
  const [loadingBudget, setLoadingBudget] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedEntryNo, setSavedEntryNo] = useState<number | null>(null)

  const [popup, setPopup] = useState<{
    open: boolean; tone: 'success' | 'error' | 'warning'; title: string; description: string
  }>({ open: false, tone: 'success', title: '', description: '' })

  const [printData, setPrintData] = useState<PrintData | null>(null)

  // â”€â”€ Load departments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  useEffect(() => {
    setLoadingDepts(true)
    fetch('/api/accounts/budget-book/departments')
      .then(r => r.json())
      .then(json => {
        if (json.success) setDepartments(json.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingDepts(false))
  }, [])

  // â”€â”€ Load subheads when finYear changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const loadSubheads = useCallback((fy: string) => {
    setLoadingSubheads(true)
    setSubheads([])
    setAcSubhead('')
    setBudgetInfo(null)
    fetch(`/api/accounts/budget-book/subheads?finYear=${encodeURIComponent(fy)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setSubheads(json.data ?? [])
      })
      .catch(() => {})
      .finally(() => setLoadingSubheads(false))
  }, [])

  useEffect(() => { if (finYear) loadSubheads(finYear) }, [finYear, loadSubheads])

  // â”€â”€ Fetch budget info when subhead + finYear selected â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const fetchBudget = useCallback((sub: string, fy: string) => {
    if (!sub || !fy) { setBudgetInfo(null); return }
    setLoadingBudget(true)
    setBudgetInfo(null)
    fetch(`/api/accounts/budget-book/remaining?acSubhead=${encodeURIComponent(sub)}&finYear=${encodeURIComponent(fy)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) setBudgetInfo(json.data)
      })
      .catch(() => {})
      .finally(() => setLoadingBudget(false))
  }, [])

  useEffect(() => { fetchBudget(acSubhead, finYear) }, [acSubhead, finYear, fetchBudget])

  // â”€â”€ Derived â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const proposedNum = parseFloat(proposedAmount.replace(/,/g, '')) || 0
  const remaining = budgetInfo?.remainingBudget ?? 0
  const budgetInsufficient = proposedNum > 0 && budgetInfo !== null && proposedNum > remaining
  const selectedDept = departments.find(d => d.deptCode === Number(deptCode))
  const selectedSubhead = subheads.find(s => s.acSubhead === acSubhead)

  const canSubmit =
    deptCode &&
    workName.trim().length >= 3 &&
    acSubhead &&
    proposedNum > 0 &&
    !budgetInsufficient &&
    budgetInfo !== null

  // â”€â”€ Save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const doSave = useCallback(async () => {
    setSaving(true)
    setShowConfirm(false)
    try {
      const body = {
        DeptCode: Number(deptCode),
        WorkName: workName.trim(),
        AcSubhead: acSubhead,
        FinYear: finYear,
        ProposedAmount: proposedNum,
        NastiNo: parseInt(nastiNo) || 0,
        FileType: fileType || '',
        EnteredBy: user?.userId ?? 'ERP',
      }
      const res = await fetch('/api/accounts/budget-book/primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setSavedEntryNo(json.bookEntryNo)
        // Fetch full entry for print
        try {
          const detailRes = await fetch(`/api/accounts/budget-book/primary/${json.bookEntryNo}`)
          const detailJson = await detailRes.json()
          if (detailJson.success && detailJson.data) {
            const e = detailJson.data
            setPrintData({
              type: 'primary',
              bookEntryNo: e.bookEntryNo,
              finalBookEntryNo: 0,
              finYear: e.finYear,
              deptName: e.deptName || String(e.deptCode),
              workName: e.workName,
              acSubhead: e.acSubhead,
              acSubheadName: e.acSubheadName,
              budgetAmount: e.budgetAmount,
              remainingBefore: e.remainingBudgetAmount + e.proposedWorkAmount,
              proposedAmount: e.proposedWorkAmount,
              remainingAfter: e.remainingBudgetAmount,
              entryDate: e.entryDate,
            })
          }
        } catch { /* print not critical */ }
        // Reset form
        setWorkName('')
        setAcSubhead('')
        setProposedAmount('')
        setNastiNo('')
        setSelectedProposal(null)
        setFileType('')
        setBudgetInfo(null)
      } else {
        setPopup({
          open: true, tone: 'error',
          title: 'नोंद अयशस्वी',
          description: json.message ?? 'नोंद जतन करताना त्रुटी आली.',
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
  }, [deptCode, workName, acSubhead, finYear, proposedNum, nastiNo, fileType, user])

  // ── Load proposals for picker ─────────────────────────────────────────────

  const loadProposals = useCallback(async (fy: string, searchTerm = '') => {
    setLoadingProposals(true)
    setProposals([])
    try {
      const params = new URLSearchParams({ finYear: fy, pageSize: '50' })
      if (searchTerm.trim()) params.set('search', searchTerm.trim())
      const res = await fetch(`/api/general-administration/work-proposals/list?${params}`)
      const json = await res.json()
      if (json.success) setProposals(json.data ?? [])
    } catch { /* ignore */ } finally {
      setLoadingProposals(false)
    }
  }, [])

  // Debounced search — fires on open (delay=0) and on filter change (delay=400ms)
  useEffect(() => {
    if (!showProposalPicker) return
    const delay = proposalFilter.trim() ? 400 : 0
    const id = setTimeout(() => loadProposals(finYear, proposalFilter), delay)
    return () => clearTimeout(id)
  }, [showProposalPicker, proposalFilter, finYear, loadProposals])

  function handleSelectProposal(p: ProposalListItem) {
    setSelectedProposal(p)
    setNastiNo(p.nastiNo ?? '')
    setDeptCode(String(p.deptCode))
    setWorkName(p.workName ?? '')
    setFinYear(p.finYear)
    setProposedAmount(String(p.proposalCost))
    setFileType(p.proposalType === 'Q' ? 'Q' : p.proposalType === 'T' ? 'T' : '')
    setAcSubhead(p.acSubhead ?? '')
    setShowProposalPicker(false)
    setProposalFilter('')
  }

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
          <span className="dash-breadcrumb-current">प्राथमिक तरतूद नोंद</span>
        </nav>
        {/* Page header */}
        <div style={{
          background: 'linear-gradient(135deg, #c0392b 0%, #962d22 100%)',
          padding: '20px 28px', color: '#fff', borderRadius: '0 0 0 0',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <i className="bi bi-file-earmark-plus-fill" style={{ fontSize: '1.6rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              लेखा विभाग â€” तरतूद नोंद
            </div>
            <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
              प्राथमिक प्रशासकीय मान्यता लेखाशीर्ष तरतूद नोंद
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

        {/* Form */}
        <div style={{ padding: '24px 28px', maxWidth: 900 }}>
          {savedEntryNo && (
            <div style={{
              padding: '12px 18px', marginBottom: 20, borderRadius: 10,
              background: '#d9f4ec', border: '1px solid #6dbfa0', color: '#0a5240',
              display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600,
            }}>
              <i className="bi bi-check-circle-fill" style={{ fontSize: '1.2rem' }} />
              शेवटची नोंद क्र.: {savedEntryNo} â€” यशस्वीरित्या जतन झाली.
            </div>
          )}

          <div style={{
            background: '#fff', borderRadius: 14,
            boxShadow: '0 2px 8px rgba(18,49,76,0.08)',
            border: '1px solid #e0eaf2',
          }}>
            <div style={{
              padding: '16px 22px', borderBottom: '1px solid #e8f0f8',
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#f7fafd', borderRadius: '14px 14px 0 0',
            }}>
              <i className="bi bi-pencil-square" style={{ color: '#c0392b', fontSize: '1.1rem' }} />
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#18324a' }}>
                नवीन प्राथमिक नोंद
              </h2>
            </div>

            <div style={{ padding: '22px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 24px' }}>

                {/* Proposal Picker — full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>कार्य प्रस्ताव निवडा (लेखा अभिप्राय यादीतून)</label>
                  {selectedProposal ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: '#edf7ee', border: '1.5px solid #6dbfa0', fontSize: '0.84rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' }}>
                          <div><span style={{ color: '#5e7388', fontWeight: 500 }}>नस्ती क्र.: </span><strong>{selectedProposal.nastiNo}</strong></div>
                          <div><span style={{ color: '#5e7388', fontWeight: 500 }}>प्रकार: </span><strong style={{ color: selectedProposal.proposalType === 'Q' ? '#1a6db5' : selectedProposal.proposalType === 'T' ? '#c0392b' : '#2d6a4f' }}>{selectedProposal.proposalType === 'Q' ? 'कोटेशन (Q)' : selectedProposal.proposalType === 'T' ? 'टेंडर (T)' : 'इतर'}</strong></div>
                          <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#5e7388', fontWeight: 500 }}>कामाचे नाव: </span><strong>{selectedProposal.workName}</strong></div>
                          <div><span style={{ color: '#5e7388', fontWeight: 500 }}>विभाग: </span><strong>{selectedProposal.deptName}</strong></div>
                          <div><span style={{ color: '#5e7388', fontWeight: 500 }}>लेखाशीर्ष: </span><strong>{selectedProposal.acSubhead}{selectedProposal.acSubheadName ? ` — ${selectedProposal.acSubheadName}` : ''}</strong></div>
                          <div><span style={{ color: '#5e7388', fontWeight: 500 }}>प्रस्तावित किंमत: </span><strong style={{ color: '#c0392b' }}>₹ {fmtCurrency(selectedProposal.proposalCost)}</strong></div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setProposalFilter(''); setShowProposalPicker(true) }}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #1a6db5', background: '#fff', color: '#1a6db5', fontWeight: 700, fontSize: '0.84rem', whiteSpace: 'nowrap', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <i className="bi bi-arrow-repeat" /> बदला
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setProposalFilter(''); setShowProposalPicker(true) }}
                      style={{ width: '100%', padding: '10px 18px', borderRadius: 8, border: '1.5px dashed #1a6db5', background: '#f0f7ff', color: '#1a6db5', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <i className="bi bi-list-ul" /> प्रस्ताव निवडा (लेखा अभिप्राय यादी)
                    </button>
                  )}
                </div>

                {/* Financial Year */}
                <div>
                  <label style={LABEL_STYLE}>आर्थिक वर्ष <span style={{ color: '#c0392b' }}>*</span></label>
                  <select
                    value={finYear}
                    onChange={e => setFinYear(e.target.value)}
                    style={SELECT_STYLE}
                  >
                    {FIN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label style={LABEL_STYLE}>विभागाचे नाव <span style={{ color: '#c0392b' }}>*</span></label>
                  <SearchableSelect
                    disabled={loadingDepts}
                    placeholder={loadingDepts ? 'लोड होत आहे...' : '-- विभाग निवडा --'}
                    value={deptCode}
                    onChange={val => setDeptCode(val)}
                    options={departments.map(d => ({
                      value: String(d.deptCode),
                      label: `${d.deptCode} â€” ${lang === 'mr' ? (d.deptNameLLUnicode || d.deptNameLL || d.deptName) : d.deptName}`,
                    }))}
                  />
                </div>

                {/* Work Name - full width */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>कामाचे नाव <span style={{ color: '#c0392b' }}>*</span></label>
                  <textarea
                    value={workName}
                    onChange={e => setWorkName(e.target.value)}
                    rows={2}
                    placeholder="प्रस्तावित कामाचे नाव लिहा..."
                    style={{ ...INPUT_STYLE, resize: 'vertical', fontFamily: 'inherit' }}
                    maxLength={500}
                  />
                  {workName.trim().length > 0 && workName.trim().length < 3 && (
                    <p style={HINT_ERROR}>किमान 3 अक्षरे आवश्यक आहेत.</p>
                  )}
                </div>

                {/* Account Head */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={LABEL_STYLE}>लेखाशीर्ष क्रमांक व नाव <span style={{ color: '#c0392b' }}>*</span></label>
                  <SearchableSelect
                    disabled={loadingSubheads}
                    placeholder={loadingSubheads ? 'लोड होत आहे...' : '-- लेखाशीर्ष निवडा --'}
                    value={acSubhead}
                    onChange={val => setAcSubhead(val)}
                    options={subheads.map(s => ({
                      value: s.acSubhead,
                      label: `${s.acSubhead} â€” ${lang === 'mr' ? (s.acSubheadNameLLUnicode || s.acSubheadNameLL || s.acSubheadName) : s.acSubheadName}`,
                    }))}
                  />
                  {loadingSubheads && (
                    <p style={HINT_INFO}><span className="spinner-border spinner-border-sm me-1" role="status" />लेखाशीर्ष यादी लोड होत आहे...</p>
                  )}
                </div>

                {/* Budget info box */}
                {(acSubhead && !loadingBudget && budgetInfo) && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    {(budgetInfo.capPercentage != null || budgetInfo.capAmount != null) && (
                      <div style={{ marginBottom: 8, padding: '6px 12px', borderRadius: 6, background: '#fff3cd', border: '1px solid #ffc107', fontSize: 13, color: '#856404' }}>
                        <i className="bi bi-shield-lock-fill me-1" />
                        बजेट मर्यादा लागू:{' '}
                        {budgetInfo.capAmount != null ? `₹ ${budgetInfo.capAmount.toLocaleString('en-IN')}` : `${budgetInfo.capPercentage}%`}
                        {' — '}मर्यादित एकूण: ₹ {budgetInfo.effectiveBudget.toLocaleString('en-IN')}
                      </div>
                    )}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                    }}>
                      <BudgetCard label="एकूण अंदाजपत्रीय तरतूद" value={budgetInfo.totalBudget} color="#0077b6" />
                      <BudgetCard label="आधीच वापरलेली रक्कम" value={budgetInfo.committedAmount} color="#f57f17" />
                      <BudgetCard
                        label="शिल्लक तरतूद"
                        value={budgetInfo.remainingBudget}
                        color={budgetInfo.remainingBudget > 0 ? '#2e7d32' : '#c0392b'}
                      />
                    </div>
                  </div>
                )}
                {(acSubhead && loadingBudget) && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={HINT_INFO}>
                      <span className="spinner-border spinner-border-sm me-1" role="status" />
                      तरतूद माहिती लोड होत आहे...
                    </p>
                  </div>
                )}

                {/* Proposed Amount */}
                <div>
                  <label style={LABEL_STYLE}>प्रस्तावित कामाची किंमत <span style={{ color: '#c0392b' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <span style={PREFIX_STYLE}>₹</span>
                    <input
                      type="number"
                      value={proposedAmount}
                      onChange={e => setProposedAmount(e.target.value)}
                      placeholder="फक्त आकडे भरा"
                      style={{ ...INPUT_STYLE, paddingLeft: '2.2rem', borderColor: budgetInsufficient ? '#c0392b' : undefined }}
                      min={1}
                    />
                  </div>
                  {budgetInsufficient && (
                    <p style={HINT_ERROR}>
                      <i className="bi bi-exclamation-triangle-fill me-1" />
                      अपुरा तरतूद! शिल्लक रक्कम ₹ {fmtCurrency(remaining)} आहे.
                    </p>
                  )}
                  {proposedNum > 0 && budgetInfo && !budgetInsufficient && (
                    <p style={HINT_SUCCESS}>
                      <i className="bi bi-check-circle me-1" />
                      नोंदीनंतर शिल्लक: ₹ {fmtCurrency(remaining - proposedNum)}
                    </p>
                  )}
                </div>

                {/* File Type */}
                <div>
                  <label style={LABEL_STYLE}>फाईल प्रकार</label>
                  <select value={fileType} onChange={e => setFileType(e.target.value)} style={SELECT_STYLE}>
                    <option value="">-- निवडा --</option>
                    <option value="Q">Q — कोटेशन (₹ 1 लाखापर्यंत)</option>
                    <option value="T">T — टेंडर (₹ 1 लाखापेक्षा जास्त)</option>
                    <option value="O">O — इतर</option>
                  </select>
                </div>

                {/* Entered by (display only) */}
                <div>
                  <label style={LABEL_STYLE}>नोंद केलेले वापरकर्ते</label>
                  <input
                    type="text"
                    value={user?.userId ?? 'ERP'}
                    readOnly
                    style={{ ...INPUT_STYLE, background: '#f7fafd', color: '#5e7388', cursor: 'default' }}
                  />
                </div>
              </div>

              {/* Submit */}
              <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid #f0f4f8', paddingTop: 20 }}>
                <button
                  type="button"
                  style={{
                    padding: '9px 20px', borderRadius: 8, border: '1.5px solid #b0bec5',
                    background: '#fff', color: '#5e7388', fontWeight: 600, fontSize: '0.88rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                  onClick={() => {
                    setWorkName(''); setAcSubhead(''); setProposedAmount('')
                    setNastiNo(''); setSelectedProposal(null)
                    setFileType(''); setBudgetInfo(null)
                  }}
                >
                  <i className="bi bi-x-circle" />साफ करा
                </button>
                <button
                  type="button"
                  style={{
                    padding: '9px 24px', borderRadius: 8, border: 'none',
                    background: canSubmit ? '#c0392b' : '#d5dbe0',
                    color: canSubmit ? '#fff' : '#8a9ba8',
                    fontWeight: 700, fontSize: '0.88rem', minWidth: 190,
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: canSubmit ? '0 2px 6px rgba(192,57,43,0.25)' : 'none',
                    transition: 'background 0.15s, box-shadow 0.15s',
                  }}
                  disabled={!canSubmit || saving}
                  onClick={() => setShowConfirm(true)}
                >
                  <i className={saving ? 'bi bi-hourglass-split' : 'bi bi-save-fill'} />
                  {saving ? 'जतन होत आहे...' : 'जतन करा व मुद्रित करा'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Proposal Picker Modal */}
      {showProposalPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1060, background: 'rgba(18,49,76,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(18,49,76,0.22)', width: '100%', maxWidth: 820, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #e0eaf2', display: 'flex', alignItems: 'center', gap: 10, background: '#f7fafd', borderRadius: '14px 14px 0 0' }}>
              <i className="bi bi-list-ul" style={{ color: '#1a6db5', fontSize: '1.1rem' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#18324a', flex: 1 }}>कार्य प्रस्ताव निवडा — लेखा अभिप्राय यादी ({finYear})</h3>
              <button type="button" onClick={() => { setShowProposalPicker(false); setProposalFilter('') }} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#5e7388', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
            </div>
            {/* Search filter */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f4f8' }}>
              <input
                type="text"
                value={proposalFilter}
                onChange={e => setProposalFilter(e.target.value)}
                placeholder="कामाचे नाव, नस्ती क्र., लेखाशीर्ष शोधा..."
                autoFocus
                style={{ width: '100%', border: '1.5px solid #b6d0e8', borderRadius: 8, padding: '8px 12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {loadingProposals ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#5e7388' }}>
                  <span className="spinner-border me-2" role="status" />यादी लोड होत आहे...
                </div>
              ) : proposals.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: '#5e7388' }}>या वर्षाचे प्रस्ताव आढळले नाहीत.</div>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                    <thead>
                      <tr style={{ background: '#f7fafd', position: 'sticky', top: 0 }}>
                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#1a5276', borderBottom: '1.5px solid #e0eaf2' }}>नस्ती क्र.</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#1a5276', borderBottom: '1.5px solid #e0eaf2' }}>प्रकार</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#1a5276', borderBottom: '1.5px solid #e0eaf2' }}>विभाग</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#1a5276', borderBottom: '1.5px solid #e0eaf2' }}>कामाचे नाव</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 700, color: '#1a5276', borderBottom: '1.5px solid #e0eaf2' }}>लेखाशीर्ष</th>
                        <th style={{ padding: '8px 14px', textAlign: 'right', fontWeight: 700, color: '#1a5276', borderBottom: '1.5px solid #e0eaf2' }}>किंमत (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.map((p, i) => (
                        <tr
                          key={p.orderNo}
                          onClick={() => handleSelectProposal(p)}
                          style={{ cursor: 'pointer', background: selectedProposal?.orderNo === p.orderNo ? '#e8f5e9' : i % 2 === 0 ? '#fff' : '#fafcff', transition: 'background 0.1s' }}
                          onMouseEnter={e => { if (selectedProposal?.orderNo !== p.orderNo) (e.currentTarget as HTMLTableRowElement).style.background = '#f0f7ff' }}
                          onMouseLeave={e => { if (selectedProposal?.orderNo !== p.orderNo) (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#fafcff' }}
                        >
                          <td style={{ padding: '7px 14px', borderBottom: '1px solid #f0f4f8', fontWeight: 600, color: '#1a6db5' }}>{p.nastiNo || '—'}</td>
                          <td style={{ padding: '7px 14px', borderBottom: '1px solid #f0f4f8' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700, background: p.proposalType === 'Q' ? '#e3f0fb' : p.proposalType === 'T' ? '#fdecea' : '#f0f8f0', color: p.proposalType === 'Q' ? '#1a6db5' : p.proposalType === 'T' ? '#c0392b' : '#2d6a4f' }}>
                              {p.proposalType === 'Q' ? 'Q' : p.proposalType === 'T' ? 'T' : p.proposalType || '—'}
                            </span>
                          </td>
                          <td style={{ padding: '7px 14px', borderBottom: '1px solid #f0f4f8', color: '#3d5166', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.deptName}</td>
                          <td style={{ padding: '7px 14px', borderBottom: '1px solid #f0f4f8', color: '#18324a', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.workName}>{p.workName}</td>
                          <td style={{ padding: '7px 14px', borderBottom: '1px solid #f0f4f8', color: '#3d5166', whiteSpace: 'nowrap' }}>{p.acSubhead}</td>
                          <td style={{ padding: '7px 14px', borderBottom: '1px solid #f0f4f8', textAlign: 'right', fontWeight: 600, color: '#c0392b' }}>{fmtCurrency(p.proposalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {proposals.length === 50 && (
                    <div style={{ padding: '8px 16px', fontSize: '0.78rem', color: '#8a9ba8', borderTop: '1px solid #f0f4f8', background: '#fafcff', textAlign: 'center' }}>
                      <i className="bi bi-info-circle me-1" />पहिले 50 परिणाम दाखवले — अधिक शोधण्यासाठी वर शोध घाला.
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid #f0f4f8', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowProposalPicker(false); setProposalFilter('') }} style={{ padding: '7px 20px', borderRadius: 7, border: '1.5px solid #b0bec5', background: '#fff', color: '#5e7388', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>बंद करा</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && selectedDept && selectedSubhead && budgetInfo && (
        <ConfirmModal
          dept={`${selectedDept.deptCode} â€” ${selectedDept.deptName}`}
          workName={workName}
          acSubhead={acSubhead}
          finYear={finYear}
          proposed={proposedNum}
          totalBudget={budgetInfo.totalBudget}
          remaining={budgetInfo.remainingBudget}
          onConfirm={doSave}
          onCancel={() => setShowConfirm(false)}
          saving={saving}
        />
      )}

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
      padding: '14px 16px', borderRadius: 10, border: `1.5px solid ${color}22`,
      background: `${color}0d`, textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.72rem', color: '#5e7388', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.15rem', fontWeight: 700, color }}>
        ₹ {fmtCurrency(value)}
      </div>
    </div>
  )
}

// â”€â”€ Shared input styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 5,
  fontSize: '0.82rem', fontWeight: 600, color: '#3d4f60',
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #d5e1ea', fontSize: '0.92rem', color: '#18324a',
  outline: 'none', background: '#fff', fontFamily: 'inherit',
}

const SELECT_STYLE: React.CSSProperties = {
  ...INPUT_STYLE, cursor: 'pointer', appearance: 'auto',
}

const PREFIX_STYLE: React.CSSProperties = {
  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
  color: '#5e7388', fontWeight: 600, pointerEvents: 'none',
}

const HINT_ERROR: React.CSSProperties = {
  margin: '4px 0 0', fontSize: '0.78rem', color: '#c0392b', fontWeight: 500,
}

const HINT_INFO: React.CSSProperties = {
  margin: '4px 0 0', fontSize: '0.78rem', color: '#0077b6',
}

const HINT_SUCCESS: React.CSSProperties = {
  margin: '4px 0 0', fontSize: '0.78rem', color: '#2e7d32', fontWeight: 500,
}
