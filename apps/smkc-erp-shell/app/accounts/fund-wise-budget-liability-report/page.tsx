'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'

interface LiabilityDetailRow {
  finYear: string
  acSubhead: string
  acSubheadName: string
  totalBudgetAmount: number
  totalExpenditureAmount: number
  budgetBalanceAmount: number
}

interface FundSummaryRow {
  fundCode: string
  fundName: string
  totalBudgetAmount: number
  totalExpenditureAmount: number
  budgetBalanceAmount: number
  details: LiabilityDetailRow[]
}

interface FundWiseLiabilityPayload {
  fromDate: string
  toDate: string
  funds: FundSummaryRow[]
  grandTotalBudget: number
  grandTotalExpenditure: number
  grandTotalBalance: number
  unmappedBudgetHeadCount: number
}

interface MajorFundCard {
  fundCode: string
  fundName: string
  totalBudgetAmount: number
  totalExpenditureAmount: number
  budgetBalanceAmount: number
  headCount: number
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

const FUND_ROW_ACTION_STYLE: React.CSSProperties = {
  borderRadius: 999,
  padding: '6px 12px',
  fontSize: '0.76rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
}

const DETAIL_METRIC_CARD_STYLE: React.CSSProperties = {
  border: '1px solid #dce7f2',
  borderRadius: 14,
  padding: '14px 16px',
  background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
  boxShadow: '0 3px 10px rgba(15, 23, 42, 0.05)',
  minHeight: 110,
}

function getFundAccent(balanceAmount: number, liabilityAmount: number, budgetAmount: number): { border: string; bg: string; badge: string; text: string } {
  const utilization = budgetAmount > 0 ? liabilityAmount / budgetAmount : 0
  if (balanceAmount <= 0 || utilization >= 0.9) {
    return {
      border: '#ef4444',
      bg: 'linear-gradient(145deg, #fff2f2 0%, #ffe0e0 100%)',
      badge: '#fee2e2',
      text: '#991b1b',
    }
  }
  if (utilization >= 0.6) {
    return {
      border: '#f59e0b',
      bg: 'linear-gradient(145deg, #fff8eb 0%, #ffe6bf 100%)',
      badge: '#fef3c7',
      text: '#92400e',
    }
  }
  return {
    border: '#22c55e',
    bg: 'linear-gradient(145deg, #ebfff4 0%, #d5f7e2 100%)',
    badge: '#dcfce7',
    text: '#166534',
  }
}

export default function FundWiseBudgetLiabilityReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<FundWiseLiabilityPayload | null>(null)
  const [expandedFunds, setExpandedFunds] = useState<Record<string, boolean>>({})
  const [selectedFundCode, setSelectedFundCode] = useState<string>('')
  const [showFundTable, setShowFundTable] = useState(false)

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/accounts/budget-book/fund-wise-liability-report', { cache: 'no-store' })
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: FundWiseLiabilityPayload; message?: string }
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || `Failed to load report (HTTP ${res.status})`)
      }

      setData(json.data)
      setExpandedFunds(Object.fromEntries(json.data.funds.map((fund) => [fund.fundCode, false])))
      setSelectedFundCode(json.data.funds[0]?.fundCode || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load report')
      setData(null)
      setExpandedFunds({})
      setSelectedFundCode('')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const toggleFund = useCallback((fundCode: string) => {
    setExpandedFunds((current) => ({
      ...current,
      [fundCode]: !current[fundCode],
    }))
  }, [])

  const exportCsv = useCallback(() => {
    if (!data || data.funds.length === 0) return

    const header = ['Fund Code', 'Fund Name', 'Financial Year', 'Budget Code', 'Account Head Name', 'Budget Provision', 'Liability Amount', 'Available Balance', 'Row Type']
    const lines: string[] = [header.map(csvEscape).join(',')]

    for (const fund of data.funds) {
      lines.push([fund.fundCode, fund.fundName, '', '', '', fund.totalBudgetAmount, fund.totalExpenditureAmount, fund.budgetBalanceAmount, 'Fund Summary'].map(csvEscape).join(','))
      for (const row of fund.details) {
        lines.push([fund.fundCode, fund.fundName, row.finYear, row.acSubhead, row.acSubheadName || '', row.totalBudgetAmount, row.totalExpenditureAmount, row.budgetBalanceAmount, 'Budget Head'].map(csvEscape).join(','))
      }
    }

    lines.push(['', 'GRAND TOTAL', '', '', '', data.grandTotalBudget, data.grandTotalExpenditure, data.grandTotalBalance, ''].map(csvEscape).join(','))

    const csvContent = '\uFEFF' + lines.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fund-wise-budget-liability-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data])

  const exportExcel = useCallback(async () => {
    if (!data || data.funds.length === 0) return

    const XLSX = await import('xlsx')
    const sheetRows: Array<Array<string | number>> = [['Fund Code', 'Fund Name', 'Financial Year', 'Budget Code', 'Account Head Name', 'Budget Provision', 'Liability Amount', 'Available Balance', 'Row Type']]

    for (const fund of data.funds) {
      sheetRows.push([fund.fundCode, fund.fundName, '', '', '', fund.totalBudgetAmount, fund.totalExpenditureAmount, fund.budgetBalanceAmount, 'Fund Summary'])
      for (const row of fund.details) {
        sheetRows.push([fund.fundCode, fund.fundName, row.finYear, row.acSubhead, row.acSubheadName || '', row.totalBudgetAmount, row.totalExpenditureAmount, row.budgetBalanceAmount, 'Budget Head'])
      }
    }

    sheetRows.push(['', 'GRAND TOTAL', '', '', '', data.grandTotalBudget, data.grandTotalExpenditure, data.grandTotalBalance, ''])

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows)
    worksheet['!cols'] = [{ wch: 14 }, { wch: 26 }, { wch: 14 }, { wch: 14 }, { wch: 58 }, { wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 14 }]
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fund Liability Report')
    XLSX.writeFile(workbook, `fund-wise-budget-liability-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data])

  const fundCountLabel = useMemo(() => {
    if (!data) return '0 funds'
    return `${data.funds.length} funds`
  }, [data])

  const selectedFund = useMemo(() => {
    if (!data || data.funds.length === 0) return null
    return data.funds.find((fund) => fund.fundCode === selectedFundCode) || data.funds[0]
  }, [data, selectedFundCode])

  const majorFunds = useMemo<MajorFundCard[]>(() => {
    if (!data) return []
    return [...data.funds]
      .sort((a, b) => b.totalExpenditureAmount - a.totalExpenditureAmount)
      .slice(0, 4)
      .map((fund) => ({
        fundCode: fund.fundCode,
        fundName: fund.fundName,
        totalBudgetAmount: fund.totalBudgetAmount,
        totalExpenditureAmount: fund.totalExpenditureAmount,
        budgetBalanceAmount: fund.budgetBalanceAmount,
        headCount: fund.details.length,
      }))
  }, [data])

  const allFundCards = useMemo<MajorFundCard[]>(() => {
    if (!data) return []
    return [...data.funds]
      .sort((a, b) => b.totalExpenditureAmount - a.totalExpenditureAmount)
      .map((fund) => ({
        fundCode: fund.fundCode,
        fundName: fund.fundName,
        totalBudgetAmount: fund.totalBudgetAmount,
        totalExpenditureAmount: fund.totalExpenditureAmount,
        budgetBalanceAmount: fund.budgetBalanceAmount,
        headCount: fund.details.length,
      }))
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
            <span className="dash-breadcrumb-current">Fund-wise Budget Liability Report</span>
          </nav>

          <div style={{ background: 'linear-gradient(135deg, #1a3a5c 0%, #112540 100%)', padding: '22px 28px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, marginBottom: 14, boxShadow: '0 4px 20px rgba(26,58,92,0.30)' }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-diagram-3-fill" style={{ fontSize: '1.5rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accounts Department</div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Fund-wise Budget Liability Report</h1>
              <div style={{ fontSize: '0.88rem', opacity: 0.92 }}>Existing budget liability figures grouped by mapped fund master.</div>
            </div>
            <button type="button" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '6px 11px', cursor: 'pointer', fontSize: '0.85rem' }} onClick={() => setSidebarOpen(v => !v)}>
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
              <button type="button" style={ACTION_REFRESH_STYLE} onClick={loadReport} disabled={loading}><i className="bi bi-arrow-clockwise me-1" /> Refresh</button>
              <button type="button" style={ACTION_EXCEL_STYLE} onClick={exportExcel} disabled={!data || data.funds.length === 0}><i className="bi bi-file-earmark-excel me-1" /> Export Excel (.xlsx)</button>
              <button type="button" style={ACTION_CSV_STYLE} onClick={exportCsv} disabled={!data || data.funds.length === 0}><i className="bi bi-file-earmark-spreadsheet me-1" /> Export CSV</button>
              <button type="button" style={ACTION_PRINT_STYLE} onClick={() => window.print()} disabled={!data || data.funds.length === 0}><i className="bi bi-printer me-1" /> Print A4 / Save PDF</button>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ background: '#ecfdf3', color: '#1f5137', border: '1px solid #ccefd9', borderRadius: 999, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{fundCountLabel}</span>
            </div>
          </div>

          {!loading && !error && data && (
            <div style={KPI_GRID_STYLE}>
              <div style={KPI_CARD_STYLE}><div style={KPI_LABEL_STYLE}>Total Funds</div><div style={KPI_VALUE_STYLE}>{data.funds.length}</div></div>
              <div style={KPI_CARD_STYLE}><div style={KPI_LABEL_STYLE}>Total Heads</div><div style={KPI_VALUE_STYLE}>{data.funds.reduce((total, fund) => total + fund.details.length, 0)}</div></div>
              <div style={KPI_CARD_STYLE}><div style={KPI_LABEL_STYLE}>Total Liability</div><div style={KPI_VALUE_STYLE}>{fmtCompactInr(data.grandTotalExpenditure)}</div></div>
              <div style={KPI_CARD_STYLE}><div style={KPI_LABEL_STYLE}>Unmapped Heads</div><div style={KPI_VALUE_STYLE}>{data.unmappedBudgetHeadCount}</div></div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', padding: '12px 24px 28px 24px' }}>
          <section className="card p-3 p-md-4 shadow-sm border-0" id="fund-wise-liability-report-sheet" style={{ borderRadius: 12, background: '#fff' }}>
            {loading && <div className="alert alert-info mb-0">Loading report...</div>}
            {!loading && error && <div className="alert alert-danger mb-0">{error}</div>}

            {!loading && !error && data && (
              <>
                {majorFunds.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#16324f' }}>Top Funds Snapshot</h2>
                        <div style={{ marginTop: 2, fontSize: '0.82rem', color: '#64748b' }}>Largest liability funds at a glance. Click any card to jump to its detail report.</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                      {majorFunds.map((fund) => {
                        const active = selectedFund?.fundCode === fund.fundCode
                        const accent = getFundAccent(fund.budgetBalanceAmount, fund.totalExpenditureAmount, fund.totalBudgetAmount)
                        return (
                          <button
                            key={`major-${fund.fundCode}`}
                            type="button"
                            onClick={() => setSelectedFundCode(fund.fundCode)}
                            style={{
                              border: `1px solid ${active ? accent.border : '#d9e2ec'}`,
                              background: active ? accent.bg : 'linear-gradient(145deg, #ffffff 0%, #f6f9fc 100%)',
                              borderRadius: 14,
                              padding: 14,
                              textAlign: 'left',
                              cursor: 'pointer',
                              boxShadow: active ? '0 10px 24px rgba(15, 23, 42, 0.10)' : '0 4px 10px rgba(15, 23, 42, 0.05)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                              transform: active ? 'translateY(-2px)' : 'translateY(0)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.03em', color: '#1f3a56' }}>{fund.fundCode}</span>
                              <span style={{ background: active ? accent.badge : '#eef5fb', color: active ? accent.text : '#334e68', borderRadius: 999, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
                                {fund.headCount} heads
                              </span>
                            </div>
                            <div style={{ marginTop: 5, fontSize: '0.83rem', fontWeight: 700, color: '#334155', minHeight: 38 }}>{fund.fundName}</div>
                            <div style={{ marginTop: 8, fontSize: '1.1rem', fontWeight: 800, color: '#16324f' }}>{fmtCompactInr(fund.totalExpenditureAmount)}</div>
                            <div style={{ marginTop: 8, display: 'grid', gap: 3 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#5e7388' }}><span>Provision</span><span>{fmtCompactInr(fund.totalBudgetAmount)}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#5e7388' }}><span>Balance</span><span>{fmtCompactInr(fund.budgetBalanceAmount)}</span></div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {allFundCards.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#16324f' }}>All Funds Overview</h2>
                        <div style={{ marginTop: 2, fontSize: '0.82rem', color: '#64748b' }}>Primary navigation view for fund selection. Choose any fund card to open its detail report below.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFundTable((current) => !current)}
                        style={{
                          ...FUND_ROW_ACTION_STYLE,
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          color: '#334155',
                        }}
                      >
                        <i className={`bi ${showFundTable ? 'bi-table' : 'bi-layout-text-window-reverse'}`} />
                        {showFundTable ? 'Hide Summary Table' : 'Show Summary Table'}
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
                      {allFundCards.map((fund) => {
                        const active = selectedFund?.fundCode === fund.fundCode
                        const accent = getFundAccent(fund.budgetBalanceAmount, fund.totalExpenditureAmount, fund.totalBudgetAmount)
                        return (
                          <button
                            key={`fund-card-${fund.fundCode}`}
                            type="button"
                            onClick={() => setSelectedFundCode(fund.fundCode)}
                            style={{
                              border: `1px solid ${active ? accent.border : '#d9e2ec'}`,
                              background: active ? accent.bg : 'linear-gradient(145deg, #ffffff 0%, #f8fbff 100%)',
                              borderRadius: 14,
                              padding: 14,
                              textAlign: 'left',
                              cursor: 'pointer',
                              boxShadow: active ? '0 10px 24px rgba(15, 23, 42, 0.10)' : '0 4px 10px rgba(15, 23, 42, 0.05)',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                              transform: active ? 'translateY(-2px)' : 'translateY(0)',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.03em', color: '#1f3a56' }}>{fund.fundCode}</span>
                              <span style={{ background: active ? accent.badge : '#eef5fb', color: active ? accent.text : '#334e68', borderRadius: 999, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700 }}>
                                {fund.headCount} heads
                              </span>
                            </div>
                            <div style={{ marginTop: 5, fontSize: '0.82rem', fontWeight: 700, color: '#334155', minHeight: 38 }}>{fund.fundName}</div>
                            <div style={{ marginTop: 8, fontSize: '1.02rem', fontWeight: 800, color: '#16324f' }}>{fmtCompactInr(fund.totalExpenditureAmount)}</div>
                            <div style={{ marginTop: 8, display: 'grid', gap: 3 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#5e7388' }}><span>Provision</span><span>{fmtCompactInr(fund.totalBudgetAmount)}</span></div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: '#5e7388' }}><span>Balance</span><span>{fmtCompactInr(fund.budgetBalanceAmount)}</span></div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {data.unmappedBudgetHeadCount > 0 && (
                  <div className="alert alert-warning no-print" role="alert">
                    {data.unmappedBudgetHeadCount} budget head(s) are not mapped to any fund in the master and are shown under Fund Not Mapped.
                  </div>
                )}

                {showFundTable && (
                <div className="table-responsive" style={{ maxHeight: '58vh', overflow: 'auto', border: '1px solid #e0eaf2', borderRadius: 10, marginBottom: 16 }}>
                  <table className="table table-bordered align-middle mb-0 report-table" style={{ minWidth: 1160 }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ minWidth: 130, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Fund Code</th>
                        <th style={{ minWidth: 260, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Fund Name</th>
                        <th className="text-end" style={{ minWidth: 120, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Head Count</th>
                        <th className="text-end" style={{ minWidth: 160, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Budget Provision</th>
                        <th className="text-end" style={{ minWidth: 160, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Liability Amount</th>
                        <th className="text-end" style={{ minWidth: 160, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Available Balance</th>
                        <th className="no-print" style={{ minWidth: 190, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.funds.length === 0 && <tr><td colSpan={7} className="text-center text-muted py-4">No records found for the selected period.</td></tr>}
                      {data.funds.map((fund) => {
                        const isExpanded = expandedFunds[fund.fundCode] ?? false
                        const fundGroupKey = `${fund.fundCode}-${fund.fundName}`
                        return (
                          <Fragment key={`group-${fundGroupKey}`}>
                            <tr className="table-group-divider fund-summary-row" style={{ background: selectedFund?.fundCode === fund.fundCode ? '#eefaf2' : '#f7fbff' }}>
                              <td className="fw-semibold">{fund.fundCode}</td>
                              <td className="fw-semibold">{fund.fundName}</td>
                              <td className="text-end fw-semibold">{fund.details.length}</td>
                              <td className="text-end fw-semibold">{fmtAmount(fund.totalBudgetAmount)}</td>
                              <td className="text-end fw-semibold">{fmtAmount(fund.totalExpenditureAmount)}</td>
                              <td className="text-end fw-semibold">{fmtAmount(fund.budgetBalanceAmount)}</td>
                              <td className="no-print">
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                  <button
                                    type="button"
                                    onClick={() => toggleFund(fund.fundCode)}
                                    style={{
                                      ...FUND_ROW_ACTION_STYLE,
                                      border: '1px solid #60a5fa',
                                      background: isExpanded ? '#dbeafe' : '#eff6ff',
                                      color: '#1d4ed8',
                                    }}
                                  >
                                    <i className={`bi ${isExpanded ? 'bi-dash-square-fill' : 'bi-plus-square-fill'}`} />
                                    {isExpanded ? 'Hide Heads' : 'Show Heads'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFundCode(fund.fundCode)}
                                    style={{
                                      ...FUND_ROW_ACTION_STYLE,
                                      border: selectedFund?.fundCode === fund.fundCode ? '1px solid #15803d' : '1px solid #cbd5e1',
                                      background: selectedFund?.fundCode === fund.fundCode ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : '#ffffff',
                                      color: selectedFund?.fundCode === fund.fundCode ? '#ffffff' : '#334155',
                                    }}
                                  >
                                    <i className={`bi ${selectedFund?.fundCode === fund.fundCode ? 'bi-check-circle-fill' : 'bi-bar-chart-line-fill'}`} />
                                    {selectedFund?.fundCode === fund.fundCode ? 'Selected' : 'View Report'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && fund.details.map((row, idx) => (
                              <tr key={`detail-${fundGroupKey}-${row.finYear}-${row.acSubhead}-${idx}`} className="detail-row">
                                <td className="text-muted">{fund.fundCode}</td>
                                <td>
                                  <div className="fw-semibold">{row.acSubhead}</div>
                                  <div className="small text-muted">{row.finYear}</div>
                                  <div style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.acSubheadName || '—'}</div>
                                </td>
                                <td className="text-end text-muted">1</td>
                                <td className="text-end">{fmtAmount(row.totalBudgetAmount)}</td>
                                <td className="text-end">{fmtAmount(row.totalExpenditureAmount)}</td>
                                <td className="text-end">{fmtAmount(row.budgetBalanceAmount)}</td>
                                <td className="no-print text-muted small">Budget Head</td>
                              </tr>
                            ))}
                          </Fragment>
                        )
                      })}
                    </tbody>
                    <tfoot className="table-secondary fw-bold">
                      <tr>
                        <td colSpan={2}>GRAND TOTAL</td>
                        <td className="text-end">{data.funds.reduce((total, fund) => total + fund.details.length, 0)}</td>
                        <td className="text-end">{fmtAmount(data.grandTotalBudget)}</td>
                        <td className="text-end">{fmtAmount(data.grandTotalExpenditure)}</td>
                        <td className="text-end">{fmtAmount(data.grandTotalBalance)}</td>
                        <td className="no-print" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                )}

                {selectedFund && (
                  <div className="mt-4" style={{ border: '1px solid #dce7f2', borderRadius: 16, padding: 18, background: 'linear-gradient(180deg, #fbfdff 0%, #f5f9ff 100%)', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.05)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: '0.74rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5e7388' }}>Selected Fund Overview</div>
                        <h2 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', fontWeight: 800, color: '#17324d' }}>{selectedFund.fundCode} - {selectedFund.fundName}</h2>
                        <div style={{ marginTop: 4, fontSize: '0.86rem', color: '#64748b' }}>Budget head-wise detail for the selected fund in a quick-summary card view.</div>
                      </div>
                      <div className="no-print" style={{ minWidth: 260, flex: '1 1 260px', maxWidth: 360 }}>
                        <label style={LABEL_STYLE} htmlFor="fund-report-select">Select Fund</label>
                        <select id="fund-report-select" className="form-select" style={{ minWidth: 220, borderRadius: 12, borderColor: '#c8d8e8', boxShadow: 'none' }} value={selectedFund.fundCode} onChange={(event) => setSelectedFundCode(event.target.value)}>
                          {data.funds.map((fund) => <option key={`select-${fund.fundCode}-${fund.fundName}`} value={fund.fundCode}>{fund.fundCode} - {fund.fundName}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 16 }}>
                      <div style={DETAIL_METRIC_CARD_STYLE}>
                        <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', fontWeight: 700 }}>Total Heads</div>
                        <div style={{ marginTop: 8, fontSize: '1.55rem', fontWeight: 800, color: '#17324d' }}>{selectedFund.details.length}</div>
                        <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#64748b' }}>Budget heads mapped under this fund</div>
                      </div>
                      <div style={DETAIL_METRIC_CARD_STYLE}>
                        <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', fontWeight: 700 }}>Budget Provision</div>
                        <div style={{ marginTop: 8, fontSize: '1.35rem', fontWeight: 800, color: '#17324d' }}>{fmtCompactInr(selectedFund.totalBudgetAmount)}</div>
                        <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#64748b' }}>{fmtAmount(selectedFund.totalBudgetAmount)}</div>
                      </div>
                      <div style={DETAIL_METRIC_CARD_STYLE}>
                        <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', fontWeight: 700 }}>Liability Amount</div>
                        <div style={{ marginTop: 8, fontSize: '1.35rem', fontWeight: 800, color: '#7c2d12' }}>{fmtCompactInr(selectedFund.totalExpenditureAmount)}</div>
                        <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#64748b' }}>{fmtAmount(selectedFund.totalExpenditureAmount)}</div>
                      </div>
                      <div style={DETAIL_METRIC_CARD_STYLE}>
                        <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', fontWeight: 700 }}>Available Balance</div>
                        <div style={{ marginTop: 8, fontSize: '1.35rem', fontWeight: 800, color: '#166534' }}>{fmtCompactInr(selectedFund.budgetBalanceAmount)}</div>
                        <div style={{ marginTop: 4, fontSize: '0.82rem', color: '#64748b' }}>{fmtAmount(selectedFund.budgetBalanceAmount)}</div>
                      </div>
                    </div>

                    <div className="table-responsive" style={{ maxHeight: '46vh', overflow: 'auto', border: '1px solid #e0eaf2', borderRadius: 10 }}>
                      <table className="table table-sm table-bordered align-middle mb-0 report-table">
                        <thead className="table-light">
                          <tr>
                            <th style={{ minWidth: 70, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Sr No.</th>
                            <th style={{ minWidth: 120, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Financial Year</th>
                            <th style={{ minWidth: 120, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Budget Code</th>
                            <th style={{ minWidth: 380, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Budget Head</th>
                            <th className="text-end" style={{ minWidth: 150, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Budget Provision</th>
                            <th className="text-end" style={{ minWidth: 150, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Liability Amount</th>
                            <th className="text-end" style={{ minWidth: 150, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Available Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFund.details.map((row, idx) => (
                            <tr key={`report-row-${selectedFund.fundCode}-${row.finYear}-${row.acSubhead}-${idx}`}>
                              <td>{idx + 1}</td>
                              <td>{row.finYear}</td>
                              <td>{row.acSubhead}</td>
                              <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.acSubheadName || '—'}</td>
                              <td className="text-end">{fmtAmount(row.totalBudgetAmount)}</td>
                              <td className="text-end">{fmtAmount(row.totalExpenditureAmount)}</td>
                              <td className="text-end">{fmtAmount(row.budgetBalanceAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="table-secondary fw-bold">
                          <tr>
                            <td colSpan={4}>FUND TOTAL ({selectedFund.fundCode})</td>
                            <td className="text-end">{fmtAmount(selectedFund.totalBudgetAmount)}</td>
                            <td className="text-end">{fmtAmount(selectedFund.totalExpenditureAmount)}</td>
                            <td className="text-end">{fmtAmount(selectedFund.budgetBalanceAmount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <style jsx global>{`
        .report-table tbody tr:nth-child(even) td {
          background: #fbfdff;
        }

        .fund-summary-row {
          background: #f7fbff;
        }

        .detail-row td {
          background: #fff;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          body * {
            visibility: hidden !important;
          }

          #fund-wise-liability-report-sheet,
          #fund-wise-liability-report-sheet * {
            visibility: visible !important;
          }

          #fund-wise-liability-report-sheet {
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
            font-size: 9pt !important;
            padding: 5px 7px !important;
          }
        }
      `}</style>
    </div>
  )
}