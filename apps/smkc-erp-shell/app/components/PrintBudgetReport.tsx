'use client'

import { useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PrintData {
  type: 'primary' | 'final'
  bookEntryNo: number
  finalBookEntryNo: number
  finYear: string
  deptName: string
  workName: string
  acSubhead: string
  acSubheadName: string
  budgetAmount: number
  /** Remaining budget BEFORE this entry was committed */
  remainingBefore: number
  /** Amount proposed in this entry (primary or final) */
  proposedAmount: number
  /** Remaining budget AFTER this entry was committed */
  remainingAfter: number
  /** ISO date string of the entry (primary or final entry date) */
  entryDate: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDatetime(isoStr: string): string {
  if (!isoStr) return '—'
  try {
    const d = new Date(isoStr)
    const day = String(d.getDate()).padStart(2, '0')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = months[d.getMonth()]
    const year = d.getFullYear()
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    const min = String(d.getMinutes()).padStart(2, '0')
    const sec = String(d.getSeconds()).padStart(2, '0')
    return `${day}/${month}/${year}  ${String(h).padStart(2, '0')}:${min}:${sec}${ampm}`
  } catch {
    return isoStr
  }
}

function fmtAmt(n: number): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  data: PrintData
  onClose: () => void
}

export default function PrintBudgetReport({ data, onClose }: Props) {
  const isPrimary = data.type === 'primary'

  const typeHeading = isPrimary
    ? 'प्राथमिक प्रशासकीय मान्यता लेखाशीर्ष तरतूद नोंद'
    : 'अंतिम प्रशासकीय मान्यता लेखाशीर्ष तरतूद नोंद'

  const primaryEntryNo =
    `${data.deptName} / ${data.acSubhead} / ${data.bookEntryNo} / ${data.finYear}`
  const finalEntryNo =
    `${data.deptName} / ${data.acSubhead} / ${data.finalBookEntryNo} / ${data.finYear}`

  // Rows that have the value stacked below the label (full width)
  const stackedRows: [string, string][] = [
    ['विभागाचे नाव', data.deptName],
    ['कामाचे नाव', data.workName],
    ['लेखाशीर्ष क्रमांक व नाव', `${data.acSubhead} - ${data.acSubheadName}`],
  ]

  // Rows that stay side-by-side (label left, value right)
  const inlineRows: [string, string][] = [
    ['लेखाशीर्षातील एकूण अंदाजपत्रकीय तरतूद', fmtAmt(data.budgetAmount)],
    ['लेखाशीर्षांत शिल्लक रक्कम', fmtAmt(data.remainingBefore)],
    ['प्रस्तावित कामाची किंमत', fmtAmt(data.proposedAmount)],
    ['या कामिगरीनंतर लेखाशीर्षांत शिल्लक राहणारी रक्कम', fmtAmt(data.remainingAfter)],
    ['लेखाशीर्ष नोंद दिनांक व वेळ', fmtDatetime(data.entryDate)],
    ['आर्थिक वर्ष', data.finYear],
  ]

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @page { margin: 0; size: A4 portrait; }
        @media print {
          body { visibility: hidden; margin: 0; padding: 0; }
          #budget-print-report-sheet {
            visibility: visible;
            position: fixed; top: 0; left: 0;
            width: 210mm; min-height: 297mm;
            margin: 0; padding: 14mm 16mm 14mm 16mm;
            box-sizing: border-box;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-size: 11.5pt !important;
          }
          #budget-print-report-sheet .no-print { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="no-print"
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(10,26,46,0.70)', backdropFilter: 'blur(5px)',
        }}
        onClick={onClose}
      />

      {/* Scrollable wrapper */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 2001,
          overflowY: 'auto', padding: '32px 16px 60px',
          display: 'flex', justifyContent: 'center',
        }}
      >
        {/* Report sheet — A4 width */}
        <div
          id="budget-print-report-sheet"
          style={{
            background: '#fff',
            width: '210mm',
            minHeight: '297mm',
            padding: '14mm 16mm 14mm 16mm',
            fontFamily: '"Noto Sans Devanagari", "Mangal", "Arial Unicode MS", Arial, sans-serif',
            fontSize: '11.5pt',
            lineHeight: 1.7,
            boxShadow: '0 12px 48px rgba(10,26,46,0.22)',
            borderRadius: 4,
            alignSelf: 'flex-start',
            boxSizing: 'border-box',
          } as React.CSSProperties}
          onClick={e => e.stopPropagation()}
        >
          {/* ── Action buttons (screen only) ── */}
          <div
            className="no-print"
            style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 18 }}
          >
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: '7px 20px', borderRadius: 7, border: 'none',
                background: '#c0392b', color: '#fff', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: '0 2px 8px rgba(192,57,43,0.30)',
              }}
            >
              <i className="bi bi-printer-fill" /> मुद्रित करा
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px', borderRadius: 7,
                border: '1.5px solid #b0bec5', background: '#fff',
                color: '#5e7388', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              बंद करा
            </button>
          </div>

          {/* ── Header ── */}
          <div style={{
            textAlign: 'center',
            borderBottom: '2.5px solid #1a3a5c',
            paddingBottom: '10px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '15pt', fontWeight: 800, color: '#1a3a5c', letterSpacing: '0.02em' }}>
              सांगली मिरज आणि कुपवाड शहर महानगरपालिका
            </div>
            <div style={{ fontSize: '10.5pt', fontWeight: 600, color: '#3d5a7a', marginTop: 2 }}>
              लेखाशीर्ष तरतूद संगणक नोंदवही
            </div>
          </div>

          {/* ── Type heading ── */}
          <div style={{
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            <span style={{
              display: 'inline-block',
              fontSize: '11.5pt', fontWeight: 700,
              color: '#1a3a5c',
              borderBottom: '2px solid #1a3a5c',
              paddingBottom: '2px',
              letterSpacing: '0.01em',
            }}>
              {typeHeading}
            </span>
          </div>

          {/* ── For Final: primary entry reference box ── */}
          {!isPrimary && (
            <div style={{
              marginBottom: '14px',
              padding: '8px 12px',
              background: '#f0f4fa',
              border: '1px solid #c5d4e8',
              borderLeft: '4px solid #1a3a5c',
              borderRadius: 4,
              fontSize: '10.5pt',
            }}>
              <span style={{ fontWeight: 700, color: '#1a3a5c' }}>
                प्राथमिक प्रशासकीय मान्यता लेखाशीर्ष तरतूद नोंद क्रमांक :&nbsp;
              </span>
              <span style={{ fontWeight: 500 }}>{primaryEntryNo}</span>
            </div>
          )}

          {/* ── Stacked section: dept / work / subhead ── */}
          <div style={{
            border: '1px solid #d0dcea',
            borderRadius: 4,
            marginBottom: '12px',
            overflow: 'hidden',
          }}>
            {stackedRows.map(([label, value], i) => (
              <div
                key={label}
                style={{
                  borderBottom: i < stackedRows.length - 1 ? '1px solid #e4edf6' : 'none',
                  padding: '7px 12px',
                  background: i % 2 === 0 ? '#f7fafd' : '#fff',
                }}
              >
                <div style={{ fontSize: '9.5pt', fontWeight: 700, color: '#3d5a7a', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontSize: '11pt', fontWeight: 600, color: '#18324a', lineHeight: 1.5 }}>
                  {value || '—'}
                </div>
              </div>
            ))}
          </div>

          {/* ── Inline amounts / dates section ── */}
          <div style={{
            border: '1px solid #d0dcea',
            borderRadius: 4,
            marginBottom: '14px',
            overflow: 'hidden',
          }}>
            {inlineRows.map(([label, value], i) => {
              const isProposed = label === 'प्रस्तावित कामाची किंमत'
              const isRemaining = label === 'या कामिगरीनंतर लेखाशीर्षांत शिल्लक राहणारी रक्कम'
              return (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    borderBottom: i < inlineRows.length - 1 ? '1px solid #e4edf6' : 'none',
                    padding: '6px 12px',
                    background: isProposed
                      ? '#fff8f0'
                      : isRemaining
                        ? '#f0f7f4'
                        : i % 2 === 0 ? '#f7fafd' : '#fff',
                  }}
                >
                  <div style={{
                    flex: '0 0 62%',
                    fontSize: '10.5pt',
                    fontWeight: isProposed || isRemaining ? 700 : 500,
                    color: isProposed ? '#7a3500' : isRemaining ? '#0a5240' : '#3d5a7a',
                  }}>
                    {label} :
                  </div>
                  <div style={{
                    flex: 1,
                    fontSize: isProposed || isRemaining ? '11.5pt' : '10.5pt',
                    fontWeight: 700,
                    color: isProposed ? '#c0392b' : isRemaining ? '#117a5d' : '#18324a',
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {value}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Entry number (bottom) ── */}
          <div style={{
            padding: '10px 12px',
            background: '#f0f4fa',
            border: '1px solid #c5d4e8',
            borderLeft: '4px solid #c0392b',
            borderRadius: 4,
            fontSize: '10.5pt',
            marginBottom: '32px',
          }}>
            <span style={{ fontWeight: 700, color: '#1a3a5c' }}>
              {isPrimary ? 'प्राथमिक' : 'अंतिम'}{' '}
              प्रशासकीय मान्यता लेखाशीर्ष तरतूद नोंद क्रमांक :&nbsp;
            </span>
            <span style={{ fontWeight: 500 }}>
              {isPrimary ? primaryEntryNo : finalEntryNo}
            </span>
          </div>

          {/* ── Signature ── */}
          <div style={{ textAlign: 'right', fontSize: '10.5pt', marginTop: 8 }}>
            <div style={{ fontWeight: 500, color: '#3d5a7a' }}>नोंद अधिकारी यांची स्वाक्षरी</div>
            <div style={{
              marginTop: 40,
              borderTop: '1.5px solid #1a3a5c',
              width: 200,
              marginLeft: 'auto',
            }} />
          </div>

        </div>
      </div>
    </>
  )
}
