'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import WorkProposalPrintReport, { type WorkProposalPrintData } from '@/app/components/WorkProposalPrintReport'
import Link from 'next/link'
import { currentUser } from '@smkc/auth'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ── Types ──────────────────────────────────────────────────────────────────────

interface DeptOption { deptCode: number; deptName: string; deptNameLL: string; deptNameLLUnicode: string }
interface SubheadOption { acSubhead: string; acSubheadName: string; acSubheadNameLL: string; acSubheadNameLLUnicode: string }
interface BudgetInfo { acSubhead: string; finYear: string; totalBudget: number; effectiveBudget: number; actualExpenditure: number; remainingBudget: number; capPercentage?: number | null; capAmount?: number | null }

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildFinYears = (): string[] => {
  const now = new Date()
  const cal = now.getFullYear()
  const fy = now.getMonth() >= 3 ? cal : cal - 1
  const years: string[] = []
  for (let y = fy; y >= fy - 2; y--) years.push(`${y}-${y + 1}`)
  return years
}

const fmtCurrency = (n: number): string => {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

const todayString = (): string => {
  return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', border: '1.5px solid #c8d8e8', borderRadius: 8,
  padding: '9px 12px', fontSize: '0.9rem', color: '#18324a',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 4, fontSize: '0.82rem',
  fontWeight: 600, color: '#5e7388', letterSpacing: '0.02em',
}
const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1050,
  background: 'rgba(18,49,76,0.55)', backdropFilter: 'blur(4px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
}
const MODAL_STYLE: React.CSSProperties = {
  background: '#fff', borderRadius: 14, boxShadow: '0 24px 60px rgba(18,49,76,0.22)',
  width: '100%', maxWidth: 520,
}

// ── SectionLabel ───────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ borderLeft: '4px solid #2d6a4f', paddingLeft: 12, marginBottom: 16, marginTop: 28 }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2d6a4f', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {text}
      </span>
    </div>
  )
}

// ── AaheNahiSelect ─────────────────────────────────────────────────────────────

function AaheNahiSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={INPUT_STYLE}>
      <option value="">-- निवडा --</option>
      <option value="o">आहे</option>
      <option value="n">नाही</option>
    </select>
  )
}

// ── HoNahiSelect ───────────────────────────────────────────────────────────────

function HoNahiSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={INPUT_STYLE}>
      <option value="">-- निवडा --</option>
      <option value="y">हो</option>
      <option value="n">नाही</option>
    </select>
  )
}

// ── SearchableSelect ───────────────────────────────────────────────────────────

interface SearchableOption { value: string; label: string }
interface SearchableSelectProps {
  options: SearchableOption[]; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean; id?: string
}

function SearchableSelect({ options, value, onChange, placeholder = '-- निवडा --', disabled, id }: SearchableSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)
  const filtered = query.trim() === '' ? options : options.filter(o =>
    o.label.toLowerCase().includes(query.toLowerCase()) || o.value.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setQuery('') }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function select(val: string) { onChange(val); setOpen(false); setQuery('') }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }} id={id}>
      <div
        role="combobox" aria-expanded={open} tabIndex={disabled ? -1 : 0}
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) setOpen(o => !o) } }}
        style={{ ...INPUT_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#f7fafd' : '#fff', userSelect: 'none' }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? '#18324a' : '#9aabbf' }}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', color: '#9aabbf', marginLeft: 8 }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 200, background: '#fff', borderRadius: 10, boxShadow: '0 8px 32px rgba(18,49,76,0.18)', border: '1px solid #dde6ef', overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #eef2f7', background: '#f7fafd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #c8d8e8', borderRadius: 7, padding: '5px 10px' }}>
              <i className="bi bi-search" style={{ color: '#9aabbf', fontSize: '0.85rem' }} />
              <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="शोधा..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.88rem', background: 'transparent', color: '#18324a' }} />
              {query && <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aabbf', padding: 0 }}><i className="bi bi-x" /></button>}
            </div>
          </div>
          <ul role="listbox" style={{ maxHeight: 240, overflowY: 'auto', margin: 0, padding: '4px 0', listStyle: 'none' }}>
            {filtered.length === 0 ? (
              <li style={{ padding: '12px 14px', color: '#9aabbf', fontSize: '0.86rem', textAlign: 'center' }}>कोणताही पर्याय आढळला नाही</li>
            ) : filtered.map((o, i) => (
              <li key={`${o.value}-${i}`}>
                <button type="button" onClick={() => select(o.value)}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: o.value === value ? 'rgba(45,106,79,0.08)' : 'transparent', color: o.value === value ? '#2d6a4f' : '#18324a', fontWeight: o.value === value ? 600 : 400 }}
                  onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = '#f0f6fc' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = o.value === value ? 'rgba(45,106,79,0.08)' : 'transparent' }}
                >{o.label}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Confirm Modal ──────────────────────────────────────────────────────────────

function ConfirmModal({ onConfirm, onCancel, saving }: { onConfirm: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div style={OVERLAY_STYLE} onClick={saving ? undefined : onCancel}>
      <div style={MODAL_STYLE} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e0eaf2', background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)', borderRadius: '14px 14px 0 0', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="bi bi-shield-exclamation" style={{ fontSize: '1.4rem' }} />
          <div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>पुष्टी करा</div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>इतर प्रस्ताव जतन करायचा आहे?</h4>
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#18324a' }}>
            <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d97706', marginRight: 8 }} />
            एकदा जतन केल्यानंतर ही नोंद संपादित करता येणार नाही. सर्व माहिती तपासून पुढे जा.
          </p>
        </div>
        <div style={{ padding: '12px 20px 18px', display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid #f0f4f8' }}>
          <button type="button" disabled={saving} onClick={onCancel}
            style={{ padding: '7px 16px', borderRadius: 7, border: '1.5px solid #b0bec5', background: '#fff', color: '#5e7388', fontWeight: 600, fontSize: '0.84rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
            रद्द करा
          </button>
          <button type="button" disabled={saving} onClick={onConfirm}
            style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: '#2d6a4f', color: '#fff', fontWeight: 700, fontSize: '0.84rem', minWidth: 160, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 6px rgba(45,106,79,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {saving
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" />जतन होत आहे...</>
              : <><i className="bi bi-check-circle-fill me-2" />होय, जतन करा</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Ward Picker ────────────────────────────────────────────────────────────────

const ALL_WARDS = Array.from({ length: 20 }, (_, i) => i + 1)

interface WardPickerProps { selected: number[]; onChange: (wards: number[]) => void }

function WardPicker({ selected, onChange }: WardPickerProps) {
  function toggle(w: number) {
    onChange(selected.includes(w) ? selected.filter(x => x !== w) : [...selected, w].sort((a, b) => a - b))
  }
  function toggleAll() { onChange(selected.length === ALL_WARDS.length ? [] : [...ALL_WARDS]) }
  return (
    <div>
      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={toggleAll} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: 6, border: '1.5px solid #2d6a4f', background: selected.length === ALL_WARDS.length ? '#2d6a4f' : '#fff', color: selected.length === ALL_WARDS.length ? '#fff' : '#2d6a4f', fontWeight: 600, cursor: 'pointer' }}>
          {selected.length === ALL_WARDS.length ? 'सर्व काढा' : 'सर्व निवडा'}
        </button>
        {selected.length > 0 && <span style={{ fontSize: '0.78rem', color: '#2d6a4f', fontWeight: 600 }}>{selected.length} प्रभाग निवडले</span>}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {ALL_WARDS.map(w => (
          <button key={w} type="button" onClick={() => toggle(w)}
            style={{ width: 40, height: 32, borderRadius: 7, border: `1.5px solid ${selected.includes(w) ? '#2d6a4f' : '#c8d8e8'}`, background: selected.includes(w) ? '#2d6a4f' : '#fff', color: selected.includes(w) ? '#fff' : '#5e7388', fontSize: '0.82rem', fontWeight: selected.includes(w) ? 700 : 400, cursor: 'pointer' }}>
            {w}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function WorkProposalOtherPage() {
  const user = currentUser()
  const { lang, T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const FIN_YEARS = buildFinYears()

  // ── Form state ─────────────────────────────────────────────────────────────

  const [finYear, setFinYear] = useState(FIN_YEARS[0] ?? '2025-2026')
  const [deptCode, setDeptCode] = useState('')
  const [nastiType, setNastiType] = useState('')
  const [nastiNo, setNastiNo] = useState('')
  const [preGeneratedOrderNo, setPreGeneratedOrderNo] = useState(0)

  const [workName, setWorkName] = useState('')
  const [workPlace, setWorkPlace] = useState('')
  const [mapAttached, setMapAttached] = useState('')
  const [wards, setWards] = useState<number[]>([])
  const [workNeed, setWorkNeed] = useState('')
  const [workDoneBefore, setWorkDoneBefore] = useState('')
  const [workAmount, setWorkAmount] = useState('')

  const [techApproval, setTechApproval] = useState('')
  const [techSanctionNo, setTechSanctionNo] = useState('')
  const [techSanctionDate, setTechSanctionDate] = useState('')
  const [dsrRates, setDsrRates] = useState('')

  const [placeOwnership, setPlaceOwnership] = useState('')
  const [nocDocAttached, setNocDocAttached] = useState('')
  const [nocCertificate, setNocCertificate] = useState('')
  const [anyDispute, setAnyDispute] = useState('')
  const [courtCase, setCourtCase] = useState('')
  const [caseDetails, setCaseDetails] = useState('')

  const [townPlanCheck, setTownPlanCheck] = useState('')
  const [townPlanApproval, setTownPlanApproval] = useState('')
  const [expendValid, setExpendValid] = useState('')
  const [stockListAttached, setStockListAttached] = useState('')
  const [photoAttached, setPhotoAttached] = useState('')

  const [acSubhead, setAcSubhead] = useState('')
  const [proposalCost, setProposalCost] = useState('')

  const [acHeadValid, setAcHeadValid] = useState('')
  const [otherDept, setOtherDept] = useState('')
  const [workSplit, setWorkSplit] = useState('')
  const [maintenancePeriod, setMaintenancePeriod] = useState('')
  const [prevMaintenance, setPrevMaintenance] = useState('')
  const [competentOfficer, setCompetentOfficer] = useState('')
  const [remarks, setRemarks] = useState('')

  // ── Data ───────────────────────────────────────────────────────────────────

  const [departments, setDepartments] = useState<DeptOption[]>([])
  const [subheads, setSubheads] = useState<SubheadOption[]>([])
  const [budgetInfo, setBudgetInfo] = useState<BudgetInfo | null>(null)

  // ── UI state ───────────────────────────────────────────────────────────────

  const [loadingDepts, setLoadingDepts] = useState(true)
  const [loadingSubheads, setLoadingSubheads] = useState(false)
  const [loadingBudget, setLoadingBudget] = useState(false)
  const [loadingNasti, setLoadingNasti] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOrderNo, setSavedOrderNo] = useState<number | null>(null)
  const [printData, setPrintData] = useState<WorkProposalPrintData | null>(null)
  const [lastPrintData, setLastPrintData] = useState<WorkProposalPrintData | null>(null)
  const [clientError, setClientError] = useState('')
  const [popup, setPopup] = useState<{ open: boolean; tone: 'success' | 'error' | 'warning'; title: string; description: string }>({ open: false, tone: 'success', title: '', description: '' })

  // ── Auto-generate nasti number from sequence ───────────────────────────────

  const loadNastiNo = useCallback(async () => {
    setLoadingNasti(true)
    try {
      const res = await fetch('/api/general-administration/work-proposals/next-sequence?type=Q')
      const json = await res.json()
      if (json.success && json.nextVal) {
        setNastiNo(String(json.nextVal))
        setPreGeneratedOrderNo(Number(json.nextVal))
      }
    } catch {}
    finally { setLoadingNasti(false) }
  }, [])

  useEffect(() => { loadNastiNo() }, [loadNastiNo])

  // ── Load departments ───────────────────────────────────────────────────────

  useEffect(() => {
    const uid = user?.userId ?? ''
    const url = uid ? `/api/general-administration/work-proposals/departments?userId=${encodeURIComponent(uid)}` : '/api/general-administration/work-proposals/departments'
    setLoadingDepts(true)
    fetch(url)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const depts: DeptOption[] = json.data ?? []
          setDepartments(depts)
          if (depts.length === 1) setDeptCode(String(depts[0].deptCode))
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDepts(false))
  }, [])

  // ── Load account heads when dept or finYear changes ────────────────────────

  const loadSubheads = useCallback((dc: string, fy: string) => {
    if (!dc || !fy) { setSubheads([]); setAcSubhead(''); setBudgetInfo(null); return }
    setLoadingSubheads(true); setSubheads([]); setAcSubhead(''); setBudgetInfo(null)
    fetch(`/api/general-administration/work-proposals/account-heads?deptCode=${encodeURIComponent(dc)}&finYear=${encodeURIComponent(fy)}`)
      .then(r => r.json()).then(json => { if (json.success) setSubheads(json.data ?? []) })
      .catch(() => {}).finally(() => setLoadingSubheads(false))
  }, [])

  useEffect(() => { loadSubheads(deptCode, finYear) }, [deptCode, finYear, loadSubheads])

  // ── Load budget info when account head selected ────────────────────────────

  const loadBudget = useCallback((dc: string, ac: string, fy: string) => {
    if (!dc || !ac || !fy) { setBudgetInfo(null); return }
    setLoadingBudget(true); setBudgetInfo(null)
    fetch(`/api/general-administration/work-proposals/budget?deptCode=${encodeURIComponent(dc)}&acSubhead=${encodeURIComponent(ac)}&finYear=${encodeURIComponent(fy)}&proposalType=other`)
      .then(r => r.json()).then(json => { if (json.success) setBudgetInfo(json.data) })
      .catch(() => {}).finally(() => setLoadingBudget(false))
  }, [])

  useEffect(() => { loadBudget(deptCode, acSubhead, finYear) }, [deptCode, acSubhead, finYear, loadBudget])

  // ── Derived ────────────────────────────────────────────────────────────────

  const proposalNum = parseFloat(proposalCost.replace(/,/g, '')) || 0
  const workAmountNum = parseFloat(workAmount.replace(/,/g, '')) || 0
  const budgetExceeded = budgetInfo !== null && proposalNum > 0 && proposalNum > budgetInfo.remainingBudget

  const canSubmit =
    finYear && deptCode &&
    workName.trim() && workPlace.trim() && mapAttached &&
    wards.length > 0 && workNeed.trim() && workDoneBefore.trim() &&
    workAmountNum > 0 && !budgetExceeded &&
    techApproval && techSanctionNo.trim() && techSanctionDate && dsrRates &&
    placeOwnership && nocDocAttached && nocCertificate &&
    anyDispute && courtCase && caseDetails.trim() &&
    townPlanCheck && townPlanApproval && expendValid && stockListAttached && photoAttached &&
    acSubhead && proposalNum > 0 &&
    acHeadValid && otherDept && workSplit &&
    maintenancePeriod.trim() && prevMaintenance && competentOfficer.trim()

  // ── Save ───────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setClientError('')
    if (budgetInfo && proposalNum > budgetInfo.remainingBudget) {
      setClientError(`बजेट मर्यादा ओलांडली! उपलब्ध शिल्लक ₹\u00a0${budgetInfo.remainingBudget.toLocaleString('en-IN')} — प्रस्तावित रक्कम जास्त आहे.`)
      return
    }
    setShowConfirm(true)
  }

  async function doSave() {
    setSaving(true)
    try {
      const body = {
        finYear, deptCode: Number(deptCode), nastiType, nastiNo,
        workName, workPlace, mapAttached, wardNos: wards.join(','),
        workNeed, workDoneBefore, workAmount: workAmountNum,
        techApproval, techSanctionNo, techSanctionDate, dsrRates,
        placeOwnership, nocDocAttached, nocCertificate,
        anyDispute, courtCase, caseDetails,
        townPlanCheck, townPlanApproval, expendValid, stockListAttached, photoAttached,
        acSubhead, proposalCost: proposalNum,
        acHeadValid, otherDept, workSplit, maintenancePeriod, prevMaintenance, competentOfficer,
        remarks, enteredBy: user?.userId ?? 'ERP',
        preGeneratedOrderNo,
      }
      const res = await fetch('/api/general-administration/work-proposals/other', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      })
      const json = await res.json()
      setShowConfirm(false)
      if (res.ok && json.success) {
        setSavedOrderNo(json.orderNo ?? null)
        const selectedDeptObj = departments.find(d => String(d.deptCode) === deptCode)
        const selectedSubheadObj = subheads.find(s => s.acSubhead === acSubhead)
        setPrintData({
          orderNo: json.orderNo ?? 0,
          proposalType: 'Q',
          finYear,
          deptName: selectedDeptObj?.deptNameLLUnicode || selectedDeptObj?.deptNameLL || selectedDeptObj?.deptName || String(deptCode),
          nastiType,
          nastiNo,
          workName,
          workPlace,
          mapAttached,
          wardNos: wards.join(','),
          workNeed,
          workDoneBefore,
          workAmount: workAmountNum,
          techApproval,
          techSanctionNo,
          techSanctionDate,
          dsrRates,
          placeOwnership,
          nocDocAttached,
          nocCertificate,
          anyDispute,
          courtCase,
          caseDetails,
          townPlanCheck,
          townPlanApproval,
          expendValid,
          stockListAttached,
          photoAttached,
          acSubhead,
          acSubheadName: selectedSubheadObj?.acSubheadNameLLUnicode || selectedSubheadObj?.acSubheadName || '',
          proposalCost: proposalNum,
          budgetAmount: budgetInfo?.totalBudget ?? 0,
          acHeadValid,
          otherDept,
          workSplit,
          maintenancePeriod,
          prevMaintenance,
          competentOfficer,
          remarks,
          enteredBy: user?.userId ?? 'ERP',
          entryDate: new Date().toISOString(),
        })
        setLastPrintData({
          orderNo: json.orderNo ?? 0,
          proposalType: 'Q',
          finYear,
          deptName: selectedDeptObj?.deptNameLLUnicode || selectedDeptObj?.deptNameLL || selectedDeptObj?.deptName || String(deptCode),
          nastiType, nastiNo, workName, workPlace, mapAttached,
          wardNos: wards.join(','), workNeed, workDoneBefore,
          workAmount: workAmountNum, techApproval, techSanctionNo, techSanctionDate, dsrRates,
          placeOwnership, nocDocAttached, nocCertificate, anyDispute, courtCase, caseDetails,
          townPlanCheck, townPlanApproval, expendValid, stockListAttached, photoAttached,
          acSubhead,
          acSubheadName: selectedSubheadObj?.acSubheadNameLLUnicode || selectedSubheadObj?.acSubheadName || '',
          proposalCost: proposalNum, budgetAmount: budgetInfo?.totalBudget ?? 0,
          acHeadValid, otherDept, workSplit, maintenancePeriod, prevMaintenance, competentOfficer,
          remarks, enteredBy: user?.userId ?? 'ERP', entryDate: new Date().toISOString(),
        })
        // Reset all fields
        setDeptCode(''); setNastiType('')
        setWorkName(''); setWorkPlace(''); setMapAttached(''); setWards([])
        setWorkNeed(''); setWorkDoneBefore(''); setWorkAmount('')
        setTechApproval(''); setTechSanctionNo(''); setTechSanctionDate(''); setDsrRates('')
        setPlaceOwnership(''); setNocDocAttached(''); setNocCertificate('')
        setAnyDispute(''); setCourtCase(''); setCaseDetails('')
        setTownPlanCheck(''); setTownPlanApproval(''); setExpendValid('')
        setStockListAttached(''); setPhotoAttached('')
        setAcSubhead(''); setProposalCost(''); setBudgetInfo(null)
        setAcHeadValid(''); setOtherDept(''); setWorkSplit('')
        setMaintenancePeriod(''); setPrevMaintenance(''); setCompetentOfficer('')
        setRemarks('')
        loadNastiNo()
        setPopup({ open: true, tone: 'success', title: 'प्रस्ताव यशस्वीरित्या जतन झाला', description: `प्रस्ताव क्रमांक: ${json.orderNo ?? '—'}` })
      } else {
        setPopup({ open: true, tone: 'error', title: 'जतन करताना त्रुटी', description: json.message ?? 'अज्ञात त्रुटी' })
      }
    } catch {
      setShowConfirm(false)
      setPopup({ open: true, tone: 'error', title: 'नेटवर्क त्रुटी', description: 'सर्व्हरशी संपर्क होऊ शकला नाही.' })
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          <span className="dash-breadcrumb-current">इतर प्रस्ताव</span>
        </nav>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)', borderRadius: 16, padding: '22px 28px', marginBottom: 24, color: '#fff', boxShadow: '0 4px 20px rgba(45,106,79,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-file-earmark-diff-fill" style={{ fontSize: '1.6rem' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>इतर प्रस्ताव</h1>
              <p style={{ margin: 0, opacity: 0.85, fontSize: '0.88rem' }}>सामान्य प्रशासन विभाग</p>
            </div>
          </div>
        </div>

        {/* Success banner */}
        {savedOrderNo !== null && (
          <div style={{ background: '#e6f9f0', border: '1.5px solid #52c41a', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <i className="bi bi-check-circle-fill" style={{ color: '#52c41a', fontSize: '1.3rem' }} />
              <span style={{ color: '#135e2d', fontWeight: 600 }}>
                प्रस्ताव यशस्वीरित्या नोंदवला! प्रस्ताव क्रमांक: <strong>#{savedOrderNo}</strong>
              </span>
            </div>
            {lastPrintData && (
              <button
                type="button"
                onClick={() => setPrintData(lastPrintData)}
                style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: '#2d6a4f', color: '#fff', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <i className="bi bi-printer-fill" /> मुद्रित करा
              </button>
            )}
          </div>
        )}

        {/* Form card */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px rgba(18,49,76,0.08)', padding: '28px 32px' }}>
          <form onSubmit={handleSubmit} noValidate>

            {/* ══ मूलभूत माहिती ══════════════════════════════════════════════ */}
            <SectionLabel text="मूलभूत माहिती" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>दिनांक</label>
                <input type="text" readOnly value={todayString()} style={{ ...INPUT_STYLE, background: '#f7fafd', color: '#9aabbf' }} />
              </div>
              <div>
                <label style={LABEL_STYLE}>आर्थिक वर्ष <span style={{ color: '#2d6a4f' }}>*</span></label>
                <select value={finYear} onChange={e => setFinYear(e.target.value)} style={INPUT_STYLE}>
                  {FIN_YEARS.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>विभागाचे नांव <span style={{ color: '#2d6a4f' }}>*</span></label>
              {loadingDepts
                ? <div style={{ ...INPUT_STYLE, color: '#9aabbf' }}><span className="spinner-border spinner-border-sm me-2" />लोड होत आहे...</div>
                : <SearchableSelect options={departments.map(d => ({ value: String(d.deptCode), label: `${d.deptCode} - ${d.deptNameLLUnicode || d.deptNameLL || d.deptName}` }))} value={deptCode} onChange={setDeptCode} placeholder="-- विभाग निवडा --" />}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>नस्ती क्रमांक</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  readOnly
                  value={loadingNasti ? '' : nastiNo}
                  style={{ ...INPUT_STYLE, background: '#f7fafd', color: '#18324a', fontWeight: 700, paddingRight: 36 }}
                  placeholder={loadingNasti ? 'क्रमांक मिळवत आहे...' : 'स्वयंचलित'}
                />
                {loadingNasti && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <span className="spinner-border spinner-border-sm" style={{ color: '#2d6a4f' }} role="status" />
                  </span>
                )}
                {!loadingNasti && nastiNo && (
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#52c41a', fontSize: '1rem' }}>
                    <i className="bi bi-check-circle-fill" />
                  </span>
                )}
              </div>
            </div>

            {/* ══ कामाचा तपशील ═══════════════════════════════════════════════ */}
            <SectionLabel text="कामाचा तपशील" />

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>कामगिरीचे नाव <span style={{ color: '#2d6a4f' }}>*</span></label>
              <textarea value={workName} onChange={e => setWorkName(e.target.value)} rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="कामाचे संपूर्ण नाव लिहा..." maxLength={1000} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>कामगिरीचे ठिकाण <span style={{ color: '#2d6a4f' }}>*</span></label>
              <textarea value={workPlace} onChange={e => setWorkPlace(e.target.value)} rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="कामाचे ठिकाण लिहा..." maxLength={500} />
            </div>

            <div style={{ marginBottom: 20, maxWidth: 400 }}>
              <label style={LABEL_STYLE}>कामगिरीचा स्थल नकाशा सोबत जोडला आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
              <AaheNahiSelect value={mapAttached} onChange={setMapAttached} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>वॉर्ड क्रमांक <span style={{ color: '#2d6a4f' }}>*</span></label>
              <WardPicker selected={wards} onChange={setWards} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>कामगिरीची आवश्यकता <span style={{ color: '#2d6a4f' }}>*</span></label>
              <textarea value={workNeed} onChange={e => setWorkNeed(e.target.value)} rows={3} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="कामाची आवश्यकता व महत्त्व लिहा..." maxLength={1000} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>यापूर्वी ही कामगिरी कधी करण्यात आलेली होती का? <span style={{ color: '#2d6a4f' }}>*</span></label>
              <textarea value={workDoneBefore} onChange={e => setWorkDoneBefore(e.target.value)} rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="माहिती लिहा (नसल्यास 'नाही' लिहा)..." maxLength={500} />
            </div>

            <div style={{ marginBottom: 20, maxWidth: 360 }}>
              <label style={LABEL_STYLE}>कामगिरीसाठी अपेक्षित खर्च रुपये <span style={{ color: '#2d6a4f' }}>*</span></label>
              <input type="number" min={0} step="0.01" value={workAmount} onChange={e => setWorkAmount(e.target.value)} style={INPUT_STYLE} placeholder="0.00" />
            </div>

            {/* ══ तांत्रिक मान्यता ════════════════════════════════════════════ */}
            <SectionLabel text="तांत्रिक मान्यता" />

            <div style={{ marginBottom: 20, maxWidth: 400 }}>
              <label style={LABEL_STYLE}>अंदाजपत्रकास सक्षम प्राधिकाऱ्याची तांत्रीक मान्यता प्राप्त आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
              <HoNahiSelect value={techApproval} onChange={setTechApproval} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>तांत्रीक मान्यता क्रमांक <span style={{ color: '#2d6a4f' }}>*</span></label>
                <input type="text" value={techSanctionNo} onChange={e => setTechSanctionNo(e.target.value)} style={INPUT_STYLE} placeholder="मान्यता क्रमांक" maxLength={100} />
              </div>
              <div>
                <label style={LABEL_STYLE}>तांत्रीक मान्यता दिनांक <span style={{ color: '#2d6a4f' }}>*</span></label>
                <input type="date" value={techSanctionDate} onChange={e => setTechSanctionDate(e.target.value)} style={INPUT_STYLE} />
              </div>
            </div>

            <div style={{ marginBottom: 20, maxWidth: 400 }}>
              <label style={LABEL_STYLE}>अंदाजपत्रक DSR दरांप्रमाणे नसल्यास सक्षम प्राधिकाऱ्याची मंजुरी आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
              <HoNahiSelect value={dsrRates} onChange={setDsrRates} />
            </div>

            {/* ══ जागा / स्थळ ════════════════════════════════════════════════ */}
            <SectionLabel text="जागा / स्थळ तपशील" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>प्रस्तावित कामगिरीची जागा महानगरपालिकेच्या मालकीची व प्रत्यक्ष ताब्यात आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={placeOwnership} onChange={setPlaceOwnership} />
              </div>
              <div>
                <label style={LABEL_STYLE}>जागा मालकी हक्क/ना हरकत दाखला याबाबतचे दस्तऐवज सोबत जोडले आहेत का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={nocDocAttached} onChange={setNocDocAttached} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>मालकी हक्क असणाऱ्या व्यक्ती/संस्थेचे ना हरकत प्रमाणपत्र घेतले आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={nocCertificate} onChange={setNocCertificate} />
              </div>
              <div>
                <label style={LABEL_STYLE}>प्रस्तावित कामगिरीच्या जागेबद्दल काही वाद विवाद आहेत का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={anyDispute} onChange={setAnyDispute} />
              </div>
            </div>

            <div style={{ marginBottom: 20, maxWidth: 400 }}>
              <label style={LABEL_STYLE}>प्रस्तावित कामगिरीच्या जागेबद्दल काही न्यायालयीन प्रकरण आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
              <AaheNahiSelect value={courtCase} onChange={setCourtCase} />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>न्यायालयीन प्रकरण दाखल असल्यास त्याचा तपशील <span style={{ color: '#2d6a4f' }}>*</span></label>
              <textarea value={caseDetails} onChange={e => setCaseDetails(e.target.value)} rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="प्रकरण नसल्यास 'लागू नाही' लिहा..." maxLength={500} />
            </div>

            {/* ══ बांधकाम / नगररचना ══════════════════════════════════════════ */}
            <SectionLabel text="बांधकाम / नगररचना" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>बांधकाम प्रस्तावित असल्यास नगररचना विभागाकडून अनुज्ञेयता तपासली आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={townPlanCheck} onChange={setTownPlanCheck} />
              </div>
              <div>
                <label style={LABEL_STYLE}>बांधकाम नकाशांना नगररचना विभागाची परवानगी घेतली आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={townPlanApproval} onChange={setTownPlanApproval} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>प्रस्तावित खर्च महानगरपालिका अधिनियम व शासन निर्देशांप्रमाणे अनुज्ञेय आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={expendValid} onChange={setExpendValid} />
              </div>
              <div>
                <label style={LABEL_STYLE}>वस्तूंची खरेदी असल्यास शिल्लक वस्तूंचा तक्ता सोबत जोडला आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={stockListAttached} onChange={setStockListAttached} />
              </div>
            </div>

            <div style={{ marginBottom: 20, maxWidth: 400 }}>
              <label style={LABEL_STYLE}>प्रस्तावास कामगिरीपूर्वीचे फोटो जोडले आहेत का? <span style={{ color: '#2d6a4f' }}>*</span></label>
              <AaheNahiSelect value={photoAttached} onChange={setPhotoAttached} />
            </div>

            {/* ══ लेखाशीर्ष व अर्थसंकल्प ══════════════════════════════════════ */}
            <SectionLabel text="लेखाशीर्ष व अर्थसंकल्प" />

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>अनुज्ञेय लेखाशीर्ष <span style={{ color: '#2d6a4f' }}>*</span></label>
              {loadingSubheads
                ? <div style={{ ...INPUT_STYLE, color: '#9aabbf' }}><span className="spinner-border spinner-border-sm me-2" />लोड होत आहे...</div>
                : <SearchableSelect
                    options={subheads.map(s => ({ value: s.acSubhead, label: `${s.acSubhead} - ${s.acSubheadNameLLUnicode || s.acSubheadName}` }))}
                    value={acSubhead} onChange={setAcSubhead}
                    placeholder={deptCode ? '-- लेखाशीर्ष निवडा --' : '-- आधी विभाग निवडा --'}
                    disabled={!deptCode}
                  />}
            </div>

            {loadingBudget && <div style={{ textAlign: 'center', color: '#9aabbf', marginBottom: 20, padding: '12px 0' }}><span className="spinner-border spinner-border-sm me-2" />अर्थसंकल्प माहिती लोड होत आहे...</div>}
            {budgetInfo && !loadingBudget && (
              <div style={{ marginBottom: 20 }}>
                {(budgetInfo.capPercentage != null || budgetInfo.capAmount != null) && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff3cd', color: '#856404', border: '1px solid #ffc10740', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem', fontWeight: 700, marginBottom: 10 }}>
                    <i className="bi bi-shield-lock-fill" />
                    बजेट मर्यादा लागू:
                    {budgetInfo.capPercentage != null ? ` ${budgetInfo.capPercentage}%` : ''}
                    {budgetInfo.capAmount != null ? ` ₹ ${fmtCurrency(budgetInfo.capAmount)}` : ''}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
                  <div style={{ background: '#d8f3dc', borderRadius: 10, padding: '12px 16px', border: '1.5px solid #2d6a4f20' }}>
                    <div style={{ fontSize: '0.78rem', color: '#5e7388', marginBottom: 4 }}>अर्थसंकल्पीय तरतूद</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#2d6a4f' }}>₹ {fmtCurrency(budgetInfo.totalBudget)}</div>
                  </div>
                  <div style={{ background: (budgetInfo.capPercentage != null || budgetInfo.capAmount != null) ? '#fff3cd' : '#d8f3dc', borderRadius: 10, padding: '12px 16px', border: '1.5px solid #ffc10740' }}>
                    <div style={{ fontSize: '0.78rem', color: '#5e7388', marginBottom: 4 }}>उपलब्ध (मर्यादित)</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#856404' }}>₹ {fmtCurrency(budgetInfo.effectiveBudget)}</div>
                  </div>
                  <div style={{ background: '#fffbea', borderRadius: 10, padding: '12px 16px', border: '1.5px solid #d9770620' }}>
                    <div style={{ fontSize: '0.78rem', color: '#5e7388', marginBottom: 4 }}>वचनबद्ध खर्च</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#d97706' }}>₹ {fmtCurrency(budgetInfo.actualExpenditure)}</div>
                  </div>
                  <div style={{ background: budgetInfo.remainingBudget < 0 ? '#fff0ee' : '#e6f9f0', borderRadius: 10, padding: '12px 16px', border: `1.5px solid ${budgetInfo.remainingBudget < 0 ? '#c0392b' : '#117a5d'}20` }}>
                    <div style={{ fontSize: '0.78rem', color: '#5e7388', marginBottom: 4 }}>शिल्लक</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, color: budgetInfo.remainingBudget < 0 ? '#c0392b' : '#117a5d' }}>₹ {fmtCurrency(budgetInfo.remainingBudget)}</div>
                  </div>
                </div>
                {budgetInfo.remainingBudget < 0 && (
                  <div style={{ marginTop: 8, background: '#fff0ee', border: '1px solid #c0392b40', borderRadius: 6, padding: '8px 12px', color: '#c0392b', fontSize: '0.8rem', fontWeight: 600 }}>
                    <i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 4 }} />
                    सावधान: वचनबद्ध खर्च उपलब्ध रकमेपेक्षा जास्त आहे!
                  </div>
                )}
              </div>
            )}

            <div style={{ marginBottom: 20, maxWidth: 360 }}>
              <label style={LABEL_STYLE}>प्रस्तावित कामाचा खर्च (₹) <span style={{ color: '#2d6a4f' }}>*</span></label>
              <input
                type="number" min={0} step="0.01" value={proposalCost}
                onChange={e => { setProposalCost(e.target.value); setClientError('') }}
                style={{ ...INPUT_STYLE, borderColor: budgetExceeded ? '#c0392b' : '#c8d8e8' }}
                placeholder="0.00"
              />
              {budgetExceeded && budgetInfo && <p style={{ color: '#c0392b', fontSize: '0.8rem', marginTop: 4, marginBottom: 0 }}><i className="bi bi-shield-exclamation me-1" />बजेट मर्यादा ओलांडली! कमाल उपलब्ध: ₹ {budgetInfo.remainingBudget.toLocaleString('en-IN')}</p>}
            </div>

            <div style={{ marginBottom: 20, maxWidth: 400 }}>
              <label style={LABEL_STYLE}>प्रस्तावित लेखार्शीष प्रस्तावित कामगिरीसाठी अनुज्ञेय आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
              <AaheNahiSelect value={acHeadValid} onChange={setAcHeadValid} />
            </div>

            {/* ══ इतर अनुपालन ══════════════════════════════════════════════════ */}
            <SectionLabel text="इतर अनुपालन" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>ही कामगिरी अन्य विभाग/योजनेतून प्रस्तावित आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={otherDept} onChange={setOtherDept} />
              </div>
              <div>
                <label style={LABEL_STYLE}>सदर कामगिरी एका सलग कामाचे अनेक तुकडे करून पार पाडली जात आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <HoNahiSelect value={workSplit} onChange={setWorkSplit} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div>
                <label style={LABEL_STYLE}>कामगिरीचा परिरक्षण कालावधी <span style={{ color: '#2d6a4f' }}>*</span></label>
                <input type="text" value={maintenancePeriod} onChange={e => setMaintenancePeriod(e.target.value)} style={INPUT_STYLE} placeholder="उदा. 2 वर्षे" maxLength={100} />
              </div>
              <div>
                <label style={LABEL_STYLE}>पूर्वीचा परिरक्षण कालावधी संपण्यापूर्वीच कामगिरी प्रस्तावित आहे का? <span style={{ color: '#2d6a4f' }}>*</span></label>
                <AaheNahiSelect value={prevMaintenance} onChange={setPrevMaintenance} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL_STYLE}>प्रस्तावास प्रशासकीय मान्यता देण्यास पात्र सक्षम प्राधिकारी <span style={{ color: '#2d6a4f' }}>*</span></label>
              <textarea value={competentOfficer} onChange={e => setCompetentOfficer(e.target.value)} rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="सक्षम प्राधिकाऱ्याचे नाव व पद लिहा..." maxLength={500} />
            </div>

            {/* ══ अन्य अभिप्राय ════════════════════════════════════════════════ */}
            <SectionLabel text="अन्य अभिप्राय" />

            <div style={{ marginBottom: 24 }}>
              <label style={LABEL_STYLE}>अन्य अभिप्राय (ऐच्छिक)</label>
              <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} style={{ ...INPUT_STYLE, resize: 'vertical' }} placeholder="आवश्यक असल्यास अभिप्राय लिहा..." maxLength={500} />
            </div>

            {/* Error banner */}
            {clientError && (
              <div style={{ background: '#fff0ee', border: '1.5px solid #c0392b', borderRadius: 9, padding: '10px 16px', marginBottom: 18, color: '#c0392b', fontSize: '0.87rem', fontWeight: 500 }}>
                <i className="bi bi-exclamation-triangle-fill me-2" />{clientError}
              </div>
            )}

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={!canSubmit}
                style={{ padding: '10px 32px', borderRadius: 9, border: 'none', background: canSubmit ? '#2d6a4f' : '#d6d6d6', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: canSubmit ? 'pointer' : 'not-allowed', boxShadow: canSubmit ? '0 2px 8px rgba(45,106,79,0.25)' : 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="bi bi-floppy-fill" />प्रस्ताव जतन करा
              </button>
            </div>

          </form>
        </div>
      </div>

      {showConfirm && <ConfirmModal onConfirm={doSave} onCancel={() => setShowConfirm(false)} saving={saving} />}
      {popup.open && <ErpPopup open={true} tone={popup.tone} title={popup.title} description={popup.description} onClose={() => setPopup(p => ({ ...p, open: false }))} />}
      {printData && <WorkProposalPrintReport data={printData} onClose={() => setPrintData(null)} />}
    </div>
  )
}
