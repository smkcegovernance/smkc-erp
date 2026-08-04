'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'
import { currentUser } from '@smkc/auth'

interface SanctionOfficial { sanctionId: number; sanctionNameLL: string }

interface NastiValidation {
  nastiFound: boolean
  primaryBookEntryDone: boolean
  finalBookEntryDone: boolean
  primaryBookEntryNo: number
  finalBookEntryNo: number
  samajGenerated: boolean
  workOrderNotExists: boolean
  nastiNo: number
  deptCode: number
  deptName: string
  proposalName: string
  proposalAmount: number
  acSubhead: string
  finYear: string
  samajNo: number
  samajDisplayNo: string
  samajDate: string
  eligibleVendorName: string
  vendorProposedAmount: number
  existingWorkOrderNo: number
  existingWorkOrderDisplayNo: string
  validationMessage: string
}

interface WorkOrderResult {
  success: boolean
  workOrderNo: number
  workOrderDisplayNo: string
  finYear: string
  deptCode: number
  message: string
}

function calcStampAmt(amount: number): number {
  if (amount < 1_000_000) return 500
  const excess = amount - 1_000_000
  const extraLakhs = Math.floor(excess / 100_000) + (excess % 100_000 > 0 ? 1 : 0)
  return 500 + extraLakhs * 100
}

function fmtINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

const INPUT: React.CSSProperties = {
  width: '100%', border: '1.5px solid #c8d8e8', borderRadius: 8,
  padding: '9px 12px', fontSize: '0.9rem', color: '#18324a',
  background: '#fff', outline: 'none', boxSizing: 'border-box',
}
const INPUT_RO: React.CSSProperties = { ...INPUT, background: '#f3f7fb', color: '#4a6580' }
const LABEL: React.CSSProperties = {
  display: 'block', marginBottom: 4, fontSize: '0.82rem',
  fontWeight: 600, color: '#5e7388', letterSpacing: '0.02em',
}

function SL({ text }: { text: string }) {
  return (
    <div style={{ borderLeft: '4px solid #1a6db5', paddingLeft: 12, marginBottom: 16, marginTop: 28 }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a6db5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{text}</span>
    </div>
  )
}

function CheckRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700,
        background: ok ? '#d4edda' : '#f8d7da', color: ok ? '#155724' : '#721c24', flexShrink: 0,
      }}>
        {ok ? '✓' : '✗'}
      </span>
      <span style={{ fontSize: '0.88rem', color: ok ? '#155724' : '#721c24' }}>{label}</span>
    </div>
  )
}

export default function CreateWorkOrderPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { lang, T, tMenu } = useLanguage()
  const mr = lang === 'mr'

  // Search state
  const [searchNo, setSearchNo] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [validation, setValidation] = useState<NastiValidation | null>(null)

  // Dropdowns
  const [authorities, setAuthorities] = useState<SanctionOfficial[]>([])
  const [signingOfficers, setSigningOfficers] = useState<SanctionOfficial[]>([])

  // Form fields
  const [workPeriod, setWorkPeriod] = useState('')
  const [periodType, setPeriodType] = useState('दिवस')
  const [supervisorName, setSupervisorName] = useState('')
  const [authorityId, setAuthorityId] = useState('')
  const [manualOrderNo, setManualOrderNo] = useState('')
  const [sanctionDate, setSanctionDate] = useState('')
  const [signingId, setSigningId] = useState('')
  const [stampAmt, setStampAmt] = useState(0)
  const [contractors, setContractors] = useState<string[]>([''])

  // Submit state
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<WorkOrderResult | null>(null)
  const [popup, setPopup] = useState<{ tone: 'success' | 'error'; title: string } | null>(null)

  // Load authorities on mount
  useEffect(() => {
    fetch('/api/gad/work-order/sanction-authorities')
      .then(r => r.json())
      .then(d => {
        const arr = d?.data ?? d
        setAuthorities(Array.isArray(arr) ? arr : (arr?.$values ?? []))
      })
      .catch(() => {})
  }, [])

  // Load signing officers when dept is known
  useEffect(() => {
    if (!validation?.deptCode) return
    fetch(`/api/gad/work-order/signing-officers?deptCode=${validation.deptCode}`)
      .then(r => r.json())
      .then(d => {
        const arr = d?.data ?? d
        setSigningOfficers(Array.isArray(arr) ? arr : (arr?.$values ?? []))
      })
      .catch(() => {})
  }, [validation?.deptCode])

  // Auto-calculate stamp when vendor amount changes
  useEffect(() => {
    if (validation?.vendorProposedAmount && validation.vendorProposedAmount > 0)
      setStampAmt(calcStampAmt(validation.vendorProposedAmount))
  }, [validation?.vendorProposedAmount])

  const isReady = !!(
    validation?.nastiFound &&
    validation.primaryBookEntryDone &&
    validation.finalBookEntryDone &&
    validation.samajGenerated &&
    validation.workOrderNotExists
  )

  async function doSearch() {
    const trimmed = searchNo.trim()
    if (!trimmed || isNaN(parseInt(trimmed))) {
      setSearchErr('नस्ती क्रमांक ठाका.')
      return
    }
    setSearching(true)
    setSearchErr('')
    setValidation(null)
    // Reset form
    setWorkPeriod('')
    setPeriodType('दिवस')
    setSupervisorName('')
    setAuthorityId('')
    setManualOrderNo('')
    setSanctionDate('')
    setSigningId('')
    setStampAmt(0)
    setContractors([''])
    setResult(null)
    try {
      const r = await fetch(`/api/gad/work-order/validate-nasti?nastiNo=${encodeURIComponent(trimmed)}`)
      const json = await r.json()
      if (!r.ok) {
        setSearchErr(json.message || 'सर्व्हरशी संपर्क होउ शकला नाही.')
        return
      }
      setValidation(json.data)
    } catch {
      setSearchErr('सर्व्हरशी संपर्क होउ शकला नाही.')
    } finally {
      setSearching(false)
    }
  }

  function addContractor() { setContractors(prev => [...prev, '']) }
  function removeContractor(i: number) {
    setContractors(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [''])
  }
  function updateContractor(i: number, val: string) {
    setContractors(prev => prev.map((c, idx) => idx === i ? val : c))
  }

  async function doSubmit() {
    if (!validation || !isReady) return
    setSaving(true)
    try {
      const user = currentUser()
      const body = {
        nastiNo: String(validation.nastiNo),
        deptCode: validation.deptCode,
        finYear: validation.finYear,
        proposalName: validation.proposalName,
        proposalAmount: validation.proposalAmount,
        eligibleVendorName: validation.eligibleVendorName,
        vendorProposedAmount: validation.vendorProposedAmount,
        workPeriod,
        periodType,
        supervisorName,
        authorityOfficials: parseInt(authorityId),
        manualFinalOrderNo: manualOrderNo,
        sanctionDate,
        sanctionFile: '',
        signingAuth: parseInt(signingId),
        stampAmt,
        contractors: contractors.filter(c => c.trim()),
        enteredBy: user?.userId ?? 'ERP',
      }
      const r = await fetch('/api/gad/work-order/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await r.json()
      if (json.success) {
        setResult(json.data)
        setShowConfirm(false)
        setPopup({ tone: 'success', title: mr ? 'वर्क ऑर्डर तयार झाली!' : 'Work Order generated!' })
      } else {
        setPopup({ tone: 'error', title: json.message || 'एरर आली.' })
        setShowConfirm(false)
      }
    } catch {
      setPopup({ tone: 'error', title: 'नेटवर्क एरर.' })
      setShowConfirm(false)
    } finally {
      setSaving(false)
    }
  }

  async function openPrint(item: WorkOrderResult) {
    try {
      const r = await fetch(
        `/api/gad/work-order/make-print-token?workOrderNo=${item.workOrderNo}&deptCode=${item.deptCode}&finYear=${encodeURIComponent(item.finYear)}`
      )
      const json = await r.json()
      if (json.success)
        window.open(`/general-administration/create-work-order/print?t=${json.token}`, '_blank')
    } catch { /* ignore */ }
  }

  const formValid = isReady && authorityId && manualOrderNo.trim() && sanctionDate && signingId && workPeriod.trim()

  return (
    <div className="dept-layout">
      <DeptSidebar deptKey="general-administration" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <main className="erp-main">
        {/* Breadcrumb */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep">›</span>
          <Link href="/general-administration/dashboard" className="dash-breadcrumb-home">
            {T.depts['general-administration']?.label ?? 'सामान्य प्रशासन'}
          </Link>
          <span className="dash-breadcrumb-sep">›</span>
          <span className="dash-breadcrumb-current">{mr ? 'नवीन वर्क ऑर्डर' : 'New Work Order'}</span>
        </nav>

        {/* Header */}
        <div className="erp-page-header">
          <div className="erp-page-header-text">
            <div className="d-flex align-items-center gap-2">
              <button type="button" className="dept-sidebar-toggle-btn"
                onClick={() => setSidebarOpen(o => !o)}>
                <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} />
              </button>
              <h1 className="erp-page-title mb-0">{mr ? 'वर्क ऑर्डर निर्मिती' : 'Work Order Generation'}</h1>
            </div>
          </div>
          <Link href="/general-administration/work-order-list" className="btn btn-outline-secondary btn-sm">
            <i className="bi bi-list-ul me-1" />{mr ? 'यादी पहा' : 'View List'}
          </Link>
        </div>

        {/* Success result card */}
        {result && (
          <div style={{ background: 'linear-gradient(135deg,#d4edda,#c3e6cb)', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #b8dfc2' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#155724', marginBottom: 8 }}>
              ✓ {mr ? 'वर्क ऑर्डर यशस्वीपणे तयार झाली!' : 'Work Order generated successfully!'}
            </div>
            <div style={{ fontSize: '0.95rem', color: '#155724', marginBottom: 12 }}>
              {mr ? 'वर्क ऑर्डर क्रमांक:' : 'Work Order No:'}{' '}
              <strong>{result.workOrderDisplayNo}</strong>
            </div>
            <button type="button" className="btn btn-primary btn-sm me-2" onClick={() => openPrint(result)}>
              <i className="bi bi-printer me-1" />{mr ? 'छापा' : 'Print'}
            </button>
            <button type="button" className="btn btn-outline-secondary btn-sm"
              onClick={() => { setResult(null); setValidation(null); setSearchNo('') }}>
              {mr ? 'नवीन वर्क ऑर्डर' : 'New Work Order'}
            </button>
          </div>
        )}

        {/* Search section */}
        {!result && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(26,109,181,0.07)', marginBottom: 24 }}>
            <SL text={mr ? 'नस्ती शोधा' : 'Search Nasti'} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 220px' }}>
                <label style={LABEL}>{mr ? 'नस्ती क्रमांक' : 'Nasti No.'}</label>
                <input
                  type="number"
                  style={INPUT}
                  value={searchNo}
                  onChange={e => setSearchNo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="e.g. 700744"
                  disabled={searching}
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ height: 42 }}
                onClick={doSearch}
                disabled={searching}
              >
                {searching ? <><span className="spinner-border spinner-border-sm me-1" />शोधत आहे...</> : (mr ? 'शोधा' : 'Search')}
              </button>
            </div>
            {searchErr && <div className="text-danger mt-2" style={{ fontSize: '0.85rem' }}>{searchErr}</div>}

            {/* Validation status panel */}
            {validation && (
              <div style={{ marginTop: 20, padding: 16, background: '#f8f9fa', borderRadius: 8, border: '1px solid #dee2e6' }}>
                <div style={{ fontWeight: 700, color: '#343a40', marginBottom: 12, fontSize: '0.9rem' }}>
                  {mr ? 'तपासणी परिणाम — नस्ती क्र.' : 'Validation — Nasti No.'} {validation.nastiNo}
                </div>
                <CheckRow ok={validation.nastiFound} label={mr ? 'नस्ती क्रमांक आढळला' : 'Nasti found in records'} />
                <CheckRow ok={validation.primaryBookEntryDone} label={mr ? 'प्राथमिक बजेट नोंद झाली' : 'Primary budget book entry done'} />
                <CheckRow ok={validation.finalBookEntryDone} label={mr ? 'अंतिम बजेट नोंद झाली' : 'Final budget book entry done'} />
                <CheckRow
                  ok={validation.samajGenerated}
                  label={validation.samajGenerated
                    ? `${mr ? 'समज तयार झाला' : 'Samaj generated'} — ${validation.samajDisplayNo} (${validation.samajDate})`
                    : (mr ? 'समज अजून तयार केलेला नाही' : 'Samaj not yet generated')}
                />
                <CheckRow
                  ok={validation.workOrderNotExists}
                  label={validation.workOrderNotExists
                    ? (mr ? 'वर्क ऑर्डर अजून तयार केलेली नाही' : 'Work order not yet generated')
                    : `${mr ? 'वर्क ऑर्डर आधीच तयार आहे' : 'Work order already exists'}: ${validation.existingWorkOrderDisplayNo}`}
                />
                {!isReady && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#f8d7da', borderRadius: 6, color: '#721c24', fontSize: '0.85rem', fontWeight: 600 }}>
                    {validation.validationMessage}
                  </div>
                )}
                {isReady && (
                  <div style={{ marginTop: 10, padding: '8px 12px', background: '#d4edda', borderRadius: 6, color: '#155724', fontSize: '0.85rem', fontWeight: 600 }}>
                    ✓ {mr ? 'वर्क ऑर्डर तयार करण्यास तयार' : 'Ready to generate work order'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Work Order Form — only shown when validation passes */}
        {!result && isReady && validation && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(26,109,181,0.07)' }}>

            {/* Samaj reference banner */}
            <div style={{ background: 'linear-gradient(135deg,#e8f4fd,#d6eaf8)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, border: '1px solid #c3d8ec' }}>
              <span style={{ fontSize: '0.82rem', color: '#1a6db5', fontWeight: 600 }}>
                {mr ? 'संदर्भ समज:' : 'Reference Samaj:'} <strong>{validation.samajDisplayNo}</strong>
                {' · '}{mr ? 'दिनांक:' : 'Date:'} {validation.samajDate}
              </span>
            </div>

            {/* Section: Proposal details (read-only) */}
            <SL text={mr ? 'प्रस्ताव तपशील' : 'Proposal Details'} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 8 }}>
              <div>
                <label style={LABEL}>{mr ? 'विभाग' : 'Department'}</label>
                <input style={INPUT_RO} readOnly value={validation.deptName} />
              </div>
              <div>
                <label style={LABEL}>{mr ? 'आर्थिक वर्ष' : 'Financial Year'}</label>
                <input style={INPUT_RO} readOnly value={validation.finYear} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={LABEL}>{mr ? 'कामाचे नाव' : 'Proposal Name'}</label>
                <input style={INPUT_RO} readOnly value={validation.proposalName} />
              </div>
              <div>
                <label style={LABEL}>{mr ? 'अंदाजपत्रक रक्कम (रु.)' : 'Proposal Amount (₹)'}</label>
                <input style={INPUT_RO} readOnly value={fmtINR(validation.proposalAmount)} />
              </div>
              <div>
                <label style={LABEL}>{mr ? 'कंत्राटदाराचे नाव (समज)' : 'Contractor Name (from Samaj)'}</label>
                <input style={INPUT_RO} readOnly value={validation.eligibleVendorName} />
              </div>
              <div>
                <label style={LABEL}>{mr ? 'कंत्राटदाराची रक्कम (रु.) (समज)' : 'Contractor Amount (₹) (from Samaj)'}</label>
                <input style={INPUT_RO} readOnly value={fmtINR(validation.vendorProposedAmount)} />
              </div>
            </div>

            {/* Section: Work period */}
            <SL text={mr ? 'काम तपशील' : 'Work Details'} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 8 }}>
              <div>
                <label style={LABEL}>{mr ? 'कामाचा कालावधी' : 'Work Period'} <span className="text-danger">*</span></label>
                <input
                  type="number"
                  style={INPUT}
                  value={workPeriod}
                  onChange={e => setWorkPeriod(e.target.value)}
                  placeholder="e.g. 90"
                  min={1}
                />
              </div>
              <div>
                <label style={LABEL}>{mr ? 'कालावधी प्रकार' : 'Period Type'}</label>
                <div style={{ display: 'flex', gap: 16, paddingTop: 10 }}>
                  {['दिवस', 'महिने'].map(pt => (
                    <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="radio" value={pt} checked={periodType === pt} onChange={() => setPeriodType(pt)} />
                      {pt}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label style={LABEL}>{mr ? 'निरीक्षकाचे नाव' : 'Supervisor Name'}</label>
                <input
                  type="text"
                  style={INPUT}
                  value={supervisorName}
                  onChange={e => setSupervisorName(e.target.value)}
                  placeholder={mr ? 'निरीक्षक नाव' : 'Supervisor name'}
                />
              </div>
            </div>

            {/* Section: Authority */}
            <SL text={mr ? 'मान्यता तपशील' : 'Authority Details'} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16, marginBottom: 8 }}>
              <div>
                <label style={LABEL}>{mr ? 'ठराव अधिकारी' : 'Sanctioning Authority'} <span className="text-danger">*</span></label>
                <select style={INPUT} value={authorityId} onChange={e => setAuthorityId(e.target.value)}>
                  <option value="">{mr ? '-- निवडा --' : '-- Select --'}</option>
                  {authorities.map(a => (
                    <option key={a.sanctionId} value={a.sanctionId}>{a.sanctionNameLL}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={LABEL}>{mr ? 'ठराव क्रमांक' : 'Resolution No.'} <span className="text-danger">*</span></label>
                <input
                  type="text"
                  style={INPUT}
                  value={manualOrderNo}
                  onChange={e => setManualOrderNo(e.target.value)}
                  placeholder={mr ? 'ठराव क्रमांक' : 'Resolution number'}
                />
              </div>
              <div>
                <label style={LABEL}>{mr ? 'ठरावाचा दिनांक' : 'Resolution Date'} <span className="text-danger">*</span></label>
                <input
                  type="date"
                  style={INPUT}
                  value={sanctionDate}
                  onChange={e => setSanctionDate(e.target.value)}
                />
              </div>
            </div>

            {/* Section: Signing officer */}
            <SL text={mr ? 'सही अधिकारी' : 'Signing Officer'} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 8 }}>
              <div>
                <label style={LABEL}>{mr ? 'सही अधिकारी' : 'Signing Officer'} <span className="text-danger">*</span></label>
                <select style={INPUT} value={signingId} onChange={e => setSigningId(e.target.value)}>
                  <option value="">{mr ? '-- निवडा --' : '-- Select --'}</option>
                  {signingOfficers.map(s => (
                    <option key={s.sanctionId} value={s.sanctionId}>{s.sanctionNameLL}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Section: Stamp + Contractors */}
            <SL text={mr ? 'इतर तपशील' : 'Other Details'} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={LABEL}>{mr ? 'मुद्रांक शुल्क (रु.)' : 'Stamp Duty (₹)'}</label>
                <input
                  type="number"
                  style={INPUT}
                  value={stampAmt}
                  onChange={e => setStampAmt(Number(e.target.value))}
                  min={0}
                />
              </div>
            </div>

            {/* Contractors */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...LABEL, marginBottom: 8 }}>{mr ? 'कंत्राटदार यादी' : 'Contractors'}</label>
              {contractors.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    style={{ ...INPUT, flex: 1 }}
                    value={c}
                    onChange={e => updateContractor(i, e.target.value)}
                    placeholder={`${mr ? 'कंत्राटदार' : 'Contractor'} ${i + 1}`}
                  />
                  <button type="button" className="btn btn-outline-danger btn-sm"
                    onClick={() => removeContractor(i)} title="Remove">
                    <i className="bi bi-x" />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline-primary btn-sm" onClick={addContractor}>
                + {mr ? 'कंत्राटदार जोडा' : 'Add Contractor'}
              </button>
            </div>

            {/* Submit */}
            <div style={{ borderTop: '1px solid #e9ecef', paddingTop: 20 }}>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!formValid || saving}
                onClick={() => setShowConfirm(true)}
              >
                {mr ? 'वर्क ऑर्डर तयार करा' : 'Generate Work Order'}
              </button>
            </div>
          </div>
        )}

        {/* Confirm modal */}
        {showConfirm && validation && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1050,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, maxWidth: 480, width: '92%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
              <h5 style={{ fontWeight: 700, marginBottom: 16 }}>{mr ? 'वर्क ऑर्डर पुष्टी' : 'Confirm Work Order'}</h5>
              <table style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse', marginBottom: 20 }}>
                <tbody>
                  {[
                    [mr ? 'विभाग' : 'Department', validation.deptName],
                    [mr ? 'आर्थिक वर्ष' : 'Financial Year', validation.finYear],
                    [mr ? 'कामाचे नाव' : 'Proposal', validation.proposalName],
                    [mr ? 'रक्कम' : 'Amount', `₹ ${fmtINR(validation.vendorProposedAmount)}`],
                    [mr ? 'नस्ती क्रमांक' : 'Nasti No.', validation.nastiNo],
                    [mr ? 'ठराव क्रमांक' : 'Resolution No.', manualOrderNo],
                  ].map(([k, v]) => (
                    <tr key={String(k)} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '5px 8px', color: '#6c757d', fontWeight: 600, whiteSpace: 'nowrap' }}>{k}</td>
                      <td style={{ padding: '5px 8px', color: '#212529' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline-secondary" onClick={() => setShowConfirm(false)} disabled={saving}>
                  {mr ? 'रद्द करा' : 'Cancel'}
                </button>
                <button className="btn btn-primary" onClick={doSubmit} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-1" />{mr ? 'जतन होत आहे...' : 'Saving...'}</> : (mr ? 'निश्चित करा' : 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {popup && (
          <ErpPopup
            tone={popup.tone}
            title={popup.title}
            onClose={() => setPopup(null)}
          />
        )}
      </main>
    </div>
  )
}
