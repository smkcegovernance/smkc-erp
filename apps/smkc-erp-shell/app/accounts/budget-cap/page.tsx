'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccountHead {
  acSubhead: string
  acSubheadName: string | null
  acSubheadNameLL: string | null
  acSubheadNameLLUnicode: string | null
}

interface BudgetCapDto {
  capId: number
  ulbCode: number
  acSubhead: string
  acSubheadName: string | null
  finYear: string
  capPercentage: number | null
  capAmount: number | null
  totalBudget: number
  effectiveBudget: number
  remarks: string | null
  entBy: string | null
  entDt: string | null
  lupBy: string | null
  lupDate: string | null
}

interface BudgetCapHistoryDto {
  histId: number
  capId: number
  acSubhead: string
  finYear: string
  oldCapPct: number | null
  oldCapAmt: number | null
  newCapPct: number | null
  newCapAmt: number | null
  oldRemarks: string | null
  newRemarks: string | null
  action: string
  actionBy: string
  actionDt: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildFinYears(): string[] {
  const now = new Date()
  const cal = now.getFullYear()
  const fy = now.getMonth() >= 3 ? cal : cal - 1
  const years: string[] = []
  for (let y = fy; y >= fy - 4; y--) years.push(`${y}-${y + 1}`)
  return years
}

function fmt(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return d }
}

function actionColor(action: string): string {
  if (action === 'INSERT') return '#198754'
  if (action === 'DELETE') return '#dc3545'
  return '#0d6efd'
}

const ULB_CODE = 1

// ── SearchableSelect ─────────────────────────────────────────────────────────

interface SearchableOption { value: string; label: string }
interface SearchableSelectProps {
  options: SearchableOption[]; value: string; onChange: (v: string) => void
  placeholder?: string; disabled?: boolean
}

const SS_INPUT: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ced4da',
  fontSize: 14, boxSizing: 'border-box', background: '#fff', color: '#212529',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none'
}

function SearchableSelect({ options, value, onChange, placeholder = '-- निवडा --', disabled }: SearchableSelectProps) {
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
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div role="combobox" aria-expanded={open} tabIndex={disabled ? -1 : 0}
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) setOpen(o => !o) } }}
        style={{ ...SS_INPUT, cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#f8f9fa' : '#fff', border: `1px solid ${value ? '#198754' : '#ced4da'}` }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selected ? '#212529' : '#6c757d' }}>
          {selected ? selected.label : placeholder}
        </span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', color: '#9aabbf', marginLeft: 8 }} />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 300, background: '#fff', borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,.15)', border: '1px solid #dee2e6', overflow: 'hidden' }}>
          <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', background: '#f8f9fa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1.5px solid #ced4da', borderRadius: 6, padding: '5px 10px' }}>
              <i className="bi bi-search" style={{ color: '#9aabbf', fontSize: '0.85rem' }} />
              <input autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="शोधा..." style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.88rem', background: 'transparent', color: '#212529' }} />
              {query && <button type="button" onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aabbf', padding: 0 }}><i className="bi bi-x" /></button>}
            </div>
          </div>
          <ul role="listbox" style={{ maxHeight: 260, overflowY: 'auto', margin: 0, padding: '4px 0', listStyle: 'none' }}>
            {filtered.length === 0
              ? <li style={{ padding: '12px 14px', color: '#6c757d', fontSize: '0.86rem', textAlign: 'center' }}>कोणताही पर्याय आढळला नाही</li>
              : filtered.map((o, i) => (
                <li key={`${o.value}-${i}`}>
                  <button type="button" onClick={() => select(o.value)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', cursor: 'pointer', fontSize: '0.875rem', background: o.value === value ? '#e7f1ff' : 'transparent', color: o.value === value ? '#0d6efd' : '#212529', fontWeight: o.value === value ? 600 : 400 }}
                    onMouseEnter={e => { if (o.value !== value) (e.currentTarget as HTMLButtonElement).style.background = '#f0f7ff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = o.value === value ? '#e7f1ff' : 'transparent' }}
                  >{o.label}</button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BudgetCapPage() {
  const { T } = useLanguage()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const FIN_YEARS = buildFinYears()

  // Filters
  const [finYear, setFinYear] = useState(FIN_YEARS[0] ?? '2026-2027')

  // Data
  const [capList, setCapList] = useState<BudgetCapDto[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState('')

  // Account heads for search
  const [allHeads, setAllHeads] = useState<AccountHead[]>([])
  const [headsLoading, setHeadsLoading] = useState(false)

  // Form state
  const [selectedHead, setSelectedHead] = useState<AccountHead | null>(null)
  const [capMode, setCapMode] = useState<'percentage' | 'amount'>('percentage')
  const [capPct, setCapPct] = useState('')
  const [capAmt, setCapAmt] = useState('')
  const [remarks, setRemarks] = useState('')
  const [actionBy] = useState('ADMIN') // In production, get from session
  const [totalBudget, setTotalBudget] = useState<number | null>(null)
  const [fetchingDetails, setFetchingDetails] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [saveError, setSaveError] = useState('')

  // History
  const [history, setHistory] = useState<BudgetCapHistoryDto[]>([])
  const [histLoading, setHistLoading] = useState(false)
  const [histSubhead, setHistSubhead] = useState('')

  // ── Load budget codes for selected fin year ─────────────────────────────

  useEffect(() => {
    setAllHeads([])
    setHeadsLoading(true)
    setSelectedHead(null)
    setTotalBudget(null)
    fetch(`/api/accounts/budget-cap/codes?finYear=${encodeURIComponent(finYear)}`)
      .then(r => r.json())
      .then((res: { success: boolean; data?: AccountHead[] }) => {
        setAllHeads(Array.isArray(res.data) ? res.data : [])
        setHeadsLoading(false)
      })
      .catch(() => setHeadsLoading(false))
  }, [finYear])

  // ── Load cap list ──────────────────────────────────────────────────────────

  const loadList = useCallback(() => {
    setListLoading(true)
    setListError('')
    fetch(`/api/accounts/budget-cap?ulbCode=${ULB_CODE}&finYear=${encodeURIComponent(finYear)}`)
      .then(r => r.json())
      .then((data: BudgetCapDto[]) => {
        setCapList(Array.isArray(data) ? data : [])
        setListLoading(false)
      })
      .catch(err => {
        setListError(err.message)
        setListLoading(false)
      })
  }, [finYear])

  useEffect(() => { loadList() }, [loadList])

  // ── Fetch details when head is selected ──────────────────────────────────

  useEffect(() => {
    if (!selectedHead) { setTotalBudget(null); return }
    setFetchingDetails(true)
    setTotalBudget(null)
    setCapPct('')
    setCapAmt('')
    setRemarks('')

    // Always fetch total budget amount for this code + year
    const budgetP = fetch(
      `/api/general-administration/work-proposals/budget?ulbCode=${ULB_CODE}&deptCode=0&acSubhead=${encodeURIComponent(selectedHead.acSubhead)}&finYear=${encodeURIComponent(finYear)}`
    ).then(r => r.json())

    // Fetch existing cap (if any) to prefill form
    const capP = fetch(
      `/api/accounts/budget-cap?ulbCode=${ULB_CODE}&acSubhead=${encodeURIComponent(selectedHead.acSubhead)}&finYear=${encodeURIComponent(finYear)}`
    ).then(r => r.json())

    Promise.allSettled([budgetP, capP]).then(([budgetRes, capRes]) => {
      // Set total budget from budget endpoint
      if (budgetRes.status === 'fulfilled') {
        const bj = budgetRes.value as { success?: boolean; data?: { totalBudget: number } }
        if (bj.success && bj.data) setTotalBudget(bj.data.totalBudget)
      }
      // Prefill cap values if cap exists
      if (capRes.status === 'fulfilled') {
        const cj = capRes.value as { exists: boolean; data?: BudgetCapDto }
        if (cj.exists && cj.data) {
          setCapMode(cj.data.capAmount != null ? 'amount' : 'percentage')
          setCapPct(cj.data.capPercentage != null ? String(cj.data.capPercentage) : '')
          setCapAmt(cj.data.capAmount != null ? String(cj.data.capAmount) : '')
          setRemarks(cj.data.remarks ?? '')
        }
      }
      setFetchingDetails(false)
    })
  }, [selectedHead, finYear])

  // ── Computed effective budget ─────────────────────────────────────────────

  const computedEffective = (() => {
    if (totalBudget == null) return null
    if (capMode === 'amount' && capAmt) {
      const a = parseFloat(capAmt)
      if (!isNaN(a) && a > 0) return a
    }
    if (capMode === 'percentage' && capPct) {
      const p = parseFloat(capPct)
      if (!isNaN(p) && p > 0 && p <= 100) return Math.round(totalBudget * p / 100)
    }
    return totalBudget
  })()

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!selectedHead) { setSaveError('बजेट कोड निवडा.'); return }
    if (capMode === 'percentage' && (!capPct || parseFloat(capPct) <= 0)) {
      setSaveError('टक्केवारी प्रविष्ट करा (0 पेक्षा जास्त).')
      return
    }
    if (capMode === 'amount' && (!capAmt || parseFloat(capAmt) <= 0)) {
      setSaveError('रक्कम प्रविष्ट करा (0 पेक्षा जास्त).')
      return
    }

    setSaving(true)
    setSaveMsg('')
    setSaveError('')

    const body = {
      ulbCode: ULB_CODE,
      acSubhead: selectedHead.acSubhead,
      finYear,
      capPercentage: capMode === 'percentage' ? parseFloat(capPct) : null,
      capAmount:     capMode === 'amount'      ? parseFloat(capAmt) : null,
      remarks: remarks || null,
      actionBy,
    }

    try {
      const r = await fetch('/api/accounts/budget-cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (r.ok && d.success) {
        setSaveMsg('बजेट मर्यादा यशस्वीरित्या जतन केली.')
        loadList()
        loadHistory(selectedHead.acSubhead)
      } else {
        setSaveError(d.message ?? d.error ?? 'त्रुटी आली.')
      }
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'त्रुटी आली.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete cap ────────────────────────────────────────────────────────────

  async function handleDelete(cap: BudgetCapDto) {
    if (!confirm(`${cap.acSubhead} साठी बजेट मर्यादा रद्द करायची का?`)) return
    const params = new URLSearchParams({
      ulbCode: String(ULB_CODE),
      acSubhead: cap.acSubhead,
      finYear: cap.finYear,
      actionBy,
    })
    try {
      const r = await fetch(`/api/accounts/budget-cap?${params}`, { method: 'DELETE' })
      const d = await r.json()
      if (r.ok && d.success) {
        loadList()
        if (histSubhead === cap.acSubhead) loadHistory(cap.acSubhead)
      } else {
        alert(d.message ?? d.error ?? 'त्रुटी आली.')
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'त्रुटी आली.')
    }
  }

  // ── Edit existing cap ──────────────────────────────────────────────────────

  function handleEdit(cap: BudgetCapDto) {
    const head = allHeads.find(h => h.acSubhead === cap.acSubhead) ?? {
      acSubhead: cap.acSubhead,
      acSubheadName: cap.acSubheadName,
      acSubheadNameLL: null,
      acSubheadNameLLUnicode: null,
    }
    setSelectedHead(head)
    setCapMode(cap.capAmount != null ? 'amount' : 'percentage')
    setCapPct(cap.capPercentage != null ? String(cap.capPercentage) : '')
    setCapAmt(cap.capAmount != null ? String(cap.capAmount) : '')
    setRemarks(cap.remarks ?? '')
    setTotalBudget(cap.totalBudget)
    setSaveMsg('')
    setSaveError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── History ────────────────────────────────────────────────────────────────

  function loadHistory(subhead: string) {
    setHistSubhead(subhead)
    setHistLoading(true)
    fetch(`/api/accounts/budget-cap/history?acSubhead=${encodeURIComponent(subhead)}&finYear=${encodeURIComponent(finYear)}`)
      .then(r => r.json())
      .then((d: BudgetCapHistoryDto[]) => { setHistory(Array.isArray(d) ? d : []); setHistLoading(false) })
      .catch(() => setHistLoading(false))
  }

  // ── Filtered heads for dropdown ────────────────────────────────────────────

  // ── Grid: search + pagination state ──────────────────────────────────────
  const [gridSearch, setGridSearch] = useState('')
  const [gridPage, setGridPage] = useState(1)
  const [gridPageSize, setGridPageSize] = useState(25)
  type SortKey = 'acSubhead' | 'acSubheadName' | 'totalBudget' | 'capPercentage' | 'capAmount' | 'effectiveBudget' | 'lastChange'
  const [sortKey, setSortKey] = useState<SortKey>('lastChange')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filteredCaps = capList.filter(c => {
    if (!gridSearch.trim()) return true
    const q = gridSearch.toLowerCase()
    return (
      c.acSubhead.toLowerCase().includes(q) ||
      (c.acSubheadName ?? '').toLowerCase().includes(q) ||
      (c.remarks ?? '').toLowerCase().includes(q) ||
      (c.entBy ?? '').toLowerCase().includes(q) ||
      (c.lupBy ?? '').toLowerCase().includes(q) ||
      (c.capPercentage != null ? String(c.capPercentage) : '').includes(q)
    )
  })

  const sortedCaps = [...filteredCaps].sort((a, b) => {
    let av: string | number, bv: string | number
    switch (sortKey) {
      case 'acSubhead':       av = a.acSubhead;                bv = b.acSubhead;                break
      case 'acSubheadName':   av = a.acSubheadName ?? '';      bv = b.acSubheadName ?? '';      break
      case 'totalBudget':     av = a.totalBudget;              bv = b.totalBudget;              break
      case 'capPercentage':   av = a.capPercentage ?? -1;      bv = b.capPercentage ?? -1;      break
      case 'capAmount':       av = a.capAmount ?? -1;          bv = b.capAmount ?? -1;          break
      case 'effectiveBudget': av = a.effectiveBudget;          bv = b.effectiveBudget;          break
      case 'lastChange':      av = a.lupDate ?? a.entDt ?? ''; bv = b.lupDate ?? b.entDt ?? ''; break
      default:                av = '';                         bv = ''
    }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedCaps.length / gridPageSize))
  const safePage   = Math.min(gridPage, totalPages)
  const pagedCaps  = sortedCaps.slice((safePage - 1) * gridPageSize, safePage * gridPageSize)

  // reset to page 1 on search or page-size change
  function handleGridSearch(v: string) { setGridSearch(v); setGridPage(1) }
  function handleGridPageSize(n: number) { setGridPageSize(n); setGridPage(1) }
  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
    setGridPage(1)
  }

  function PaginationBar() {
    const pages: (number | '…')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (safePage > 3) pages.push('…')
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i)
      if (safePage < totalPages - 2) pages.push('…')
      pages.push(totalPages)
    }
    const btnBase: React.CSSProperties = { padding: '4px 10px', border: '1px solid #dee2e6', borderRadius: 4, cursor: 'pointer', fontSize: 13, background: '#fff', color: '#495057' }
    const btnActive: React.CSSProperties = { ...btnBase, background: '#0d6efd', color: '#fff', borderColor: '#0d6efd', fontWeight: 700 }
    const btnDisabled: React.CSSProperties = { ...btnBase, opacity: 0.45, cursor: 'default' }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        <button style={safePage === 1 ? btnDisabled : btnBase} disabled={safePage === 1} onClick={() => setGridPage(1)}>«</button>
        <button style={safePage === 1 ? btnDisabled : btnBase} disabled={safePage === 1} onClick={() => setGridPage(p => p - 1)}>‹</button>
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`e${i}`} style={{ padding: '4px 6px', color: '#6c757d' }}>…</span>
            : <button key={p} style={p === safePage ? btnActive : btnBase} onClick={() => setGridPage(p as number)}>{p}</button>
        )}
        <button style={safePage === totalPages ? btnDisabled : btnBase} disabled={safePage === totalPages} onClick={() => setGridPage(p => p + 1)}>›</button>
        <button style={safePage === totalPages ? btnDisabled : btnBase} disabled={safePage === totalPages} onClick={() => setGridPage(totalPages)}>»</button>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
      <DeptSidebar deptKey="accounts" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(p => !p)} />

      <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Breadcrumb */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <Link href="/accounts/dashboard" className="dash-breadcrumb-home">{T.depts['accounts']?.label ?? 'Accounts'}</Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="dash-breadcrumb-current">बजेट मर्यादा व्यवस्थापन</span>
        </nav>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button onClick={() => setSidebarOpen(p => !p)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#495057' }}>
            <i className="bi bi-layout-sidebar" />
          </button>
          <div>
            <h4 style={{ margin: 0, color: '#212529', fontWeight: 700 }}>
              <i className="bi bi-shield-lock-fill" style={{ color: '#0d6efd', marginRight: 8 }} />
              बजेट मर्यादा व्यवस्थापन
            </h4>
            <small style={{ color: '#6c757d' }}>Budget Cap Management — Accounts Department</small>
          </div>
        </div>

        {/* Year selector */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 20, marginBottom: 20 }}>
          <label style={{ fontWeight: 600, marginRight: 12, color: '#495057' }}>आर्थिक वर्ष:</label>
          <select value={finYear} onChange={e => setFinYear(e.target.value)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ced4da', fontWeight: 600, color: '#212529' }}>
            {FIN_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* ── Form Card ─────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 24, marginBottom: 24 }}>
          <h6 style={{ fontWeight: 700, color: '#0d6efd', marginBottom: 18 }}>
            <i className="bi bi-plus-circle-fill" style={{ marginRight: 6 }} />
            बजेट मर्यादा सेट करा / अपडेट करा
          </h6>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 16 }}>
            {/* Budget code searchable select */}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#495057', marginBottom: 5, fontWeight: 600 }}>
                बजेट कोड / खाते शीर्षक *
                {headsLoading && <span style={{ marginLeft: 8, fontSize: 11, color: '#6c757d', fontWeight: 400 }}>(लोड होत आहे...)</span>}
                {!headsLoading && allHeads.length > 0 && <span style={{ marginLeft: 8, fontSize: 11, color: '#198754', fontWeight: 400 }}>({allHeads.length} कोड उपलब्ध)</span>}
              </label>
              {headsLoading
                ? <div style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ced4da', background: '#f8f9fa', color: '#6c757d', fontSize: 14 }}>
                    <span className="spinner-border spinner-border-sm me-2" style={{ width: 12, height: 12, borderWidth: 2 }} />लोड होत आहे...
                  </div>
                : <SearchableSelect
                    options={allHeads.map(h => ({
                      value: h.acSubhead,
                      label: `${h.acSubhead} — ${h.acSubheadNameLLUnicode ?? h.acSubheadNameLL ?? h.acSubheadName ?? ''}`
                    }))}
                    value={selectedHead?.acSubhead ?? ''}
                    onChange={v => {
                      const h = allHeads.find(a => a.acSubhead === v) ?? null
                      setSelectedHead(h)
                      if (!h) setTotalBudget(null)
                    }}
                    placeholder="-- बजेट कोड निवडा --"
                  />}
            </div>

            {/* Mode toggle */}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#495057', marginBottom: 5, fontWeight: 600 }}>मर्यादा प्रकार</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['percentage', 'amount'] as const).map(m => (
                  <button key={m} onClick={() => setCapMode(m)}
                    style={{ flex: 1, padding: '8px', borderRadius: 6, border: `2px solid ${capMode === m ? '#0d6efd' : '#ced4da'}`, background: capMode === m ? '#e7f1ff' : '#fff', color: capMode === m ? '#0d6efd' : '#495057', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                    {m === 'percentage' ? '% टक्केवारी' : '₹ रक्कम'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 16 }}>
            {/* Cap value */}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#495057', marginBottom: 5, fontWeight: 600 }}>
                {capMode === 'percentage' ? 'मर्यादा टक्केवारी (%)' : 'मर्यादा रक्कम (₹)'}
              </label>
              {capMode === 'percentage' ? (
                <input type="number" min="0.01" max="100" step="0.01" value={capPct}
                  onChange={e => setCapPct(e.target.value)}
                  placeholder="उदा. 60"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ced4da', fontSize: 14, boxSizing: 'border-box' }} />
              ) : (
                <input type="number" min="1" step="1" value={capAmt}
                  onChange={e => setCapAmt(e.target.value)}
                  placeholder="रक्कम (रुपये)"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ced4da', fontSize: 14, boxSizing: 'border-box' }} />
              )}
            </div>

            {/* Total budget info */}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#495057', marginBottom: 5, fontWeight: 600 }}>एकूण मंजूर बजेट</label>
              <div style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${totalBudget != null ? '#c3e6cb' : '#e9ecef'}`, background: totalBudget != null ? '#f0fff4' : '#f8f9fa', fontSize: 14, color: '#212529', fontWeight: 600, minHeight: 36, display: 'flex', alignItems: 'center' }}>
                {fetchingDetails
                  ? <span style={{ color: '#6c757d', fontWeight: 400 }}><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12, borderWidth: 2 }} />लोड होत आहे...</span>
                  : totalBudget != null
                    ? <><i className="bi bi-cash-coin" style={{ marginRight: 6, color: '#198754' }} />₹ {fmt(totalBudget)}</>
                    : <span style={{ color: '#6c757d', fontWeight: 400 }}>बजेट कोड निवडा</span>}
              </div>
            </div>

            {/* Effective budget preview */}
            <div>
              <label style={{ display: 'block', fontSize: 13, color: '#495057', marginBottom: 5, fontWeight: 600 }}>मर्यादित रक्कम (पूर्वावलोकन)</label>
              <div style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #c3e6cb', background: '#d4edda', fontSize: 14, color: '#155724', fontWeight: 700 }}>
                {computedEffective != null ? `₹ ${fmt(computedEffective)}` : <span style={{ color: '#6c757d' }}>—</span>}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#495057', marginBottom: 5, fontWeight: 600 }}>शेरा / नोंद</label>
            <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)}
              placeholder="वैकल्पिक नोंद…"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ced4da', fontSize: 14, boxSizing: 'border-box', resize: 'vertical' }} />
          </div>

          {saveMsg && <div style={{ background: '#d4edda', color: '#155724', padding: '10px 14px', borderRadius: 6, marginBottom: 12, fontWeight: 600 }}><i className="bi bi-check-circle-fill" style={{ marginRight: 6 }} />{saveMsg}</div>}
          {saveError && <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px 14px', borderRadius: 6, marginBottom: 12 }}><i className="bi bi-exclamation-triangle-fill" style={{ marginRight: 6 }} />{saveError}</div>}

          <button onClick={handleSave} disabled={saving}
            style={{ padding: '10px 28px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 15, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'जतन होत आहे…' : <><i className="bi bi-floppy-fill" style={{ marginRight: 6 }} />मर्यादा जतन करा</>}
          </button>
        </div>

        {/* ── Caps List ─────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 24, marginBottom: 24 }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <h6 style={{ fontWeight: 700, color: '#212529', margin: 0 }}>
              <i className="bi bi-table" style={{ marginRight: 6, color: '#0d6efd' }} />
              सध्याच्या मर्यादा — {finYear}
              {!listLoading && capList.length > 0 && (
                <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 400, color: '#6c757d' }}>
                  ({filteredCaps.length} / {capList.length} नोंदी)
                </span>
              )}
            </h6>
            <button onClick={loadList} title="ताजे करा" style={{ padding: '5px 14px', background: '#f8f9fa', border: '1px solid #ced4da', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              <i className="bi bi-arrow-clockwise" />
            </button>
          </div>

          {/* Search + page-size toolbar */}
          {!listLoading && !listError && capList.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: 8, background: '#f8f9fa', border: '1.5px solid #ced4da', borderRadius: 6, padding: '6px 12px' }}>
                <i className="bi bi-search" style={{ color: '#9aabbf', fontSize: '0.85rem' }} />
                <input
                  type="text"
                  value={gridSearch}
                  onChange={e => handleGridSearch(e.target.value)}
                  placeholder="बजेट कोड / नाव / टक्केवारी शोधा…"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#212529' }}
                />
                {gridSearch && (
                  <button onClick={() => handleGridSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aabbf', padding: 0, lineHeight: 1 }}>
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#495057' }}>
                <span>दर पृष्ठ:</span>
                {[10, 25, 50, 100].map(n => (
                  <button key={n} onClick={() => handleGridPageSize(n)}
                    style={{ padding: '4px 10px', borderRadius: 4, border: `1px solid ${gridPageSize === n ? '#0d6efd' : '#dee2e6'}`, background: gridPageSize === n ? '#e7f1ff' : '#fff', color: gridPageSize === n ? '#0d6efd' : '#495057', fontWeight: gridPageSize === n ? 700 : 400, cursor: 'pointer', fontSize: 12 }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {listLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
              <span className="spinner-border spinner-border-sm me-2" style={{ width: 16, height: 16, borderWidth: 2 }} />
              लोड होत आहे…
            </div>
          ) : listError ? (
            <div style={{ padding: 16, background: '#f8d7da', borderRadius: 6, color: '#721c24' }}>{listError}</div>
          ) : capList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
              <i className="bi bi-inbox" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
              {finYear} साठी कोणतीही मर्यादा सेट केलेली नाही.
            </div>
          ) : filteredCaps.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
              <i className="bi bi-search" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
              &ldquo;{gridSearch}&rdquo; साठी कोणतीही नोंद आढळली नाही.
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f0f7ff' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#0d6efd', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', width: 40 }}>#</th>
                      {([
                        ['बजेट कोड', 'acSubhead'],
                        ['नाव', 'acSubheadName'],
                        ['एकूण बजेट', 'totalBudget'],
                        ['मर्यादा %', 'capPercentage'],
                        ['मर्यादा रक्कम', 'capAmount'],
                        ['उपलब्ध रक्कम', 'effectiveBudget'],
                        ['शेवटचा बदल', 'lastChange'],
                      ] as [string, SortKey][]).map(([label, key]) => (
                        <th key={key} onClick={() => handleSort(key)}
                          style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: sortKey === key ? '#0d6efd' : '#495057', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                          {label}
                          <span style={{ marginLeft: 4, fontSize: 10, color: sortKey === key ? '#0d6efd' : '#adb5bd' }}>
                            {sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                          </span>
                        </th>
                      ))}
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#495057', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>क्रिया</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedCaps.map((c, i) => (
                      <tr key={c.capId} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#adb5bd', fontSize: 12 }}>
                          {(safePage - 1) * gridPageSize + i + 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#0d6efd' }}>{c.acSubhead}</td>
                        <td style={{ padding: '10px 12px', color: '#495057' }}>{c.acSubheadName ?? '—'}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>₹ {fmt(c.totalBudget)}</td>
                        <td style={{ padding: '10px 12px' }}>
                          {c.capPercentage != null
                            ? <span style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>{c.capPercentage}%</span>
                            : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                          {c.capAmount != null ? `₹ ${fmt(c.capAmount)}` : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#155724' }}>₹ {fmt(c.effectiveBudget)}</td>
                        <td style={{ padding: '10px 12px', color: '#6c757d', fontSize: 12 }}>
                          {c.lupBy ?? c.entBy ?? '—'}<br />{fmtDate(c.lupDate ?? c.entDt)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => handleEdit(c)} title="संपादित करा" style={{ marginRight: 6, padding: '4px 10px', background: '#e7f1ff', color: '#0d6efd', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                            <i className="bi bi-pencil-fill" />
                          </button>
                          <button onClick={() => loadHistory(c.acSubhead)} title="इतिहास पहा" style={{ marginRight: 6, padding: '4px 10px', background: '#f0fff4', color: '#198754', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                            <i className="bi bi-clock-history" />
                          </button>
                          <button onClick={() => handleDelete(c)} title="हटवा" style={{ padding: '4px 10px', background: '#fff5f5', color: '#dc3545', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                            <i className="bi bi-trash3-fill" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#6c757d' }}>
                  {(safePage - 1) * gridPageSize + 1}–{Math.min(safePage * gridPageSize, filteredCaps.length)} पैकी {filteredCaps.length} नोंदी दाखवत आहे
                </span>
                <PaginationBar />
              </div>
            </>
          )}
        </div>

        {/* ── History Panel ──────────────────────────────────────────────────── */}
        {histSubhead && (
          <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,.08)', padding: 24 }}>
            <h6 style={{ fontWeight: 700, color: '#212529', marginBottom: 16 }}>
              <i className="bi bi-clock-history" style={{ marginRight: 6, color: '#6c757d' }} />
              बदल इतिहास — {histSubhead} / {finYear}
            </h6>

            {histLoading ? (
              <div style={{ padding: 20, color: '#6c757d' }}>लोड होत आहे…</div>
            ) : history.length === 0 ? (
              <div style={{ padding: 20, color: '#6c757d' }}>कोणताही इतिहास नाही.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      {['क्रिया', 'जुनी %', 'जुनी रक्कम', 'नवीन %', 'नवीन रक्कम', 'नोंद', 'बदल केला', 'तारीख वेळ'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: '#495057', borderBottom: '2px solid #dee2e6', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h, i) => (
                      <tr key={h.histId} style={{ background: i % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{ background: actionColor(h.action) + '22', color: actionColor(h.action), padding: '2px 8px', borderRadius: 10, fontWeight: 700, fontSize: 11 }}>{h.action}</span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>{h.oldCapPct != null ? `${h.oldCapPct}%` : '—'}</td>
                        <td style={{ padding: '8px 12px' }}>{h.oldCapAmt != null ? `₹ ${fmt(h.oldCapAmt)}` : '—'}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{h.newCapPct != null ? `${h.newCapPct}%` : '—'}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{h.newCapAmt != null ? `₹ ${fmt(h.newCapAmt)}` : '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#6c757d', fontSize: 12 }}>{h.newRemarks ?? h.oldRemarks ?? '—'}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{h.actionBy}</td>
                        <td style={{ padding: '8px 12px', color: '#6c757d', fontSize: 12 }}>{fmtDate(h.actionDt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
