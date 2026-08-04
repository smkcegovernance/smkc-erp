// Script to write page.tsx with proper Unicode escapes for Devanagari
// Run: node write-page.mjs
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, 'page.tsx')

// Devanagari strings as unicode escapes
const U = {
  // Labels & headings
  samajTayarKara:    '\u0938\u092e\u091c \u0924\u092f\u093e\u0930 \u0915\u0930\u093e',
  workOrderGen:      '\u0915\u093e\u092e\u093e\u091a\u0947 \u0915\u093e\u0930\u094d\u092f\u093e\u0926\u0947\u0936 (\u0938\u092e\u091c) \u0924\u092f\u093e\u0930 \u0915\u0930\u093e',
  nastiSearch:       '\u0928\u0938\u094d\u0924\u0940 \u0915\u094d\u0930\u092e\u093e\u0902\u0915 \u0936\u094b\u0927\u093e',
  nastiNo:           '\u0928\u0938\u094d\u0924\u0940 \u0915\u094d\u0930\u092e\u093e\u0902\u0915',
  nastiNoPlaceholder:'\u0909\u0926\u093e. 700744',
  shhodha:           '\u0936\u094b\u0927\u093e',
  shodhat:           '\u0936\u094b\u0927\u0924...',
  nastiBheta:        '\u0928\u0938\u094d\u0924\u0940 \u0915\u094d\u0930\u092e\u093e\u0902\u0915 \u0920\u093e\u0915\u093e.',
  nastiAadhaLaNahi:  '\u0928\u0938\u094d\u0924\u0940 \u0915\u094d\u0930\u092e\u093e\u0902\u0915 \u0906\u0922\u0933\u0932\u093e \u0928\u093e\u0939\u0940.',
  naLekhaMat:        '\u0932\u0947\u0916\u093e \u0936\u093e\u0916\u0947\u091a\u0947 \u092a\u094d\u0930\u093e\u0925\u092e\u093f\u0915 \u092e\u0924 \u091d\u093e\u0932\u0947\u0932\u0947 \u0928\u093e\u0939\u0940\u0964 \u0938\u092e\u091c \u0924\u092f\u093e\u0930 \u0915\u0930\u0924\u093e \u092f\u0947\u0923\u093e\u0930 \u0928\u093e\u0939\u0940.',
  anantimMatNahi:    '\u0905\u0902\u0924\u093f\u092e \u0932\u0947\u0916\u093e \u092e\u0924 \u0905\u091c\u0942\u0928 \u0906\u0932\u0947\u0932\u0947 \u0928\u093e\u0939\u0940 \u2014 \u0935\u093f\u0915\u094d\u0930\u0947\u0924\u093e \u0928\u093e\u0935 \u0935 \u0930\u0915\u094d\u0915\u092e \u0938\u094d\u0935\u0924\u0903 \u0920\u093e\u0915\u093e.',
  dept:              '\u0935\u093f\u092d\u093e\u0917',
  fy:                '\u0906\u0930.\u0935\u0930\u094d\u0937',
  work:              '\u0915\u093e\u092e',
  // Authority section
  manyataAdhikari:   '\u092e\u093e\u0928\u094d\u092f\u0924\u093e \u0905\u0927\u093f\u0915\u093e\u0930\u0940',
  authority:         '\u092e\u093e\u0928\u094d\u092f\u0924\u093e \u0905\u0927\u093f\u0915\u093e\u0930\u0940',
  niavada:           '-- \u0928\u093f\u0935\u0921\u093e --',
  tharavNo:          '\u0920\u0930\u093e\u0935 / \u0905\u0927\u093f\u0915\u093e\u0930 \u0915\u094d\u0930\u092e\u093e\u0902\u0915',
  manjuriDinank:     '\u092e\u0902\u091c\u0941\u0930\u0940 \u0926\u093f\u0928\u093e\u0902\u0915',
  tharavFile:        '\u0920\u0930\u093e\u0935 \u092b\u093e\u0908\u0932 \u0915\u094d\u0930\u092e\u093e\u0902\u0915',
  // Vendor section
  contractorVTapshil:'\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930 \u0935 \u0915\u093e\u092e\u093e\u091a\u093e \u0924\u092a\u0936\u0940\u0932',
  contractorName:    '\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930\u093e\u091a\u0947 \u0928\u093e\u0935',
  contractorNameP:   '\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930\u093e\u091a\u0947 \u0928\u093e\u0935...',
  approvedAmt:       '\u092e\u0902\u091c\u0942\u0930 \u0930\u0915\u094d\u0915\u092e (\u20b9)',
  contractorClass:   '\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930 \u0935\u0930\u094d\u0917',
  autoFilled:        '\u0930\u0915\u094d\u0915\u092e \u091f\u093e\u0915\u0932\u094d\u092f\u093e\u0935\u0930 \u092d\u0930\u0947\u0932',
  stampAmt:          '\u0938\u094d\u091f\u0945\u0902\u092a \u092a\u0947\u092a\u0930 \u0930\u0915\u094d\u0915\u092e (\u20b9)',
  period:            '\u0915\u093e\u0932\u093e\u0935\u0927\u0940',
  unit:              '\u090f\u0915\u0915',
  divsas:            '\u0926\u093f\u0935\u0938',
  mahine:            '\u092e\u0939\u093f\u0928\u0947',
  supervisor:        '\u092a\u0930\u094d\u092f\u0935\u0947\u0915\u094d\u0937\u0915 \u0905\u0927\u093f\u0915\u093e\u0930\u0940',
  supervisorP:       '\u0905\u0927\u093f\u0915\u093e\u0930\u0940\u0928\u094d\u091a\u0947 \u0928\u093e\u0935...',
  sahiAdhikari:      '\u0938\u0939\u0940 \u0915\u0930\u0923\u093e\u0930\u0947 \u0905\u0927\u093f\u0915\u093e\u0930\u0940',
  emd:               'EMD (\u092c\u092f\u093e\u0928\u093e)',
  deposit:           '\u0905\u0928\u093e\u092e\u0924 \u0930\u0915\u094d\u0915\u092e',
  // Contractors
  contractorsList:   '\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930\u093e\u0902\u091a\u0940 \u092f\u093e\u0926\u0940',
  contractorN:       '\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930',
  contractorName2:   '\u091a\u0947 \u0928\u093e\u0935...',
  addContractor:     '\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930 \u091c\u094b\u0921\u093e',
  // Buttons & confirm
  samajTayarKaraBtn: '\u0938\u092e\u091c \u0924\u092f\u093e\u0930 \u0915\u0930\u093e',
  tayarHotAhe:       '\u0924\u092f\u093e\u0930 \u0939\u094b\u0924 \u0906\u0939\u0947...',
  pushtiKara:        '\u092a\u0941\u0937\u094d\u091f\u0940 \u0915\u0930\u093e',
  confirmSamaj:      '\u0938\u092e\u091c \u0924\u092f\u093e\u0930 \u0915\u0930\u093e\u092f\u091a\u093e \u0906\u0939\u0947?',
  kaam:              '\u0915\u093e\u092e:',
  vibhag:            '\u0935\u093f\u092d\u093e\u0917:',
  rakkam:            '\u092e\u0902\u091c\u0942\u0930 \u0930\u0915\u094d\u0915\u092e:',
  raddKara:          '\u0930\u0926\u094d\u0926 \u0915\u0930\u093e',
  hoyTayarKara:      '\u0939\u094b\u092f, \u0924\u092f\u093e\u0930 \u0915\u0930\u093e',
  // Result
  samajTayarZala:    '\u0938\u092e\u091c \u0924\u092f\u093e\u0930 \u091d\u093e\u0932\u093e!',
  samajKramank:      '\u0938\u092e\u091c \u0915\u094d\u0930\u092e\u093e\u0902\u0915',
  mudritKara:        '\u092e\u0941\u0926\u094d\u0930\u093f\u0924 \u0915\u0930\u093e',
  navaSamaj:         '\u0928\u0935\u0940\u0928 \u0938\u092e\u091c',
  // Validate errors
  prathamSearch:     '\u092a\u094d\u0930\u0925\u092e \u0928\u0938\u094d\u0924\u0940 \u0915\u094d\u0930\u092e\u093e\u0902\u0915 \u0936\u094b\u0927\u093e.',
  manyataAdd:        '\u092e\u093e\u0928\u094d\u092f\u0924\u093e \u0905\u0927\u093f\u0915\u093e\u0930\u0940 \u0928\u093f\u0935\u0921\u093e.',
  tharavAdd:         '\u0920\u0930\u093e\u0935 / \u0905\u0927\u093f\u0915\u093e\u0930 \u0915\u094d\u0930\u092e\u093e\u0902\u0915 \u0920\u093e\u0915\u093e.',
  manjuriDinankAdd:  '\u092e\u0902\u091c\u0941\u0930\u0940 \u0926\u093f\u0928\u093e\u0902\u0915 \u0920\u093e\u0915\u093e.',
  vendorAdd:         '\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930\u093e\u091a\u0947 \u0928\u093e\u0935 \u0920\u093e\u0915\u093e.',
  rakkamAdd:         '\u092e\u0902\u091c\u0942\u0930 \u0930\u0915\u094d\u0915\u092e \u0920\u093e\u0915\u093e.',
  periodAdd:         '\u0915\u093e\u092e\u093e\u091a\u093e \u0915\u093e\u0932\u093e\u0935\u0927\u0940 \u0920\u093e\u0915\u093e.',
  supervisorAdd:     '\u092a\u0930\u094d\u092f\u0935\u0947\u0915\u094d\u0937\u0915 \u0905\u0927\u093f\u0915\u093e\u0930\u0940\u0928\u094d\u091a\u0947 \u0928\u093e\u0935 \u0920\u093e\u0915\u093e.',
  contractorAdd:     '\u0915\u093f\u092e\u093e\u0928 \u090f\u0915 \u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930 \u0920\u093e\u0915\u093e.',
  serverError:       '\u0938\u0930\u094d\u0935\u094d\u0939\u0930\u0936\u0940 \u0938\u0902\u092a\u0930\u094d\u0915 \u0939\u094b\u0909 \u0936\u0915\u0932\u093e \u0928\u093e\u0939\u0940.',
  samajError:        '\u0938\u092e\u091c \u0924\u092f\u093e\u0930 \u0939\u094b\u0909 \u0936\u0915\u0932\u093e \u0928\u093e\u0939\u0940.',
  samajSuccess:      '\u0938\u092e\u091c \u0915\u094d\u0930. PLACEHOLDER \u092f\u0936\u0938\u094d\u0935\u0940\u092a\u0923\u0947 \u0924\u092f\u093e\u0930 \u091d\u093e\u0932\u093e!',
  // Nav
  home:              '\u092e\u0941\u0916\u092a\u0943\u0937\u094d\u0920',
  gaAdmin:           '\u0938\u093e\u0927\u093e\u0930\u0923 \u092a\u094d\u0930\u0936\u093e\u0938\u0928',
}

const content = `'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'
import ErpPopup from '@/app/components/ErpPopup'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

interface SanctionOfficial { sanctionId: number; sanctionNameLL: string }
interface NastiOrder {
  nastiNo: number; orderId: number; deptCode: number; deptName: string
  proposalName: string; proposalAmount: number
  eligibleVendorName: string; vendorProposedAmount: number
  acSubhead: string; finYear: string
  hasPrimaryRemark: boolean; hasFinalRemark: boolean
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
  const [periodType, setPeriodType] = useState('${U.divsas}')
  const [emd, setEmd] = useState(false)
  const [deposit, setDeposit] = useState(false)
  const [supervisorName, setSupervisorName] = useState('')
  const [signingId, setSigningId] = useState('')
  const [stampAmt, setStampAmt] = useState(0)
  const [contractorClass, setContractorClass] = useState('')
  const [contractors, setContractors] = useState<string[]>([''])
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
    fetch(\`/api/gad/samaj/signing-officers?deptCode=\${nastiOrder.deptCode}\`)
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

  async function doSearch() {
    const trimmed = searchNo.trim()
    if (!trimmed || isNaN(parseInt(trimmed))) { setSearchErr('${U.nastiBheta}'); return }
    setSearching(true); setSearchErr(''); setSearchWarn(''); setNastiOrder(null)
    setVendorName(''); setVendorAmt(''); setSigningOfficers([])
    try {
      const r = await fetch(\`/api/gad/samaj/validate-nasti?nastiNo=\${encodeURIComponent(trimmed)}\`)
      const json = await r.json()
      if (r.status === 404 || json.notFound) { setSearchErr('${U.nastiAadhaLaNahi}'); return }
      if (!r.ok) { setSearchErr(json.message || '${U.serverError}'); return }
      const order: NastiOrder = json.data
      if (json.noPrimaryRemark) {
        setSearchErr('${U.naLekhaMat}')
        return
      }
      setNastiOrder(order)
      if (order.hasFinalRemark) {
        setVendorName(order.eligibleVendorName)
        setVendorAmt(order.vendorProposedAmount > 0 ? String(order.vendorProposedAmount) : '')
        setSearchWarn('')
      } else {
        setSearchWarn('${U.anantimMatNahi}')
        setVendorName('')
        setVendorAmt('')
      }
    } catch { setSearchErr('${U.serverError}') } finally { setSearching(false) }
  }

  function validate(): string | null {
    if (!nastiOrder) return '${U.prathamSearch}'
    if (!authorityId) return '${U.manyataAdd}'
    if (isManual && !manualOrderNo.trim()) return '${U.tharavAdd}'
    if (isManual && !sanctionDate) return '${U.manjuriDinankAdd}'
    if (!vendorName.trim()) return '${U.vendorAdd}'
    if (!vendorAmt || parseFloat(vendorAmt) <= 0) return '${U.rakkamAdd}'
    if (!workPeriod.trim() || isNaN(parseInt(workPeriod))) return '${U.periodAdd}'
    if (!supervisorName.trim()) return '${U.supervisorAdd}'
    if (contractors.every(c => !c.trim())) return '${U.contractorAdd}'
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
        contractors: contractors.filter(c => c.trim()),
        enteredBy: 'ERP',
      }
      const r = await fetch('/api/gad/samaj/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await r.json()
      if (!r.ok || !json.success) { setPopup({ tone: 'error', title: json.message || '${U.samajError}' }); return }
      setResult(json)
      setPopup({ tone: 'success', title: '${U.samajSuccess}'.replace('PLACEHOLDER', json.samajDisplayNo) })
    } catch { setPopup({ tone: 'error', title: '${U.serverError}' }) } finally { setSaving(false) }
  }

  function setCV(i: number, v: string) { setContractors(prev => prev.map((c, idx) => idx === i ? v : c)) }
  function addCV() { setContractors(prev => [...prev, '']) }
  function removeCV(i: number) { setContractors(prev => prev.length <= 1 ? [''] : prev.filter((_, idx) => idx !== i)) }
  function handlePrint() {
    if (!result) return
    window.open(\`/general-administration/create-samaj/print?workOrderNo=\${result.workOrderNo}&deptCode=\${result.deptCode}&finYear=\${encodeURIComponent(result.finYear)}\`, '_blank')
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
          <span className="dash-breadcrumb-sep" aria-hidden="true">\u203a</span>
          <Link href="/general-administration/dashboard" className="dash-breadcrumb-home">{T.depts['general-administration']?.label ?? 'General Administration'}</Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">\u203a</span>
          <span className="dash-breadcrumb-current">{tMenu('general-administration', 'create-samaj', 'Create Samaj')}</span>
        </nav>
        <h4 style={{ color: '#1a3a5c', fontWeight: 700, marginBottom: 4 }}>
          {mr ? '${U.samajTayarKara}' : 'Create Samaj'}
        </h4>
        <p style={{ color: '#5e7388', fontSize: '0.9rem', marginBottom: 28 }}>
          {mr ? '${U.workOrderGen}' : 'Generate Work Order (Samaj)'}
        </p>

        {result ? (
          <div style={{ background: '#e8f5e9', border: '1.5px solid #4caf50', borderRadius: 12, padding: '24px 28px', maxWidth: 540 }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1b5e20', marginBottom: 8 }}>
              {mr ? '${U.samajTayarZala}' : 'Samaj Created!'}
            </div>
            <div style={{ color: '#2e7d32', marginBottom: 16 }}>
              {mr ? '${U.samajKramank}' : 'Samaj Number'}: <strong>{result.samajDisplayNo}</strong>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-primary btn-sm" onClick={handlePrint}>
                <i className="bi bi-printer me-1" />{mr ? '${U.mudritKara}' : 'Print'}
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => { setResult(null); setNastiOrder(null); setSearchNo(''); setSearchWarn(''); setSearchErr('') }}>
                {mr ? '${U.navaSamaj}' : 'New Samaj'}
              </button>
            </div>
          </div>
        ) : (
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 16px #1a6db510', padding: '28px 32px', maxWidth: 820 }}>
          <SL text={mr ? '${U.nastiSearch}' : 'Search by Nasti Number'} />
          <div className="d-flex gap-2 align-items-end mb-3">
            <div style={{ flex: 1 }}>
              <label style={LABEL}>{mr ? '${U.nastiNo}' : 'Nasti No'}</label>
              <input style={INPUT} value={searchNo} onChange={e => setSearchNo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="${U.nastiNoPlaceholder}" />
            </div>
            <button className="btn btn-primary" style={{ marginBottom: 1 }} onClick={doSearch} disabled={searching}>
              {searching
                ? <><span className="spinner-border spinner-border-sm me-1" />{mr ? '${U.shodhat}' : 'Searching...'}</>
                : <><i className="bi bi-search me-1" />{mr ? '${U.shhodha}' : 'Search'}</>}
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
              <strong>{mr ? '${U.dept}' : 'Dept'}: </strong>{nastiOrder.deptName} &nbsp;|&nbsp;
              <strong>{mr ? '${U.fy}' : 'FY'}: </strong>{nastiOrder.finYear} &nbsp;|&nbsp;
              <strong>{mr ? '${U.work}' : 'Work'}: </strong>{nastiOrder.proposalName}
            </div>
          )}

          <SL text={mr ? '${U.manyataAdhikari}' : 'Approving Authority'} />
          <div className="row g-3 mb-2">
            <div className="col-md-6">
              <label style={LABEL}>{mr ? '${U.authority}' : 'Authority'} *</label>
              <select style={INPUT} value={authorityId} onChange={e => setAuthorityId(e.target.value)}>
                <option value="">{mr ? '${U.niavada}' : '-- Select --'}</option>
                {authorities.map(a => <option key={a.sanctionId} value={String(a.sanctionId)}>{a.sanctionNameLL}</option>)}
              </select>
            </div>
            {isManual && (
              <>
                <div className="col-md-6">
                  <label style={LABEL}>{mr ? '${U.tharavNo}' : 'Resolution No'}</label>
                  <input style={INPUT} value={manualOrderNo} onChange={e => setManualOrderNo(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label style={LABEL}>{mr ? '${U.manjuriDinank}' : 'Sanction Date'}</label>
                  <input type="date" style={INPUT} value={sanctionDate} onChange={e => setSanctionDate(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label style={LABEL}>{mr ? '${U.tharavFile}' : 'File Reference'}</label>
                  <input style={INPUT} value={sanctionFile} onChange={e => setSanctionFile(e.target.value)} placeholder="File reference (optional)" />
                </div>
              </>
            )}
          </div>

          <SL text={mr ? '${U.contractorVTapshil}' : 'Vendor & Work Details'} />
          <div className="row g-3 mb-2">
            <div className="col-md-8">
              <label style={LABEL}>{mr ? '${U.contractorName}' : 'Vendor Name'} *</label>
              <input style={INPUT} value={vendorName} onChange={e => setVendorName(e.target.value)}
                placeholder={mr ? '${U.contractorNameP}' : 'Vendor name...'} />
            </div>
            <div className="col-md-4">
              <label style={LABEL}>{mr ? '${U.approvedAmt}' : 'Approved Amount (\u20b9)'} *</label>
              <input type="number" style={INPUT} value={vendorAmt} onChange={e => setVendorAmt(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label style={LABEL}>{mr ? '${U.contractorClass}' : 'Contractor Class'}</label>
              <input style={INPUT_RO} value={contractorClass} readOnly placeholder={mr ? '${U.autoFilled}' : 'Auto-filled'} />
            </div>
            <div className="col-md-4">
              <label style={LABEL}>{mr ? '${U.stampAmt}' : 'Stamp Amount (\u20b9)'}</label>
              <input style={INPUT_RO} value={stampAmt || ''} readOnly />
            </div>
            <div className="col-md-2">
              <label style={LABEL}>{mr ? '${U.period}' : 'Period'} *</label>
              <input type="number" style={INPUT} value={workPeriod} onChange={e => setWorkPeriod(e.target.value)} />
            </div>
            <div className="col-md-2">
              <label style={LABEL}>{mr ? '${U.unit}' : 'Unit'}</label>
              <select style={INPUT} value={periodType} onChange={e => setPeriodType(e.target.value)}>
                <option value="${U.divsas}">${U.divsas}</option>
                <option value="${U.mahine}">${U.mahine}</option>
              </select>
            </div>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label style={LABEL}>{mr ? '${U.supervisor}' : 'Supervisor'} *</label>
              <input style={INPUT} value={supervisorName} onChange={e => setSupervisorName(e.target.value)}
                placeholder={mr ? '${U.supervisorP}' : 'Officer name...'} />
            </div>
            <div className="col-md-6">
              <label style={LABEL}>{mr ? '${U.sahiAdhikari}' : 'Signing Officer'}</label>
              <select style={INPUT} value={signingId} onChange={e => setSigningId(e.target.value)}>
                <option value="">{mr ? '${U.niavada}' : '-- Select --'}</option>
                {signingOfficers.map(o => <option key={o.sanctionId} value={String(o.sanctionId)}>{o.sanctionNameLL}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="me-4 user-select-none" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="me-1" checked={emd} onChange={e => setEmd(e.target.checked)} />
                {mr ? '${U.emd}' : 'EMD (Earnest Money)'}
              </label>
              <label className="user-select-none" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="me-1" checked={deposit} onChange={e => setDeposit(e.target.checked)} />
                {mr ? '${U.deposit}' : 'Security Deposit'}
              </label>
            </div>
          </div>

          <SL text={mr ? '${U.contractorsList}' : 'Contractors List'} />
          {contractors.map((c, i) => (
            <div key={i} className="d-flex gap-2 mb-2">
              <input style={{ ...INPUT, flex: 1 }} value={c} onChange={e => setCV(i, e.target.value)}
                placeholder={mr ? \`\${i + 1}. ${U.contractorN}\${i + 1}${U.contractorName2}\` : \`Contractor \${i + 1} name...\`} />
              {contractors.length > 1 && (
                <button className="btn btn-outline-danger btn-sm" onClick={() => removeCV(i)}>
                  <i className="bi bi-trash" />
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-outline-primary btn-sm mb-4" onClick={addCV}>
            <i className="bi bi-plus-circle me-1" />{mr ? '${U.addContractor}' : 'Add Contractor'}
          </button>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <button className="btn btn-primary px-4" disabled={saving || !!result}
              onClick={() => { const e = validate(); if (e) { setPopup({ tone: 'error', title: e }); return }; setShowConfirm(true) }}>
              {saving
                ? <><span className="spinner-border spinner-border-sm me-1" />{mr ? '${U.tayarHotAhe}' : 'Saving...'}</>
                : (mr ? '${U.samajTayarKaraBtn}' : 'Create Samaj')}
            </button>
          </div>
        </div>
        )}

        {showConfirm && nastiOrder && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '32px 36px', maxWidth: 460, width: '90%', boxShadow: '0 8px 40px #0004' }}>
              <div style={{ color: '#1a6db5', fontWeight: 700, fontSize: '0.73rem', letterSpacing: '0.1em', marginBottom: 8 }}>
                {mr ? '${U.pushtiKara}' : 'CONFIRM'}
              </div>
              <h5 style={{ fontWeight: 700, color: '#1a3a5c', marginBottom: 16 }}>
                {mr ? '${U.confirmSamaj}' : 'Create this Samaj?'}
              </h5>
              <div style={{ fontSize: '0.88rem', color: '#5e7388', marginBottom: 20 }}>
                <div><strong>{mr ? '${U.kaam}' : 'Work:'}</strong> {nastiOrder.proposalName}</div>
                <div><strong>{mr ? '${U.vibhag}' : 'Dept:'}</strong> {nastiOrder.deptName}</div>
                <div><strong>{mr ? '${U.rakkam}' : 'Amount:'}</strong> \u20b9{fmtINR(parseFloat(vendorAmt))}</div>
              </div>
              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-outline-secondary" onClick={() => setShowConfirm(false)}>
                  {mr ? '${U.raddKara}' : 'Cancel'}
                </button>
                <button className="btn btn-primary" onClick={doGenerate}>
                  {mr ? '${U.hoyTayarKara}' : 'Yes, Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
`

writeFileSync(outPath, content, 'utf8')
console.log('page.tsx written successfully.')
