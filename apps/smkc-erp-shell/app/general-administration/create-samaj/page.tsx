'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'
import { encryptParams } from '@/app/lib/url-crypto'

interface SanctionOfficial { sanctionId: number; sanctionNameLL: string }
interface NastiOrder {
  nastiNo: number; orderId: number; deptCode: number; deptName: string
  proposalName: string; proposalAmount: number
  eligibleVendorName: string; vendorProposedAmount: number
  acSubhead: string; finYear: string
  primaryBookEntryDone: boolean; finalBookEntryDone: boolean
  primaryBookEntryNo: number; finalBookEntryNo: number
}
interface SamajResult {
  success: boolean; workOrderNo: number; samajDisplayNo: string
  finYear: string; deptCode: number; message: string
}

function calcContractorClass(amount: number): string {
  if (amount <= 100000) return '9'
  if (amount <= 500000) return '5'
  if (amount <= 1000000) return '4'
  if (amount <= 2500000) return '3'
  if (amount <= 10000000) return '2'
  return '1'
}
function calcStampAmt(amount: number): number {
  return Math.round(Math.max(100, amount * 0.005) / 10) * 10
}
function fmtINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
}

const INPUT: React.CSSProperties = { width: '100%', border: '1.5px solid #c8d8e8', borderRadius: 8, padding: '9px 12px', fontSize: '0.9rem', color: '#18324a', background: '#fff', outline: 'none', boxSizing: 'border-box' }
const INPUT_RO: React.CSSProperties = { ...INPUT, background: '#f3f7fb', color: '#4a6580' }
const LABEL: React.CSSProperties = { display: 'block', marginBottom: 4, fontSize: '0.82rem', fontWeight: 600, color: '#5e7388', letterSpacing: '0.02em' }

function SL({ text }: { text: string }) {
  return (
    <div style={{ borderLeft: '4px solid #1a6db5', paddingLeft: 12, marginBottom: 16, marginTop: 28 }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a6db5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{text}</span>
    </div>
  )
}

export default function CreateSamajPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { lang, T, tMenu } = useLanguage()
  const mr = lang === 'mr'
  const [searchNo, setSearchNo] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchErr, setSearchErr] = useState('')
  const [searchWarn, setSearchWarn] = useState('')
  const [nastiOrder, setNastiOrder] = useState<NastiOrder | null>(null)
  const [authorities, setAuthorities] = useState<SanctionOfficial[]>([])
  const [signingOfficers, setSigningOfficers] = useState<SanctionOfficial[]>([])
  const [authorityId, setAuthorityId] = useState('')
  const [isManual, setIsManual] = useState(false)
  const [manualOrderNo, setManualOrderNo] = useState('')
  const [sanctionDate, setSanctionDate] = useState('')
  const [sanctionFile, setSanctionFile] = useState('')
  const [vendorName, setVendorName] = useState('')
  const [vendorAmt, setVendorAmt] = useState('')
  const [workPeriod, setWorkPeriod] = useState('')
  const [periodType, setPeriodType] = useState('दिवस')
  const [emd, setEmd] = useState(false)
  const [emdPct, setEmdPct] = useState(1)
  const [deposit, setDeposit] = useState(false)
  const [depositPct, setDepositPct] = useState(5)
  const [supervisorName, setSupervisorName] = useState('')
  const [signingId, setSigningId] = useState('')
  const [stampAmt, setStampAmt] = useState(0)
  const [contractorClass, setContractorClass] = useState('')
  const [saving, setSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [result, setResult] = useState<SamajResult | null>(null)
  const [popup, setPopup] = useState<{ tone: 'success' | 'error'; title: string } | null>(null)

  useEffect(() => {
    fetch('/api/gad/samaj/sanction-authorities').then(r => r.json()).then(d => {
      const arr = d?.data ?? d
      setAuthorities(Array.isArray(arr) ? arr : (arr?.$values ?? []))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!nastiOrder) return
    fetch(`/api/gad/samaj/signing-officers?deptCode=${nastiOrder.deptCode}`)
      .then(r => r.json()).then(d => {
        const arr = d?.data ?? d
        setSigningOfficers(Array.isArray(arr) ? arr : (arr?.$values ?? []))
      }).catch(() => {})
  }, [nastiOrder])

  useEffect(() => {
    const n = parseFloat(vendorAmt)
    if (!isNaN(n) && n > 0) { setStampAmt(calcStampAmt(n)); setContractorClass(calcContractorClass(n)) }
    else { setStampAmt(0); setContractorClass('') }
  }, [vendorAmt])

  useEffect(() => {
    const id = parseInt(authorityId)
    setIsManual(id === 9 || id === 10)
  }, [authorityId])

  const _baseAmt = nastiOrder?.proposalAmount || 0
  const emdAmt = emd ? Math.round(_baseAmt * emdPct / 100) : 0
  const depositAmt = deposit ? Math.round(_baseAmt * depositPct / 100) : 0

  async function doSearch() {
    const trimmed = searchNo.trim()
    if (!trimmed || isNaN(parseInt(trimmed))) { setSearchErr('नस्ती क्रमांक ठाका.'); return }
    setSearching(true); setSearchErr(''); setSearchWarn(''); setNastiOrder(null)
    setVendorName(''); setVendorAmt(''); setSigningOfficers([])
    try {
      const r = await fetch(`/api/gad/samaj/validate-nasti?nastiNo=${encodeURIComponent(trimmed)}`)
      const json = await r.json()
      if (r.status === 404 || json.notFound) { setSearchErr('नस्ती क्रमांक आढळला नाही.'); return }
      if (!r.ok) { setSearchErr(json.message || 'सर्व्हरशी संपर्क होउ शकला नाही.'); return }
      const order: NastiOrder = json.data
      setNastiOrder(order)
      setVendorName(order.eligibleVendorName ?? '')
      setVendorAmt(order.vendorProposedAmount > 0 ? String(order.vendorProposedAmount) : '')
    } catch { setSearchErr('सर्व्हरशी संपर्क होउ शकला नाही.') } finally { setSearching(false) }
  }

  function validate(): string | null {
    if (!nastiOrder) return 'प्रथम नस्ती क्रमांक शोधा.'
    if (!authorityId) return 'मान्यता अधिकारी निवडा.'
    if (!manualOrderNo.trim()) return 'ठराव क्रमांक ठाका.'
    if (!sanctionDate) return 'ठरावाचा दिनांक ठाका.'
    if (!vendorName.trim()) return 'कंत्राटदाराचे नाव ठाका.'
    if (!vendorAmt || parseFloat(vendorAmt) <= 0) return 'मंजूर रक्कम ठाका.'
    if (!workPeriod.trim() || isNaN(parseInt(workPeriod))) return 'कामाचा कालावधी ठाका.'
    if (!supervisorName.trim()) return 'पर्यवेक्षक अधिकारीन्चे नाव ठाका.'
    return null
  }

  async function doGenerate() {
    if (!nastiOrder) return
    setSaving(true); setShowConfirm(false)
    try {
      const body = {
        nastiNo: String(nastiOrder.nastiNo),
        deptCode: nastiOrder.deptCode,
        finYear: nastiOrder.finYear,
        proposalName: nastiOrder.proposalName,
        proposalAmount: nastiOrder.proposalAmount,
        authorityOfficials: parseInt(authorityId),
        isManualOrder: isManual,
        manualFinalOrderNo: isManual ? manualOrderNo : null,
        sanctionDate: isManual ? sanctionDate : null,
        sanctionFile: isManual ? sanctionFile : null,
        eligibleVendorName: vendorName,
        vendorProposedAmount: parseFloat(vendorAmt),
        contractorClass,
        stampAmt,
        workPeriod,
        periodType,
        emdFlag: emd ? 'y' : 'n',
        depositFlag: deposit ? 'y' : 'n',
        supervisorName,
        signingAuth: signingId ? parseInt(signingId) : 0,
        enteredBy: 'ERP',
      }
      const r = await fetch('/api/gad/samaj/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await r.json()
      if (!r.ok || !json.success) { setPopup({ tone: 'error', title: json.message || 'समज तयार होउ शकला नाही.' }); return }
      setResult(json)
      setPopup({ tone: 'success', title: 'समज क्र. PLACEHOLDER यशस्वीपणे तयार झाला!'.replace('PLACEHOLDER', json.samajDisplayNo) })
    } catch { setPopup({ tone: 'error', title: 'सर्व्हरशी संपर्क होउ शकला नाही.' }) } finally { setSaving(false) }
  }

  async function handlePrint() {
    if (!result) return
    const token = await encryptParams({ workOrderNo: result.workOrderNo, deptCode: result.deptCode, finYear: result.finYear })
    window.open(`/general-administration/create-samaj/print?token=${token}`, '_blank')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f9', fontFamily: "'Segoe UI', 'Noto Sans Devanagari', 'Nirmala UI', sans-serif" }}>
      <DeptSidebar deptKey="general-administration" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      {popup && <ErpPopup tone={popup.tone} title={popup.title} onClose={() => setPopup(null)} />}
      <main style={{ flex: 1, padding: '28px 24px', minWidth: 0 }}>
        {/* Breadcrumb */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <Link href="/general-administration/dashboard" className="dash-breadcrumb-home">{T.depts['general-administration']?.label ?? 'General Administration'}</Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="dash-breadcrumb-current">{tMenu('general-administration', 'create-samaj', 'Create Samaj')}</span>
        </nav>
        <h4 style={{ color: '#1a3a5c', fontWeight: 700, marginBottom: 4 }}>
          {mr ? 'समज तयार करा' : 'Create Samaj'}
        </h4>
        <p style={{ color: '#5e7388', fontSize: '0.9rem', marginBottom: 28 }}>
          {mr ? 'कामाचे कार्यादेश (समज) तयार करा' : 'Generate Work Order (Samaj)'}
        </p>

        {result ? (
          <div style={{ background: '#e8f5e9', border: '1.5px solid #4caf50', borderRadius: 12, padding: '24px 28px', maxWidth: 540 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b5e20', marginBottom: 8 }}>
              {mr ? 'समज तयार झाला!' : 'Samaj Created!'}
            </div>
            <div style={{ color: '#2e7d32', marginBottom: 16 }}>
              {mr ? 'समज क्रमांक' : 'Samaj Number'}: <strong>{result.samajDisplayNo}</strong>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                <i className="bi bi-printer me-1" />{mr ? 'मुद्रित करा' : 'Print'}
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setResult(null); setNastiOrder(null); setSearchNo(''); setSearchWarn(''); setSearchErr('') }}>
                {mr ? 'नवीन समज' : 'New Samaj'}
              </button>
            </div>
          </div>
        ) : (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px #1a6db510', padding: '28px 32px', maxWidth: 820 }}>
          <SL text={mr ? 'नस्ती क्रमांक शोधा' : 'Search by Nasti Number'} />
          <div className="d-flex gap-2 align-items-end mb-3">
            <div style={{ flex: 1 }}>
              <label style={LABEL}>{mr ? 'नस्ती क्रमांक' : 'Nasti No'}</label>
              <input style={INPUT} value={searchNo} onChange={e => setSearchNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="उदा. 700744" />
            </div>
            <button className="btn btn-primary" style={{ marginBottom: 1 }} onClick={doSearch} disabled={searching}>
              {searching
                ? <><span className="spinner-border spinner-border-sm me-1" />{mr ? 'शोधत...' : 'Searching...'}</>
                : <><i className="bi bi-search me-1" />{mr ? 'शोधा' : 'Search'}</>}
            </button>
          </div>
          {searchErr && <div className="alert alert-danger py-2 mb-3">{searchErr}</div>}
          {searchWarn && (
            <div className="alert alert-warning py-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill me-2" />{searchWarn}
            </div>
          )}
          {nastiOrder && (
            <div className="p-3 mb-3" style={{ background: '#f0f7ff', borderRadius: 8, border: '1px solid #bee3f8', fontSize: '0.88rem', color: '#1a3a5c' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
                <span><strong>{mr ? 'विभाग' : 'Dept'}:</strong> {nastiOrder.deptName}</span>
                <span style={{ color: '#bee3f8' }}>|</span>
                <span><strong>{mr ? 'आर.वर्ष' : 'FY'}:</strong> {nastiOrder.finYear}</span>
                <span style={{ color: '#bee3f8' }}>|</span>
                <span><strong>{mr ? 'प्रस्तावित रक्कम' : 'Proposed Amount'}:</strong> ₹{fmtINR(nastiOrder.proposalAmount)}</span>
              </div>
              <div style={{ marginBottom: 8 }}><strong>{mr ? 'काम' : 'Work'}:</strong> {nastiOrder.proposalName}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700,
                  background: nastiOrder.primaryBookEntryDone ? '#d4edda' : '#fff3cd',
                  color: nastiOrder.primaryBookEntryDone ? '#155724' : '#856404',
                  border: `1px solid ${nastiOrder.primaryBookEntryDone ? '#c3e6cb' : '#ffeeba'}` }}>
                  <i className={`bi ${nastiOrder.primaryBookEntryDone ? 'bi-check-circle-fill' : 'bi-clock'} me-1`} />
                  {mr ? 'प्राथमिक बजेट नोंद' : 'Primary Book Entry'}: {nastiOrder.primaryBookEntryDone ? (mr ? 'झाली' : 'Done') : (mr ? 'प्रलंबित' : 'Pending')}
                </span>
                <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 700,
                  background: nastiOrder.finalBookEntryDone ? '#d4edda' : '#fff3cd',
                  color: nastiOrder.finalBookEntryDone ? '#155724' : '#856404',
                  border: `1px solid ${nastiOrder.finalBookEntryDone ? '#c3e6cb' : '#ffeeba'}` }}>
                  <i className={`bi ${nastiOrder.finalBookEntryDone ? 'bi-check-circle-fill' : 'bi-clock'} me-1`} />
                  {mr ? 'अंतिम बजेट नोंद' : 'Final Book Entry'}: {nastiOrder.finalBookEntryDone ? (mr ? 'झाली' : 'Done') : (mr ? 'प्रलंबित' : 'Pending')}
                </span>
              </div>
              {!nastiOrder.finalBookEntryDone && (
                <div className="alert alert-danger py-2 mt-2 mb-0" style={{ fontSize: '0.82rem' }}>
                  <i className="bi bi-x-circle-fill me-1" />
                  {mr ? 'अंतिम बजेट नोंद झाल्याशिवाय समज तयार करता येणार नाही.' : 'Samaj cannot be created until final budget book entry is done.'}
                </div>
              )}
            </div>
          )}

          <SL text={mr ? 'मान्यता अधिकारी' : 'Approving Authority'} />
          <div className="row g-3 mb-2">
            <div className="col-md-6">
              <label style={LABEL}>{mr ? 'मान्यता अधिकारी' : 'Authority'} *</label>
              <select style={INPUT} value={authorityId} onChange={e => setAuthorityId(e.target.value)}>
                <option value="">{mr ? '-- निवडा --' : '-- Select --'}</option>
                {authorities.map(a => <option key={a.sanctionId} value={String(a.sanctionId)}>{a.sanctionNameLL}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label style={LABEL}>{mr ? 'ठराव क्रमांक' : 'Resolution No'} *</label>
              <input style={INPUT} value={manualOrderNo} onChange={e => setManualOrderNo(e.target.value)} placeholder={mr ? 'ठराव / आदेश क्रमांक...' : 'Resolution number...'} />
            </div>
            <div className="col-md-6">
              <label style={LABEL}>{mr ? 'ठरावाचा दिनांक' : 'Resolution Date'} *</label>
              <input type="date" style={INPUT} value={sanctionDate} onChange={e => setSanctionDate(e.target.value)} />
            </div>
            <div className="col-md-6">
              <label style={LABEL}>{mr ? 'ठराव फाईल क्रमांक' : 'File Reference'}</label>
              <input style={INPUT} value={sanctionFile} onChange={e => setSanctionFile(e.target.value)} placeholder="File reference (optional)" />
            </div>
          </div>

          <SL text={mr ? 'कंत्राटदार व कामाचा तपशील' : 'Vendor & Work Details'} />
          <div className="row g-3 mb-2">
            <div className="col-md-8">
              <label style={LABEL}>{mr ? 'कंत्राटदाराचे नाव' : 'Vendor Name'} *</label>
              <input style={INPUT} value={vendorName} onChange={e => setVendorName(e.target.value)}
                placeholder={mr ? 'कंत्राटदाराचे नाव...' : 'Vendor name...'} />
            </div>
            <div className="col-md-4">
              <label style={LABEL}>{mr ? 'मंजूर रक्कम (₹)' : 'Approved Amount (₹)'} *</label>
              <input type="number" style={INPUT} value={vendorAmt} onChange={e => setVendorAmt(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label style={LABEL}>{mr ? 'कंत्राटदार वर्ग' : 'Contractor Class'}</label>
              <input style={INPUT_RO} value={contractorClass} readOnly placeholder={mr ? 'रक्कम टाकल्यावर भरेल' : 'Auto-filled'} />
            </div>
            <div className="col-md-4">
              <label style={LABEL}>{mr ? 'स्टॅंप पेपर रक्कम (₹)' : 'Stamp Amount (₹)'}</label>
              <input style={INPUT_RO} value={stampAmt || ''} readOnly />
            </div>
            <div className="col-md-2">
              <label style={LABEL}>{mr ? 'कालावधी' : 'Period'} *</label>
              <input type="number" style={INPUT} value={workPeriod} onChange={e => setWorkPeriod(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label style={LABEL}>{mr ? 'एकक' : 'Unit'}</label>
              <select style={INPUT} value={periodType} onChange={e => setPeriodType(e.target.value)}>
                <option value="दिवस">दिवस</option>
                <option value="महिने">महिने</option>
              </select>
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label style={LABEL}>{mr ? 'पर्यवेक्षक अधिकारी' : 'Supervisor'} *</label>
              <input style={INPUT} value={supervisorName} onChange={e => setSupervisorName(e.target.value)}
                placeholder={mr ? 'अधिकारीन्चे नाव...' : 'Officer name...'} />
            </div>
            <div className="col-md-6">
              <label style={LABEL}>{mr ? 'सही करणारे अधिकारी' : 'Signing Officer'}</label>
              <select style={INPUT} value={signingId} onChange={e => setSigningId(e.target.value)}>
                <option value="">{mr ? '-- निवडा --' : '-- Select --'}</option>
                {signingOfficers.map(o => <option key={o.sanctionId} value={String(o.sanctionId)}>{o.sanctionNameLL}</option>)}
              </select>
            </div>
            <div className="col-12">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', background: emd ? '#f0f7ff' : '#fafbfc', borderRadius: 8, border: '1.5px solid #c8d8e8', marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 180, margin: 0, userSelect: 'none' }}>
                  <input type="checkbox" checked={emd} onChange={e => setEmd(e.target.checked)} />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a3a5c', marginLeft: 4 }}>{mr ? 'EMD (बयाना)' : 'EMD (Earnest Money)'}</span>
                </label>
                {emd && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="number" style={{ width: 72, border: '1.5px solid #c8d8e8', borderRadius: 8, padding: '6px 10px', fontSize: '0.88rem', color: '#18324a', background: '#fff', outline: 'none' }}
                        value={emdPct} min={0} max={100} step={0.5} onChange={e => setEmdPct(parseFloat(e.target.value) || 0)} />
                      <span style={{ color: '#5e7388', fontWeight: 600, fontSize: '0.88rem' }}>%</span>
                    </div>
                    <span style={{ color: '#aab', fontSize: '1rem' }}>→</span>
                    <span style={{ fontWeight: 700, color: '#1a6db5', fontSize: '0.92rem' }}>₹{fmtINR(emdAmt)}</span>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '10px 14px', background: deposit ? '#f0f7ff' : '#fafbfc', borderRadius: 8, border: '1.5px solid #c8d8e8' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 180, margin: 0, userSelect: 'none' }}>
                  <input type="checkbox" checked={deposit} onChange={e => setDeposit(e.target.checked)} />
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a3a5c', marginLeft: 4 }}>{mr ? 'अनामत रक्कम' : 'Security Deposit'}</span>
                </label>
                {deposit && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input type="number" style={{ width: 72, border: '1.5px solid #c8d8e8', borderRadius: 8, padding: '6px 10px', fontSize: '0.88rem', color: '#18324a', background: '#fff', outline: 'none' }}
                        value={depositPct} min={0} max={100} step={0.5} onChange={e => setDepositPct(parseFloat(e.target.value) || 0)} />
                      <span style={{ color: '#5e7388', fontWeight: 600, fontSize: '0.88rem' }}>%</span>
                    </div>
                    <span style={{ color: '#aab', fontSize: '1rem' }}>→</span>
                    <span style={{ fontWeight: 700, color: '#1a6db5', fontSize: '0.92rem' }}>₹{fmtINR(depositAmt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button className="btn btn-primary px-4" disabled={saving || !!result || (!!nastiOrder && !nastiOrder.finalBookEntryDone)}
              onClick={() => { const e = validate(); if (e) { setPopup({ tone: 'error', title: e }); return }; setShowConfirm(true) }}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-1" />{mr ? 'तयार होत आहे...' : 'Saving...'}</>
                : (mr ? 'समज तयार करा' : 'Create Samaj')}
            </button>
          </div>
        </div>
        )}

        {showConfirm && nastiOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '32px 36px', maxWidth: 460, width: '90%', boxShadow: '0 8px 40px #0004' }}>
              <div style={{ color: '#1a6db5', fontWeight: 700, fontSize: '0.73rem', letterSpacing: '0.1em', marginBottom: 8 }}>
                {mr ? 'पुष्टी करा' : 'CONFIRM'}
              </div>
              <h5 style={{ fontWeight: 700, color: '#1a3a5c', marginBottom: 16 }}>
                {mr ? 'समज तयार करायचा आहे?' : 'Create this Samaj?'}
              </h5>
              <div style={{ fontSize: '0.88rem', color: '#5e7388', marginBottom: 20 }}>
                <div><strong>{mr ? 'काम:' : 'Work:'}</strong> {nastiOrder.proposalName}</div>
                <div><strong>{mr ? 'विभाग:' : 'Dept:'}</strong> {nastiOrder.deptName}</div>
                <div><strong>{mr ? 'मंजूर रक्कम:' : 'Amount:'}</strong> ₹{fmtINR(parseFloat(vendorAmt))}</div>
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-outline-secondary" onClick={() => setShowConfirm(false)}>
                  {mr ? 'रद्द करा' : 'Cancel'}
                </button>
                <button className="btn btn-primary" onClick={doGenerate}>
                  {mr ? 'होय, तयार करा' : 'Yes, Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
