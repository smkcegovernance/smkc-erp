'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { decryptParams } from '@/app/lib/url-crypto'

interface SamajDetail {
  workOrderNo: number
  samajDisplayNo: string
  deptCode: number
  deptName: string
  finYear: string
  finalOrderNo: string
  proposalName: string
  proposalAmount: number
  eligibleVendorName: string
  vendorProposedAmount: number
  workPeriod: string
  periodType: string
  authorityName: string
  isManualOrder: boolean
  manualFinalOrderNo: string
  sanctionDate: string
  signingOfficerName: string
  signingOfficerDesignation: string
  supervisorName: string
  stampAmt: number
  contractorClass: string
  emdFlag: string
  depositFlag: string
  workOrderDate: string
  contractors: string[]
}

function fmtAmt(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function fmtDate(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`
}

function PrintInner() {
  const params = useSearchParams()
  const token = params.get('t') ?? ''

  const [workOrderNo, setWorkOrderNo] = useState('')
  const [deptCode, setDeptCode] = useState('')
  const [finYear, setFinYear] = useState('')

  const [data, setData] = useState<SamajDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const didPrint = useRef(false)
  const [qrUrl, setQrUrl] = useState('')

  // Decrypt the encrypted token from the URL
  useEffect(() => {
    if (!token) {
      setError('अवैध दुवा.')
      setLoading(false)
      return
    }
    decryptParams(token).then((p) => {
      if (!p) {
        setError('अवैध किंवा खराब दुवा.')
        setLoading(false)
        return
      }
      setWorkOrderNo(String(p.workOrderNo ?? ''))
      setDeptCode(String(p.deptCode ?? ''))
      setFinYear(String(p.finYear ?? ''))
    })
  }, [token])

  useEffect(() => {
    if (!workOrderNo || !deptCode || !finYear) {
      return
    }
    setLoading(true)
    const qs = `workOrderNo=${workOrderNo}&deptCode=${deptCode}&finYear=${encodeURIComponent(finYear)}`
    fetch(`/api/gad/samaj/detail?${qs}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.message || 'नोंद आढळली नाही.')
        }
      })
      .catch(() => setError('नेटवर्क एरर.'))
      .finally(() => setLoading(false))
  }, [workOrderNo, deptCode, finYear])

  useEffect(() => {
    if (data && !didPrint.current) {
      didPrint.current = true
      setTimeout(() => window.print(), 600)
    }
  }, [data])

  useEffect(() => {
    if (data) {
      setQrUrl(
        [
          'SMKMC VERIFIED DOCUMENT',
          'Type: Nivida Manjuri Samaj',
          `Dept: ${data.deptName}`,
          `No: ${data.samajDisplayNo}`,
          `FY: ${data.finYear}`,
          'Status: GENUINE',
        ].join('\n')
      )
    }
  }, [data])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>লোড होত আহে...</div>
  if (error) return <div style={{ padding: 40, color: 'red' }}>{error}</div>
  if (!data) return null

  const workDate = data.workOrderDate
    ? new Date(data.workOrderDate)
    : new Date()
  const displayDate = fmtDate(workDate)

  const hasEmd = data.emdFlag?.toLowerCase() === 'y'
  const hasDeposit = data.depositFlag?.toLowerCase() === 'y'
  const emdAmt = hasEmd ? Math.round(data.vendorProposedAmount * 0.01) : 0
  const depositAmt = hasDeposit ? Math.round(data.vendorProposedAmount * 0.05) : 0

  const vendorDisplay = data.contractors && data.contractors.length > 0
    ? data.contractors[0]
    : data.eligibleVendorName

  const noLine = `${data.deptName} / ${data.workOrderNo} / ${data.finYear}`
  const authLine = data.isManualOrder && data.manualFinalOrderNo
    ? `${data.authorityName} ठराव क्र. ${data.manualFinalOrderNo} दिनांक ${data.sanctionDate || ''} अन्वये`
    : `${data.authorityName} दिनांक ${data.sanctionDate || ''} अन्वये`

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; margin: 0 auto !important; }
        }
        body { font-family: 'Noto Sans', 'Arial Unicode MS', Arial, sans-serif; background: #f0f0f0; }
        .page {
          background: white;
          width: 210mm;
          height: 297mm;
          margin: 20px auto;
          padding: 10mm 16mm 8mm 16mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
          box-sizing: border-box;
          font-size: 11pt;
          line-height: 1.45;
          color: #000;
          overflow: hidden;
        }
        .header-title {
          font-size: 16pt;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.5px;
          margin-bottom: 1px;
        }
        .header-subtitle {
          text-align: center;
          font-size: 10pt;
          color: #333;
          margin-bottom: 2px;
        }
        .divider {
          border: none;
          border-top: 2px solid #000;
          margin: 4px 0 5px;
        }
        .no-date-row {
          display: flex;
          justify-content: space-between;
          font-size: 10.5pt;
          margin-bottom: 4px;
        }
        .samaj-title {
          font-size: 13pt;
          font-weight: 700;
          text-align: center;
          text-decoration: underline;
          margin: 4px 0 6px;
        }
        .to-line {
          font-size: 11pt;
          margin-bottom: 3px;
        }
        .auth-line {
          font-size: 11pt;
          margin-bottom: 3px;
        }
        .work-label {
          font-size: 11pt;
          margin-top: 3px;
        }
        .work-name {
          font-weight: 700;
          font-size: 11pt;
          margin-bottom: 5px;
        }
        .body-para {
          text-align: justify;
          margin-bottom: 5px;
          font-size: 11pt;
          line-height: 1.45;
        }
        .bottom-row {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          align-items: end;
        }
        .sign-col {
          grid-column: 3;
          text-align: center;
          font-size: 10.5pt;
        }
        .qr-col {
          grid-column: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 8pt;
          color: #444;
        }
        .seal-area {
          text-align: center;
          margin-bottom: 2px;
        }
        .seal-area img {
          height: 68px;
          width: 68px;
          object-fit: contain;
        }
      `}</style>

      <div className="no-print" style={{ background: '#555', padding: '10px', textAlign: 'center' }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 28px', fontSize: 14, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          छापा काढा (Print)
        </button>
        <button
          onClick={() => window.close()}
          style={{ marginLeft: 12, padding: '8px 18px', fontSize: 14, cursor: 'pointer', background: '#888', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          बंद करा
        </button>
      </div>

      <div className="page">
        {/* Seal */}
        <div className="seal-area">
          <img src="/assets/SMKC_NEW_LOGO_PNG.png" alt="SMKC" />
        </div>

        {/* Heading */}
        <div className="header-title">
          सांगली मिरज आणि कुपवाड शहर महानगरपालिका
        </div>
        <div className="header-subtitle">सांगली</div>

        <hr className="divider" />

        {/* No & Date row */}
        <div className="no-date-row">
          <span><strong>नं. :-</strong> {noLine}</span>
          <span><strong>दिनांक :-</strong> {displayDate}</span>
        </div>

        {/* Title */}
        <div className="samaj-title">निविदा मंजुरीची समज</div>

        {/* To */}
        <div className="to-line">
          मे श्री. {vendorDisplay} मक्तेदार, सांगली / मिरज यांचेकडे.
        </div>

        {/* Authority line */}
        <div className="auth-line">
          मा. {authLine}
        </div>

        {/* Work name */}
        <div className="work-label">कामगिरीचे नाव :-</div>
        <div className="work-name">{data.proposalName}</div>

        {/* Main paragraph */}
        <div className="body-para">
          अंदाज पत्रक रक्कम रुपये {fmtAmt(data.proposalAmount)}/- मात्रीची कामगिरी तुमचे नावे {fmtAmt(data.vendorProposedAmount)}/- दराने मंजूर करण्यात आले आहे. तरी त्याकरिता{hasDeposit ? ` रुपये ${fmtAmt(depositAmt)}/- मात्र सुरक्षा अनामत भरून` : ''} 7 दिवसांच्या आत स्थापत्य विभागाशी करारपत्र करून द्यावयाचे आहे. सदर कामगिरी महानगरपालिकेच्या अधिकृत नोंदणी प्राप्त ठेकेदार वर्ग{data.contractorClass ? ` ${data.contractorClass}` : ''} या दर्जाच्या मक्तेदाराकडून पूर्ण करून घेण्यात येईल. सदर काम {data.workPeriod} {data.periodType === 'month' ? 'महिन्यांत' : 'दिवसांत'} पूर्ण करण्याचे आहे. या कामाची मुदत संपल्यानंतर निर्धारित वेळेत काम पूर्ण न केल्यास महानगरपालिकेस वाटेल त्याप्रमाणे फेरनिविदा काढण्यात येईल. त्यामुळे जर या कामी महानगरपालिकेचे आर्थिक नुकसान होत असेल तर ते तुमच्याकडून कायदेशीर मार्गाने वसुलात आणले जाईल. या कामी अनामत भरून करारपत्र करून देण्यास पुन्हा समज दिली जाणार नाही. सदरची समज ही अंतिम समजणेची आहे. याची संबंधित ठेकेदार यांनी नोंद घ्यावी.
        </div>

        {hasEmd && (
          <div className="body-para">
            तसेच, या कामाची निविदा रद्द करण्यात येईल व तुमची अर्नेस्ट मनी रुपये {fmtAmt(emdAmt)}/- मात्र जप्त करण्यात येईल व सदर निविदा वर्ग 2 व 3 या दर्जाच्या मक्तेदाराकडून फेरनिविदा काढण्यात येईल.
          </div>
        )}

        {data.stampAmt > 0 && (
          <div className="body-para">
            करारपत्रासाठी रुपये {fmtAmt(data.stampAmt)}/- मूल्याचा स्टांप पेपर वापरणे आवश्यक आहे.
          </div>
        )}

        {/* Bottom: Signature (left) + QR Code (center) */}
        <div className="bottom-row">
          {/* Left: Signature */}
          <div className="sign-col">
            <div style={{ height: 52, borderBottom: '1px solid #555', marginBottom: 6 }} />
            <div style={{ fontWeight: 700, fontSize: '12pt' }}>
              {data.signingOfficerName || 'अधिकृत अधिकारी'}
            </div>
            {data.signingOfficerDesignation && (
              <div style={{ fontSize: '10.5pt', marginTop: 2 }}>
                {data.signingOfficerDesignation}
              </div>
            )}
            {data.deptName && (
              <div style={{ fontSize: '10.5pt', marginTop: 2 }}>
                {data.deptName}
              </div>
            )}
            <div style={{ fontSize: '10.5pt', marginTop: 2 }}>
              सांगली मिरज आणि कुपवाड शहर महानगरपालिका
            </div>
          </div>
          {/* Center: QR Code — value from state (set in useEffect, browser-only) */}
          <div className="qr-col">
            {qrUrl && (
              <QRCodeSVG value={qrUrl} size={90} level="M" marginSize={0} />
            )}
            <div style={{ marginTop: 3, fontSize: '8pt', color: '#555', textAlign: 'center' }}>
              स्कॅन करा - पडताळा
            </div>
          </div>
          {/* Right: empty spacer keeps QR centred in 3-col grid */}
          <div />
        </div>


      </div>
    </>
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>लोड होत आहे...</div>}>
      <PrintInner />
    </Suspense>
  )
}
