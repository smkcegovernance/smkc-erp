'use client'

import { useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface WorkProposalPrintData {
  orderNo: number
  proposalType: string     // 'Q' = दरपत्रक, 'T' = निविदा, 'O' = इतर प्रस्ताव
  finYear: string
  deptName: string
  nastiType: string
  nastiNo: string

  workName: string
  workPlace: string
  mapAttached: string
  wardNos: string
  workNeed: string
  workDoneBefore: string
  workAmount: number

  techApproval: string
  techSanctionNo: string
  techSanctionDate: string
  dsrRates: string

  placeOwnership: string
  nocDocAttached: string
  nocCertificate: string
  anyDispute: string
  courtCase: string
  caseDetails: string

  townPlanCheck: string
  townPlanApproval: string
  expendValid: string
  stockListAttached: string
  photoAttached: string

  acSubhead: string
  acSubheadName: string
  proposalCost: number
  budgetAmount: number

  acHeadValid: string
  otherDept: string
  workSplit: string
  maintenancePeriod: string
  prevMaintenance: string
  competentOfficer: string
  tenderDuration?: string
  newspaperLevel?: string

  remarks: string
  enteredBy: string
  entryDate: string   // ISO date string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCurrency(n: number): string {
  if (!n) return '—'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)
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

function yn(v: string, yesWord = 'हो', noWord = 'नाही'): string {
  if (!v) return '—'
  const lc = v.toLowerCase()
  if (lc === 'y') return yesWord
  if (lc === 'n') return noWord
  return v
}

function ao(v: string): string {   // 'o' = आहे, 'n' = नाही
  if (!v) return '—'
  const lc = v.toLowerCase()
  if (lc === 'o') return 'आहे'
  if (lc === 'n') return 'नाही'
  return v
}

// ── Table row sub-components ──────────────────────────────────────────────────

const TD_LABEL: React.CSSProperties = {
  border: '1px solid #555',
  padding: '5px 8px',
  width: '52%',
  verticalAlign: 'top',
  fontSize: '10pt',
  lineHeight: 1.5,
}

const TD_VALUE: React.CSSProperties = {
  border: '1px solid #555',
  padding: '5px 8px',
  verticalAlign: 'top',
  fontSize: '10pt',
  fontWeight: 600,
  lineHeight: 1.5,
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={TD_LABEL}>{label}</td>
      <td style={TD_VALUE}>{value || '—'}</td>
    </tr>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  data: WorkProposalPrintData
  onClose: () => void
}

export default function WorkProposalPrintReport({ data, onClose }: Props) {
  const reportTitle = data.proposalType === 'T'
    ? 'निविदा मागविण्यास मान्यता'
    : data.proposalType === 'O'
      ? 'प्रस्तावित खर्चास मान्यता'
      : 'दरपत्रक मागविण्यास मान्यता'
  const nastiDisplay = data.nastiNo
    ? `${data.finYear}/${data.deptName}/${data.nastiNo}`
    : '—'

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      <style>{`
        @page { margin: 10mm; size: A4 portrait; }
        @media print {
          body { margin: 0; padding: 0; overflow: visible !important; }
          body * { visibility: hidden !important; }
          #wp-print-scroll-wrapper {
            visibility: visible !important;
            position: static !important;
            display: block !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          #wp-print-sheet {
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          #wp-print-sheet * { visibility: visible !important; }
          #wp-print-sheet .no-print { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="no-print"
        style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(10,26,46,0.70)', backdropFilter: 'blur(5px)' }}
        onClick={onClose}
      />

      {/* Scroll wrapper */}
      <div id="wp-print-scroll-wrapper" style={{ position: 'fixed', inset: 0, zIndex: 2001, overflowY: 'auto', padding: '28px 16px 60px', display: 'flex', justifyContent: 'center' }}>
        {/* A4 Sheet */}
        <div
          id="wp-print-sheet"
          style={{
            background: '#fff',
            width: '210mm',
            minHeight: '297mm',
            padding: '10mm 14mm',
            fontFamily: '"Noto Sans Devanagari", "Mangal", "Arial Unicode MS", Arial, sans-serif',
            fontSize: '10pt',
            lineHeight: 1.6,
            boxShadow: '0 12px 48px rgba(10,26,46,0.22)',
            borderRadius: 4,
            alignSelf: 'flex-start',
            boxSizing: 'border-box',
          } as React.CSSProperties}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Screen-only action buttons ── */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{ padding: '7px 20px', borderRadius: 7, border: 'none', background: '#c0392b', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <i className="bi bi-printer-fill" /> मुद्रित करा
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '7px 16px', borderRadius: 7, border: '1.5px solid #b0bec5', background: '#fff', color: '#5e7388', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              बंद करा
            </button>
          </div>

          {/* ═══════════════════════ REPORT CONTENT ═══════════════════════ */}

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: '14pt', fontWeight: 800, color: '#000', letterSpacing: '0.01em' }}>
              सांगली मिरज आणि कुपवाड शहर महानगरपालिका
            </div>
            <div style={{ fontSize: '10.5pt', fontWeight: 500, marginTop: 2 }}>
              आर्थिक वर्ष सन {data.finYear}
            </div>
            <div style={{ fontSize: '12pt', fontWeight: 800, marginTop: 6, textDecoration: 'underline' }}>
              {reportTitle}
            </div>
          </div>

          {/* Dept + Date + Nasti row */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8, fontSize: '10pt' }}>
            <tbody>
              <tr>
                <td style={{ width: '20%', paddingBottom: 2 }}>विभागाचे नांव</td>
                <td style={{ width: '1%', paddingBottom: 2 }}>:</td>
                <td style={{ fontWeight: 600, paddingBottom: 2 }}>{data.deptName || '—'}</td>
                <td style={{ textAlign: 'right', paddingBottom: 2 }}>दिनांक : {fmtDate(data.entryDate)}</td>
              </tr>
              <tr>
                <td>नस्ती क्रमांक</td>
                <td>:</td>
                <td colSpan={2}>{nastiDisplay}</td>
              </tr>
            </tbody>
          </table>

          {/* Main title inside table */}
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11pt', border: '1px solid #555', borderBottom: 'none', padding: '5px 0', background: '#f5f5f5' }}>
            {reportTitle}
          </div>

          {/* Main content table — exactly matching the PDF rows */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ ...TD_LABEL, fontWeight: 700, fontSize: '10pt' }}>कामगिरीचे नाव</th>
                <th style={{ ...TD_VALUE, fontWeight: 700, fontSize: '10pt', width: '44%' }}>
                  {data.workName || '—'}
                </th>
                <th style={{ border: '1px solid #555', padding: '5px 8px', fontSize: '10pt', fontWeight: 700, width: '4%', textAlign: 'center', verticalAlign: 'top' }}>
                  पृष्ठ क्र.
                </th>
              </tr>
            </thead>
            <tbody>
              {/* After first row, last column spans are removed - merged as 2-col */}
              <tr>
                <td style={TD_LABEL}>कामगिरीचे ठिकाण</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{data.workPlace || '—'}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>कामगिरीचा स्थल नकाशा सोबत जोडला आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.mapAttached)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>वॉर्ड क्रमांक</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>
                  {data.wardNos
                    ? (data.wardNos === 'all' || data.wardNos.split(',').length > 20 ? 'सर्व वार्ड' : data.wardNos)
                    : 'सर्व वार्ड'}
                </td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={{ ...TD_LABEL, verticalAlign: 'top' }}>कामगिरीची आवश्यकता</td>
                <td style={{ ...TD_VALUE, borderRight: 'none', verticalAlign: 'top' }}>{data.workNeed || '—'}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>यापूर्वी ही कामगिरी कधी करण्यात आलेली होती?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.workDoneBefore)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>अपेक्षित खर्चानुसार निविदा कालावधी</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{data.tenderDuration || '—'}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>निविदा प्रसिद्धीकरणासाठी वर्तमानपत्रांचा स्तर</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>
                  {data.newspaperLevel || '—'}
                </td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>कामगिरीसाठी अपेक्षित खर्च रुपये</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{fmtCurrency(data.workAmount)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>अंदाजपत्रकास सक्षम प्राधिकऱ्यांची तांत्रिक मान्यता प्राप्त आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{yn(data.techApproval)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>तांत्रिक मान्यता क्रमांक व दिनांक</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>
                  {data.techSanctionNo || data.techSanctionDate
                    ? `${data.techSanctionNo || ''}${data.techSanctionDate ? '  ' + data.techSanctionDate : ''}`
                    : '—'}
                </td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>अंदाजपत्रक DSR दरांप्रमाणे नसल्यास चालू बाजार भावाप्रमाणे दरपत्रके मागवून दर निश्चित करण्यात आले आहेत का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{yn(data.dsrRates)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावित कामगिरीची जागा महानगरपालिकेच्या मालकीची व प्रत्यक्ष ताब्यात आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.placeOwnership)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>जागा मालकी हक्क अथवा ना हरकत दाखला याबाबतचे दस्तऐवज सोबत जोडले आहेत का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.nocDocAttached)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावित कामगिरीची जागा महानगरपालिकेच्या मालकीची नसल्यास मालकी हक्क असणारी व्यक्ती / संस्था यांचे ना हरकत प्रमाणपत्र घेतले आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.nocCertificate)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावित कामगिरीच्या जागेबद्दल काही वाद विवाद आहेत का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.anyDispute)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावित कामगिरीच्या जागेबद्दल काही न्यायालयीन प्रकरण आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.courtCase)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>न्यायालयीन प्रकरण दाखल असल्यास प्रकरणाची सद्यास्थिती व न्यायालयीन निर्देश असल्यास माहिती</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{data.caseDetails || '—'}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>बांधकाम प्रस्तावित केले असल्यास त्याची अनुज्ञेयता नगररचना विभागाकडून तपासली आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.townPlanCheck)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>बांधकाम प्रस्तावित केले असल्यास बांधकाम नकाशांना नगररचना विभागाची परवानगी घेतली आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.townPlanApproval)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावित खर्च महानगरपालिका अधिनियम व अन्य शासन निर्देश या प्रमाणे अनुज्ञेय आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.expendValid)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>वस्तूंची खरेदी असल्यास सद्यस्थितीत किती वस्तू शिल्लक आहेत याचा तक्ता सोबत जोडला आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.stockListAttached)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावास कामगिरीपूर्वींचे फोटो जोडले आहेत का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.photoAttached)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>अनुज्ञेय लेखाशीर्ष</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>
                  {data.acSubhead}{data.acSubheadName ? ` — ${data.acSubheadName}` : ''}
                </td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>अर्थसंकल्पीय तरतूद</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{fmtCurrency(data.budgetAmount)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावित कामाचा खर्च</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{fmtCurrency(data.proposalCost)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावित लेखाशीर्ष प्रस्तावित कामगिरीसाठी अनुज्ञेय आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.acHeadValid)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>ही कामगिरी अन्य विभाग/अन्य योजना यातून प्रस्तावित करण्यात आलेली आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.otherDept)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>सदर कामगिरी ही एका सलग कामाचे अनेक तुकडे करुन पार पाडली जात आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.workSplit)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>कामगिरीचा परिरक्षण कालावधी</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{data.maintenancePeriod ? `${data.maintenancePeriod} वर्षे` : '—'}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>पूर्वींचा परिरक्षण कालावधी संपण्यापूर्वींच कामगिरी प्रस्तावित केली आहे का?</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{ao(data.prevMaintenance)}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>प्रस्तावास प्रशासकीय मान्यता देण्यास पात्र असणारे सक्षम प्राधिकारी</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{data.competentOfficer || '—'}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
              <tr>
                <td style={TD_LABEL}>अन्य अभिप्राय</td>
                <td style={{ ...TD_VALUE, borderRight: 'none' }}>{data.remarks || '—'}</td>
                <td style={{ border: '1px solid #555', borderLeft: 'none' }} />
              </tr>
            </tbody>
          </table>

          {/* Signature section — forced onto a new page when printing */}
          <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>

          {/* Certification paragraph */}
          <p style={{ fontSize: '9.5pt', marginBottom: 16, lineHeight: 1.7 }}>
            आम्ही वरील नमूद सर्व बाबींची तपासणी, पडताळणी व खात्री केली असून त्या योग्य आहेत. यात खोटी माहिती दिलेली
            अथवा माहिती लपविलेली आढळल्यास त्यास आम्ही सर्वस्वी जबाबदार राहू.
          </p>

          {/* Signature blocks — 2 side by side */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
            <tbody>
              <tr>
                {(['पहिले', 'दुसरे'] as const).map((label, i) => (
                  <td key={i} style={{ width: '50%', border: '1px solid #555', padding: '8px 12px', verticalAlign: 'top' }}>
                    <div style={{ fontSize: '9.5pt', marginBottom: 24 }}>दिनांकित स्वाक्षरी</div>
                    <div style={{ fontSize: '9.5pt', borderBottom: '1px solid #999', paddingBottom: 20, marginBottom: 6 }}></div>
                    <div style={{ fontSize: '9.5pt', marginBottom: 20 }}>नाव</div>
                    <div style={{ fontSize: '9.5pt', borderBottom: '1px solid #999', paddingBottom: 20, marginBottom: 6 }}></div>
                    <div style={{ fontSize: '9.5pt', marginBottom: 20 }}>पद</div>
                    <div style={{ fontSize: '9.5pt', borderBottom: '1px solid #999', paddingBottom: 20 }}></div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ marginTop: 10, fontSize: '8.5pt', color: '#555', display: 'flex', justifyContent: 'space-between' }}>
            <span>क्रमांक: {data.orderNo}</span>
            <span>नोंदवलेले: {data.enteredBy}</span>
            <span>दिनांक: {fmtDate(data.entryDate)}</span>
          </div>

          </div>{/* end page-break wrapper */}
        </div>
      </div>
    </>
  )
}
