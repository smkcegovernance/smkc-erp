import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const content = `'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
  return \`\${pad2(d.getDate())}/\${pad2(d.getMonth() + 1)}/\${d.getFullYear()}\`
}

function PrintInner() {
  const params = useSearchParams()
  const workOrderNo = params.get('workOrderNo') ?? ''
  const deptCode = params.get('deptCode') ?? ''
  const finYear = params.get('finYear') ?? ''

  const [data, setData] = useState<SamajDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const didPrint = useRef(false)

  useEffect(() => {
    if (!workOrderNo || !deptCode || !finYear) {
      setError('\u092a\u0941\u0930\u0947\u0936\u0940 \u092e\u093e\u0939\u093f\u0924\u0940 \u0928\u093e\u0939\u0940.')
      setLoading(false)
      return
    }
    const qs = \`workOrderNo=\${workOrderNo}&deptCode=\${deptCode}&finYear=\${encodeURIComponent(finYear)}\`
    fetch(\`/api/gad/samaj/detail?\${qs}\`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data)
        } else {
          setError(json.message || '\u0928\u094b\u0902\u0926 \u0906\u0922\u0933\u0932\u0940 \u0928\u093e\u0939\u0940.')
        }
      })
      .catch(() => setError('\u0928\u0947\u091f\u0935\u0930\u094d\u0915 \u090f\u0930\u0930.'))
      .finally(() => setLoading(false))
  }, [workOrderNo, deptCode, finYear])

  useEffect(() => {
    if (data && !didPrint.current) {
      didPrint.current = true
      setTimeout(() => window.print(), 600)
    }
  }, [data])

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>\u0932\u094b\u0921 \u0939\u094b\u0924 \u0906\u0939\u0947...</div>
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

  const noLine = \`\${data.deptName} / \${data.workOrderNo} / \${data.finYear}\`
  const authLine = data.isManualOrder && data.manualFinalOrderNo
    ? \`\${data.authorityName} \u0920\u0930\u093e\u0935 \u0915\u094d\u0930. \${data.manualFinalOrderNo} \u0926\u093f\u0928\u093e\u0902\u0915 \${data.sanctionDate || ''} \u0905\u0928\u094d\u0935\u092f\u0947\`
    : \`\${data.authorityName} \u0926\u093f\u0928\u093e\u0902\u0915 \${data.sanctionDate || ''} \u0905\u0928\u094d\u0935\u092f\u0947\`

  return (
    <>
      <style>{\`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .page { box-shadow: none !important; }
        }
        body { font-family: 'Noto Sans', 'Arial Unicode MS', Arial, sans-serif; background: #f0f0f0; }
        .page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          margin: 20px auto;
          padding: 18mm 18mm 15mm 18mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.2);
          box-sizing: border-box;
          font-size: 13pt;
          line-height: 1.65;
          color: #000;
        }
        .header-title {
          font-size: 17pt;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }
        .header-subtitle {
          text-align: center;
          font-size: 11pt;
          color: #333;
          margin-bottom: 4px;
        }
        .divider {
          border: none;
          border-top: 2px solid #000;
          margin: 6px 0 8px;
        }
        .no-date-row {
          display: flex;
          justify-content: space-between;
          font-size: 12pt;
          margin-bottom: 10px;
        }
        .samaj-title {
          font-size: 16pt;
          font-weight: 700;
          text-align: center;
          text-decoration: underline;
          margin: 8px 0 14px;
        }
        .to-line {
          font-size: 13pt;
          margin-bottom: 6px;
        }
        .auth-line {
          font-size: 13pt;
          margin-bottom: 4px;
        }
        .work-label {
          font-size: 13pt;
          margin-top: 6px;
        }
        .work-name {
          font-weight: 700;
          font-size: 13pt;
          margin-bottom: 10px;
        }
        .body-para {
          text-align: justify;
          margin-bottom: 10px;
          font-size: 13pt;
        }
        .sign-block {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }
        .sign-inner {
          border: 1px solid #555;
          padding: 10px 18px;
          min-width: 240px;
          text-align: center;
          font-size: 11pt;
        }
        .footer-center {
          text-align: center;
          margin-top: 30px;
          font-size: 11pt;
          font-weight: 600;
          color: #444;
        }
        .seal-area {
          text-align: center;
          margin-bottom: 4px;
        }
        .seal-area img {
          height: 70px;
          width: 70px;
          object-fit: contain;
        }
        .seal-placeholder {
          display: inline-block;
          width: 70px;
          height: 70px;
          border: 2px solid #c00;
          border-radius: 50%;
          line-height: 70px;
          font-size: 10pt;
          color: #c00;
          text-align: center;
        }
      \`}</style>

      <div className="no-print" style={{ background: '#555', padding: '10px', textAlign: 'center' }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 28px', fontSize: 14, cursor: 'pointer', background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          \u091b\u093e\u092a\u093e \u0915\u093e\u0922\u093e (Print)
        </button>
        <button
          onClick={() => window.close()}
          style={{ marginLeft: 12, padding: '8px 18px', fontSize: 14, cursor: 'pointer', background: '#888', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          \u092c\u0902\u0926 \u0915\u0930\u093e
        </button>
      </div>

      <div className="page">
        {/* Seal */}
        <div className="seal-area">
          <span className="seal-placeholder">\u092e.\u092a\u093e.</span>
        </div>

        {/* Heading */}
        <div className="header-title">
          \u0938\u093e\u0902\u0917\u0932\u0940 \u092e\u093f\u0930\u091c \u0906\u0923\u093f \u0915\u0941\u092a\u0935\u093e\u0921 \u0936\u0939\u0930 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u093e
        </div>
        <div className="header-subtitle">\u0938\u093e\u0902\u0917\u0932\u0940</div>

        <hr className="divider" />

        {/* No & Date row */}
        <div className="no-date-row">
          <span><strong>\u0928\u0902. :-</strong> {noLine}</span>
          <span><strong>\u0926\u093f\u0928\u093e\u0902\u0915 :-</strong> {displayDate}</span>
        </div>

        {/* Title */}
        <div className="samaj-title">\u0928\u093f\u0935\u093f\u0926\u093e \u092e\u0902\u091c\u0941\u0930\u0940\u091a\u0940 \u0938\u092e\u091c</div>

        {/* To */}
        <div className="to-line">
          \u092e\u0947 \u0936\u094d\u0930\u0940. {vendorDisplay} \u092e\u0915\u094d\u0924\u0947\u0926\u093e\u0930, \u0938\u093e\u0902\u0917\u0932\u0940 / \u092e\u093f\u0930\u091c \u092f\u093e\u0902\u091a\u0947\u0915\u0921\u0947.
        </div>

        {/* Authority line */}
        <div className="auth-line">
          \u092e\u093e. {authLine}
        </div>

        {/* Work name */}
        <div className="work-label">\u0915\u093e\u092e\u0917\u093f\u0930\u0940\u091a\u0947 \u0928\u093e\u0935 :-</div>
        <div className="work-name">{data.proposalName}</div>

        {/* Main paragraph */}
        <div className="body-para">
          \u0905\u0902\u0926\u093e\u091c \u092a\u0924\u094d\u0930\u0915 \u0930\u0915\u094d\u0915\u092e \u0930\u0941\u092a\u092f\u0947 {fmtAmt(data.proposalAmount)}/- \u092e\u093e\u0924\u094d\u0930\u0940\u091a\u0940 \u0915\u093e\u092e\u0917\u093f\u0930\u0940 \u0924\u0941\u092e\u091a\u0947 \u0928\u093e\u0935\u0947 {fmtAmt(data.vendorProposedAmount)}/- \u0926\u0930\u093e\u0928\u0947 \u092e\u0902\u091c\u0942\u0930 \u0915\u0930\u0923\u094d\u092f\u093e\u0924 \u0906\u0932\u0947 \u0906\u0939\u0947. \u0924\u0930\u0940 \u0924\u094d\u092f\u093e\u0915\u0930\u093f\u0924\u093e{hasDeposit ? \` \u0930\u0941\u092a\u092f\u0947 \${fmtAmt(depositAmt)}/- \u092e\u093e\u0924\u094d\u0930 \u0938\u0941\u0930\u0915\u094d\u0937\u093e \u0905\u0928\u093e\u092e\u0924 \u092d\u0930\u0942\u0928\` : ''} 7 \u0926\u093f\u0935\u0938\u093e\u0902\u091a\u094d\u092f\u093e \u0906\u0924 \u0938\u094d\u0925\u093e\u092a\u0924\u094d\u092f \u0935\u093f\u092d\u093e\u0917\u093e\u0936\u0940 \u0915\u0930\u093e\u0930\u092a\u0924\u094d\u0930 \u0915\u0930\u0942\u0928 \u0926\u094d\u092f\u093e\u0935\u092f\u093e\u091a\u0947 \u0906\u0939\u0947. \u0938\u0926\u0930 \u0915\u093e\u092e\u0917\u093f\u0930\u0940 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u0947\u091a\u094d\u092f\u093e \u0905\u0927\u093f\u0915\u0943\u0924 \u0928\u094b\u0902\u0926\u0923\u0940 \u092a\u094d\u0930\u093e\u092a\u094d\u0924 \u0920\u0947\u0915\u0947\u0926\u093e\u0930 \u0935\u0930\u094d\u0917{data.contractorClass ? \` \${data.contractorClass}\` : ''} \u092f\u093e \u0926\u0930\u094d\u091c\u093e\u091a\u094d\u092f\u093e \u092e\u0915\u094d\u0924\u0947\u0926\u093e\u0930\u093e\u0915\u0921\u0942\u0928 \u092a\u0942\u0930\u094d\u0923 \u0915\u0930\u0942\u0928 \u0918\u0947\u0923\u094d\u092f\u093e\u0924 \u092f\u0947\u0908\u0932. \u0938\u0926\u0930 \u0915\u093e\u092e {data.workPeriod}\u00a0{data.periodType === 'month' ? '\u092e\u0939\u093f\u0928\u094d\u092f\u093e\u0902\u0924' : '\u0926\u093f\u0935\u0938\u093e\u0902\u0924'} \u092a\u0942\u0930\u094d\u0923 \u0915\u0930\u0923\u094d\u092f\u093e\u091a\u0947 \u0906\u0939\u0947. \u092f\u093e \u0915\u093e\u092e\u093e\u091a\u0940 \u092e\u0941\u0926\u0924 \u0938\u0902\u092a\u0932\u094d\u092f\u093e\u0928\u0902\u0924\u0930 \u0928\u093f\u0930\u094d\u0927\u093e\u0930\u093f\u0924 \u0935\u0947\u0933\u0947\u0924 \u0915\u093e\u092e \u092a\u0942\u0930\u094d\u0923 \u0928 \u0915\u0947\u0932\u094d\u092f\u093e\u0938 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u0947\u0938 \u0935\u093e\u091f\u0947\u0932 \u0924\u094d\u092f\u093e\u092a\u094d\u0930\u092e\u093e\u0923\u0947 \u092b\u0947\u0930\u0928\u093f\u0935\u093f\u0926\u093e \u0915\u093e\u0922\u0923\u094d\u092f\u093e\u0924 \u092f\u0947\u0908\u0932. \u0924\u094d\u092f\u093e\u092e\u0941\u0933\u0947 \u091c\u0930 \u092f\u093e \u0915\u093e\u092e\u0940 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u0947\u091a\u0947 \u0906\u0930\u094d\u0925\u093f\u0915 \u0928\u0941\u0915\u0938\u093e\u0928 \u0939\u094b\u0924 \u0905\u0938\u0947\u0932 \u0924\u0930 \u0924\u0947 \u0924\u0941\u092e\u091a\u094d\u092f\u093e\u0915\u0921\u0942\u0928 \u0915\u093e\u092f\u0926\u0947\u0936\u0940\u0930 \u092e\u093e\u0930\u094d\u0917\u093e\u0928\u0947 \u0935\u0938\u0941\u0932\u093e\u0924 \u0906\u0923\u0932\u0947 \u091c\u093e\u0908\u0932. \u092f\u093e \u0915\u093e\u092e\u0940 \u0905\u0928\u093e\u092e\u0924 \u092d\u0930\u0942\u0928 \u0915\u0930\u093e\u0930\u092a\u0924\u094d\u0930 \u0915\u0930\u0942\u0928 \u0926\u0947\u0923\u094d\u092f\u093e\u0938 \u092a\u0941\u0928\u094d\u0939\u093e \u0938\u092e\u091c \u0926\u093f\u0932\u0940 \u091c\u093e\u0923\u093e\u0930 \u0928\u093e\u0939\u0940. \u0938\u0926\u0930\u091a\u0940 \u0938\u092e\u091c \u0939\u0940 \u0905\u0902\u0924\u093f\u092e \u0938\u092e\u091c\u0923\u0947\u091a\u0940 \u0906\u0939\u0947. \u092f\u093e\u091a\u0940 \u0938\u0902\u092c\u0902\u0927\u093f\u0924 \u0920\u0947\u0915\u0947\u0926\u093e\u0930 \u092f\u093e\u0902\u0928\u0940 \u0928\u094b\u0902\u0926 \u0918\u094d\u092f\u093e\u0935\u0940.
        </div>

        {hasEmd && (
          <div className="body-para">
            \u0924\u0938\u0947\u091a, \u092f\u093e \u0915\u093e\u092e\u093e\u091a\u0940 \u0928\u093f\u0935\u093f\u0926\u093e \u0930\u0926\u094d\u0926 \u0915\u0930\u0923\u094d\u092f\u093e\u0924 \u092f\u0947\u0908\u0932 \u0935 \u0924\u0941\u092e\u091a\u0940 \u0905\u0930\u094d\u0928\u0947\u0938\u094d\u091f \u092e\u0928\u0940 \u0930\u0941\u092a\u092f\u0947 {fmtAmt(emdAmt)}/- \u092e\u093e\u0924\u094d\u0930 \u091c\u092a\u094d\u0924 \u0915\u0930\u0923\u094d\u092f\u093e\u0924 \u092f\u0947\u0908\u0932 \u0935 \u0938\u0926\u0930 \u0928\u093f\u0935\u093f\u0926\u093e \u0935\u0930\u094d\u0917 2 \u0935 3 \u092f\u093e \u0926\u0930\u094d\u091c\u093e\u091a\u094d\u092f\u093e \u092e\u0915\u094d\u0924\u0947\u0926\u093e\u0930\u093e\u0915\u0921\u0942\u0928 \u092b\u0947\u0930\u0928\u093f\u0935\u093f\u0926\u093e \u0915\u093e\u0922\u0923\u094d\u092f\u093e\u0924 \u092f\u0947\u0908\u0932.
          </div>
        )}

        {data.stampAmt > 0 && (
          <div className="body-para">
            \u0915\u0930\u093e\u0930\u092a\u0924\u094d\u0930\u093e\u0938\u093e\u0920\u0940 \u0930\u0941\u092a\u092f\u0947 {fmtAmt(data.stampAmt)}/- \u092e\u0942\u0932\u094d\u092f\u093e\u091a\u093e \u0938\u094d\u091f\u093e\u0902\u092a \u092a\u0947\u092a\u0930 \u0935\u093e\u092a\u0930\u0923\u0947 \u0906\u0935\u0936\u094d\u092f\u0915 \u0906\u0939\u0947.
          </div>
        )}

        {/* Signature block */}
        <div className="sign-block">
          <div className="sign-inner">
            <div style={{ fontSize: '10pt', color: '#333', marginBottom: 4 }}>
              Digitally signed by &apos;CN=DS SANGLI&apos;
            </div>
            <div style={{ fontSize: '10pt', color: '#333', marginBottom: 8 }}>
              Date: {displayDate}, Reason: Approved<br />Location: SMKMC
            </div>
            <div style={{ fontWeight: 700 }}>
              {data.signingOfficerName || '\u0905\u0927\u093f\u0915\u0943\u0924 \u0905\u0927\u093f\u0915\u093e\u0930\u0940'}
            </div>
            <div style={{ fontSize: '11pt' }}>
              \u0938\u093e\u0902\u0917\u0932\u0940 \u092e\u093f\u0930\u091c \u0906\u0923\u093f \u0915\u0941\u092a\u0935\u093e\u0921 \u0936\u0939\u0930 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u093e
            </div>
          </div>
        </div>

        <div className="footer-center">
          \u0938\u093e\u0902\u0917\u0932\u0940 \u092e\u093f\u0930\u091c \u0906\u0923\u093f \u0915\u0941\u092a\u0935\u093e\u0921 \u0936\u0939\u0930 \u092e\u0939\u093e\u0928\u0917\u0930\u092a\u093e\u0932\u093f\u0915\u093e
        </div>
      </div>
    </>
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>\u0932\u094b\u0921 \u0939\u094b\u0924 \u0906\u0939\u0947...</div>}>
      <PrintInner />
    </Suspense>
  )
}
`

writeFileSync(join(__dirname, 'page.tsx'), content, 'utf8')
console.log('Print page written successfully.')
