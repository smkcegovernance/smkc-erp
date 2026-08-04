'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'

interface LiabilityRow {
  finYear: string
  acSubhead: string
  acSubheadName: string
  totalBudgetAmount: number
  totalExpenditureAmount: number
  budgetBalanceAmount: number
}

interface LiabilityPayload {
  fromDate: string
  toDate: string
  rows: LiabilityRow[]
  grandTotalBudget: number
  grandTotalExpenditure: number
  grandTotalBalance: number
}

function fmtAmount(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function fmtCompactInr(value: number): string {
  const amount = Number(value || 0)
  const abs = Math.abs(amount)

  if (abs >= 10000000) return `Rs ${(amount / 10000000).toFixed(abs >= 100000000 ? 1 : 2)} Cr`
  if (abs >= 100000) return `Rs ${(amount / 100000).toFixed(abs >= 1000000 ? 1 : 2)} L`
  return `Rs ${fmtAmount(amount)}`
}

function fmtDate(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function csvEscape(value: string | number): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 600, color: '#5e7388',
}

const KPI_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 10,
}

const KPI_CARD_STYLE: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #dce7f2',
  borderRadius: 10,
  padding: '9px 12px',
  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
}

const KPI_LABEL_STYLE: React.CSSProperties = {
  fontSize: '0.72rem',
  color: '#5d6b7b',
  fontWeight: 600,
  letterSpacing: '0.02em',
}

const KPI_VALUE_STYLE: React.CSSProperties = {
  marginTop: 2,
  fontSize: '1.1rem',
  fontWeight: 800,
  color: '#1e3a56',
  lineHeight: 1.2,
}

const STICKY_TOP_PANEL_STYLE: React.CSSProperties = {
  position: 'relative',
  zIndex: 60,
  background: '#f0f4f8',
  borderBottom: '1px solid #dbe6ef',
  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.08)',
  paddingTop: 8,
  paddingBottom: 12,
  paddingLeft: 24,
  paddingRight: 24,
  isolation: 'isolate',
  flexShrink: 0,
}

const ACTION_BUTTON_BASE: React.CSSProperties = {
  borderRadius: 10,
  border: 'none',
  padding: '10px 16px',
  fontSize: '0.9rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
}

const ACTION_REFRESH_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  color: '#ffffff',
  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
}

const ACTION_EXCEL_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  color: '#ffffff',
  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
}

const ACTION_CSV_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  color: '#0b5d3f',
  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
  border: '1px solid #6ee7b7',
}

const ACTION_PRINT_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  color: '#ffffff',
  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
}

export default function BudgetLiabilityReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LiabilityPayload | null>(null)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/accounts/budget-book/liability-report', { cache: 'no-store' })
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: LiabilityPayload; message?: string }
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || `Failed to load report (HTTP ${res.status})`)
      }
      setData(json.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const exportCsv = useCallback(() => {
    if (!data || data.rows.length === 0) return

    const header = [
      'Financial Year',
      'Budget Code',
      'Account Head Name',
      'Total Budget Amount',
      'Total Expenditure Amount',
      'Budget Balance Amount',
    ]

    const lines: string[] = []
    lines.push(header.map(csvEscape).join(','))
    for (const row of data.rows) {
      lines.push([
        row.finYear,
        row.acSubhead,
        row.acSubheadName || '',
        row.totalBudgetAmount,
        row.totalExpenditureAmount,
        row.budgetBalanceAmount,
      ].map(csvEscape).join(','))
    }

    lines.push([
      '',
      '',
      'GRAND TOTAL',
      data.grandTotalBudget,
      data.grandTotalExpenditure,
      data.grandTotalBalance,
    ].map(csvEscape).join(','))

    const csvContent = '\uFEFF' + lines.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `budget-liability-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data])

  const exportExcel = useCallback(async () => {
    if (!data || data.rows.length === 0) return

    const XLSX = await import('xlsx')

    const sheetRows: Array<Array<string | number>> = [
      ['Financial Year', 'Budget Code', 'Account Head Name', 'Total Budget Amount', 'Total Expenditure Amount', 'Budget Balance Amount'],
      ...data.rows.map((row) => [
        row.finYear,
        row.acSubhead,
        row.acSubheadName || '',
        row.totalBudgetAmount,
        row.totalExpenditureAmount,
        row.budgetBalanceAmount,
      ]),
      ['', '', 'GRAND TOTAL', data.grandTotalBudget, data.grandTotalExpenditure, data.grandTotalBalance],
    ]

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows)
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 58 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Liability Report')
    XLSX.writeFile(workbook, `budget-liability-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data])

  const rowCountLabel = useMemo(() => {
    if (!data) return '0 rows'
    return `${data.rows.length} rows`
  }, [data])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI', 'Noto Sans Devanagari', sans-serif" }}>
      <DeptSidebar deptKey="accounts" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />

      <main style={{ flex: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={STICKY_TOP_PANEL_STYLE}>
          <nav className="dash-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="dash-breadcrumb-home">
              <i className="bi bi-house-door-fill" aria-hidden="true" /> Home
            </Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <Link href="/accounts/dashboard" className="dash-breadcrumb-home">Accounts</Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <span className="dash-breadcrumb-current">Budget Liability Report</span>
          </nav>

          <div style={{
            background: 'linear-gradient(135deg, #1a3a5c 0%, #112540 100%)',
            borderRadius: 16,
            padding: '22px 28px',
            marginBottom: 14,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 20px rgba(26,58,92,0.30)',
          }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-file-earmark-bar-graph-fill" style={{ fontSize: '1.5rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Accounts Department
              </div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                Budget Liability Report
              </h1>
              <div style={{ fontSize: '0.88rem', opacity: 0.92 }}>
                ABAS budget entry based expenditure from 1-Apr to current date.
              </div>
            </div>
            <button
              type="button"
              style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.16)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                borderRadius: 8,
                padding: '6px 11px',
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
              onClick={() => setSidebarOpen(v => !v)}
            >
              <i className={`bi bi-layout-sidebar${sidebarOpen ? '-reverse' : ''}`} />
            </button>
          </div>

          <div className="filters-panel no-print">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12 }}>
              <div>
                <label style={LABEL_STYLE}>Report Period</label>
                <div style={{ background: '#eef5fb', color: '#334e68', border: '1px solid #d7e3ef', borderRadius: 10, padding: '9px 12px', fontSize: '0.86rem', fontWeight: 700 }}>
                  {fmtDate(data?.fromDate || '')} to {fmtDate(data?.toDate || '')}
                </div>
              </div>
              <button type="button" style={ACTION_REFRESH_STYLE} onClick={loadReport} disabled={loading}>
                <i className="bi bi-arrow-clockwise me-1" /> Refresh
              </button>
              <button type="button" style={ACTION_EXCEL_STYLE} onClick={exportExcel} disabled={!data || data.rows.length === 0}>
                <i className="bi bi-file-earmark-excel me-1" /> Export Excel (.xlsx)
              </button>
              <button type="button" style={ACTION_CSV_STYLE} onClick={exportCsv} disabled={!data || data.rows.length === 0}>
                <i className="bi bi-file-earmark-spreadsheet me-1" /> Export CSV
              </button>
              <button type="button" style={ACTION_PRINT_STYLE} onClick={() => window.print()} disabled={!data || data.rows.length === 0}>
                <i className="bi bi-printer me-1" /> Print A4 / Save PDF
              </button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ background: '#ecfdf3', color: '#1f5137', border: '1px solid #ccefd9', borderRadius: 999, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                {rowCountLabel}
              </span>
            </div>
          </div>

          {!loading && !error && data && (
            <div style={KPI_GRID_STYLE}>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Budget Heads</div>
                <div style={KPI_VALUE_STYLE}>{data.rows.length}</div>
              </div>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Budget Provision</div>
                <div style={KPI_VALUE_STYLE}>{fmtCompactInr(data.grandTotalBudget)}</div>
              </div>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Actual Expenditure</div>
                <div style={KPI_VALUE_STYLE}>{fmtCompactInr(data.grandTotalExpenditure)}</div>
              </div>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Available Balance</div>
                <div style={KPI_VALUE_STYLE}>{fmtCompactInr(data.grandTotalBalance)}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', padding: '12px 24px 28px 24px' }}>
        <section className="card p-3 p-md-4 shadow-sm border-0" id="liability-report-sheet" style={{ borderRadius: 12, background: '#fff' }}>

          {loading && <div className="alert alert-info mb-0">Loading report...</div>}
          {!loading && error && <div className="alert alert-danger mb-0">{error}</div>}

          {!loading && !error && data && (
            <>
              <div className="table-responsive" style={{ maxHeight: '58vh', overflow: 'auto', border: '1px solid #e0eaf2', borderRadius: 10 }}>
                <table className="table table-bordered align-middle mb-0 report-table" style={{ minWidth: 980 }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: 110, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Financial Year</th>
                      <th style={{ minWidth: 110, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Budget Code</th>
                      <th style={{ minWidth: 360, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Account Head Name</th>
                      <th className="text-end" style={{ minWidth: 160, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Total Budget Amount</th>
                      <th className="text-end" style={{ minWidth: 170, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Total Expenditure</th>
                      <th className="text-end" style={{ minWidth: 160, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Budget Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">No records found for the selected period.</td>
                      </tr>
                    )}
                    {data.rows.map((row, idx) => (
                      <tr key={`${row.finYear}-${row.acSubhead}-${idx}`}>
                        <td>{row.finYear}</td>
                        <td>{row.acSubhead}</td>
                        <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.acSubheadName || '—'}</td>
                        <td className="text-end">{fmtAmount(row.totalBudgetAmount)}</td>
                        <td className="text-end">{fmtAmount(row.totalExpenditureAmount)}</td>
                        <td className="text-end fw-semibold">{fmtAmount(row.budgetBalanceAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan={3}>GRAND TOTAL</td>
                      <td className="text-end">{fmtAmount(data.grandTotalBudget)}</td>
                      <td className="text-end">{fmtAmount(data.grandTotalExpenditure)}</td>
                      <td className="text-end">{fmtAmount(data.grandTotalBalance)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>
        </div>
      </main>

      <style jsx global>{`
        .report-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 10px;
        }

        .report-kpi-card {
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          border: 1px solid #d9e6f4;
          border-radius: 10px;
          padding: 10px 12px;
        }

        .report-kpi-label {
          font-size: 0.75rem;
          color: #5d6b7b;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .report-kpi-value {
          margin-top: 4px;
          font-size: 1.05rem;
          font-weight: 700;
          color: #16324f;
        }

        .report-table thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background: #eff4fa;
        }

        .report-table tbody tr:nth-child(even) td {
          background: #fbfdff;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #liability-report-sheet,
          #liability-report-sheet * {
            visibility: visible !important;
          }
          #liability-report-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: 1px solid #d0d7de !important;
          }
          .no-print {
            display: none !important;
          }
          .report-table th,
          .report-table td {
            font-size: 10pt !important;
            padding: 6px 8px !important;
          }

          .report-kpi-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }

          .report-kpi-card {
            border-color: #d0d7de !important;
            background: #fff !important;
          }
        }
      `}</style>
    </div>
  )
}
