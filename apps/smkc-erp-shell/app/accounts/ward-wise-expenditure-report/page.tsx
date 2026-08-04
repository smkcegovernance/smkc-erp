'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DeptSidebar from '@/app/components/DeptSidebar'

interface DeptOption {
  deptCode: number
  deptName: string
  deptNameLL?: string
  deptNameLLUnicode?: string
}

interface WardWiseExpenditureRow {
  finYear: string
  deptName: string
  nastiNo: number
  bookEntryNo?: number
  finalBookEntryNo?: number
  workName: string
  wardNo: string
  proposedCost: number
  budgetHeadCode: string
  budgetHeadName: string
  fundName: string
}

function displayEntryNo(value: number | undefined): string {
  return value && value > 0 ? String(value) : '—'
}

function hasValidBudgetEntry(row: WardWiseExpenditureRow): boolean {
  const book = Number(row.bookEntryNo || 0)
  const finalBook = Number(row.finalBookEntryNo || 0)
  return book > 0 || finalBook > 0
}

function dedupeEntryRows(rows: WardWiseExpenditureRow[]): { rows: WardWiseExpenditureRow[]; removed: number } {
  const unique: WardWiseExpenditureRow[] = []
  const seen = new Set<string>()

  for (const row of rows || []) {
    const finYear = (row.finYear || '').trim()
    const deptName = (row.deptName || '').trim().toLowerCase()
    const nastiNo = Number(row.nastiNo || 0)
    const bookEntryNo = Number(row.bookEntryNo || 0)
    const finalBookEntryNo = Number(row.finalBookEntryNo || 0)

    const key = `${finYear}|${deptName}|${nastiNo}|${bookEntryNo}|${finalBookEntryNo}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    unique.push(row)
  }

  return {
    rows: unique,
    removed: Math.max(0, (rows || []).length - unique.length),
  }
}

interface WardWiseExpenditurePayload {
  fromDate: string
  toDate: string
  finYear: string
  wardNo: string | null
  wardScope?: string
  deptNameFilter?: string | null
  rows: WardWiseExpenditureRow[]
  totalProposedCost: number
}

interface WardCard {
  key: string
  label: string
  amount: number
  count: number
  generalAmount: number
  generalCount: number
  otherAmount: number
  otherCount: number
  wardValue: string
  wardScope: string
}

interface PartyLeaderHeadCard {
  code: string
  name: string
  amount: number
  count: number
}

const PARTY_LEADER_BUDGET_HEADS: Array<{ code: string; name: string }> = [
  { code: 'E-2011', name: 'मा. महापौर निधी' },
  { code: 'E-2012', name: 'मा. उपमहापौर निधी' },
  { code: 'E-2013', name: 'मा. सभापती स्था. समिती निधी' },
  { code: 'E-2015', name: 'मा.सभागृह नेता' },
  { code: 'E-2016', name: 'मा.विरोधी गट नेता निधी' },
  { code: 'E-2018', name: 'सर्व सन्मा.सदस्य 30 लक्ष प्रमाणे (मा.पदाधिकारीसोडून)' },
  { code: 'E-2019', name: 'मा.सभागृह गट नेता (श.प.)' },
  { code: 'E-2020', name: 'मा.सभागृह गट नेता (अ.प.)' },
  { code: 'E-2021', name: 'मा.सभागृह गट नेता (शिवसेना)' },
]

function normalizeWardRaw(value: string): string {
  return (value || '').replace(/\s+/g, '').toUpperCase()
}

function parseWardNumber(value: string): number | null {
  const normalized = normalizeWardRaw(value)
  if (!/^\d+$/.test(normalized)) return null
  const wardNo = parseInt(normalized, 10)
  if (wardNo < 1 || wardNo > 20) return null
  return wardNo
}

function extractWardList(value: string): number[] {
  const normalized = normalizeWardRaw(value)
  if (!normalized) return []

  if (/^\d+$/.test(normalized)) {
    const wardNo = parseWardNumber(normalized)
    return wardNo === null ? [] : [wardNo]
  }

  if (/^\d+(,\d+)+$/.test(normalized)) {
    const unique = new Set<number>()
    for (const token of normalized.split(',')) {
      const wardNo = parseWardNumber(token)
      if (wardNo !== null) unique.add(wardNo)
    }
    return Array.from(unique).sort((a, b) => a - b)
  }

  if (/^\d+-\d+$/.test(normalized)) {
    const parts = normalized.split('-').map((v) => parseInt(v, 10))
    const start = Number.isNaN(parts[0]) ? 0 : parts[0]
    const end = Number.isNaN(parts[1]) ? 0 : parts[1]
    if (start < 1 || end < 1 || start > 20 || end > 20 || start > end) return []
    const wards: number[] = []
    for (let i = start; i <= end; i++) wards.push(i)
    return wards
  }

  return []
}

function isAllWardsPattern(value: string): boolean {
  const normalized = normalizeWardRaw(value)
  if (!normalized) return false

  if (/^(ALL|ALLWARD|ALLWARDS|1TO20|1-20)$/.test(normalized)) {
    return true
  }

  const wardList = extractWardList(normalized)
  if (wardList.length > 0) {
    const unique = new Set(wardList)
    if (unique.size === 20) {
      for (let i = 1; i <= 20; i++) {
        if (!unique.has(i)) return false
      }
      return true
    }
  }

  return false
}

function isMultiWardValue(value: string): boolean {
  const normalized = normalizeWardRaw(value)
  if (isAllWardsPattern(normalized)) return false
  return extractWardList(normalized).length > 1
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

  if (abs >= 10000000) {
    return `Rs ${(amount / 10000000).toFixed(abs >= 100000000 ? 1 : 2)} Cr`
  }
  if (abs >= 100000) {
    return `Rs ${(amount / 100000).toFixed(abs >= 1000000 ? 1 : 2)} L`
  }
  return `Rs ${fmtAmount(amount)}`
}

function wardDisplayLabel(value: string): string {
  const normalized = normalizeWardRaw(value)
  if (isAllWardsPattern(normalized)) return 'Other/NA Ward'
  const wardList = extractWardList(normalized)
  if (wardList.length === 1) return String(wardList[0])
  if (wardList.length > 1) return wardList.join(',')
  return 'Other/NA Ward'
}

function normalizeFundName(value: string): string {
  return (value || '').trim()
}

function normalizeBudgetHeadCode(value: string): string {
  return (value || '').trim().toUpperCase()
}

function isGeneralFundName(value: string): boolean {
  const normalized = normalizeFundName(value).toLowerCase()
  return normalized.includes('general') || normalized.includes('sadharan') || normalized.includes('सर्वसाधारण')
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

function getFinancialYearOptions(): string[] {
  const today = new Date()
  const baseYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1
  return [
    `${baseYear - 1}-${baseYear}`,
    `${baseYear}-${baseYear + 1}`,
    `${baseYear + 1}-${baseYear + 2}`,
  ]
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block', marginBottom: 4, fontSize: '0.8rem', fontWeight: 600, color: '#5e7388',
}

const SELECT_STYLE: React.CSSProperties = {
  border: '1.5px solid #c8d8e8', borderRadius: 8, padding: '8px 12px',
  fontSize: '0.88rem', color: '#18324a', background: '#fff', outline: 'none',
}

const KPI_GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
  gap: 10,
  marginBottom: 12,
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

const ACTION_DASHBOARD_PDF_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  color: '#ffffff',
  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
}

const ACTION_PRINT_STYLE: React.CSSProperties = {
  ...ACTION_BUTTON_BASE,
  color: '#ffffff',
  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
}

export default function WardWiseExpenditureReportPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<WardWiseExpenditurePayload | null>(null)
  const [dashboardData, setDashboardData] = useState<WardWiseExpenditurePayload | null>(null)
  const [departments, setDepartments] = useState<DeptOption[]>([])
  const [hoveredWardCard, setHoveredWardCard] = useState<string | null>(null)

  const financialYearOptions = useMemo(() => getFinancialYearOptions(), [])
  const [finYear, setFinYear] = useState(financialYearOptions[1] ?? '')
  const [wardFilter, setWardFilter] = useState<string>('')
  const [deptNameFilter, setDeptNameFilter] = useState<string>('')
  const [fundFilter, setFundFilter] = useState<string>('')
  const [selectedPartyLeaderHead, setSelectedPartyLeaderHead] = useState<string>('')

  const loadDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts/budget-book/departments', { cache: 'no-store' })
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: DeptOption[] }
      if (!res.ok || !json.success || !Array.isArray(json.data)) return
      setDepartments(json.data)
    } catch {
      // Ignore non-blocking filter lookup failure.
    }
  }, [])

  const loadReport = useCallback(async (year: string, _ward: string, deptName: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (year) params.set('finYear', year)
      params.set('wardScope', 'ALL')
      if (deptName) params.set('deptName', deptName)

      const qs = params.toString()
      const res = await fetch(`/api/accounts/budget-book/ward-wise-expenditure-report${qs ? `?${qs}` : ''}`, {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: WardWiseExpenditurePayload; message?: string }
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

  const loadDashboardSummary = useCallback(async (year: string, deptName: string) => {
    try {
      const params = new URLSearchParams()
      if (year) params.set('finYear', year)
      params.set('wardScope', 'ALL')
      if (deptName) params.set('deptName', deptName)

      const qs = params.toString()
      const res = await fetch(`/api/accounts/budget-book/ward-wise-expenditure-report${qs ? `?${qs}` : ''}`, {
        cache: 'no-store',
      })
      const json = await res.json().catch(() => ({})) as { success?: boolean; data?: WardWiseExpenditurePayload }
      if (!res.ok || !json.success || !json.data) return
      setDashboardData(json.data)
    } catch {
      // Keep previous dashboard values if refresh fails.
    }
  }, [])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  useEffect(() => {
    loadReport(finYear, wardFilter, deptNameFilter)
  }, [loadReport, finYear, wardFilter, deptNameFilter])

  useEffect(() => {
    loadDashboardSummary(finYear, deptNameFilter)
  }, [loadDashboardSummary, finYear, deptNameFilter])

  const hasEntryFieldsInPayload = useMemo(() => {
    if (!data || !Array.isArray(data.rows) || data.rows.length === 0) return true
    const sample = data.rows[0] as unknown as Record<string, unknown>
    return Object.prototype.hasOwnProperty.call(sample, 'bookEntryNo')
      || Object.prototype.hasOwnProperty.call(sample, 'finalBookEntryNo')
  }, [data])

  const hasEntryFieldsInDashboardPayload = useMemo(() => {
    if (!dashboardData || !Array.isArray(dashboardData.rows) || dashboardData.rows.length === 0) return true
    const sample = dashboardData.rows[0] as unknown as Record<string, unknown>
    return Object.prototype.hasOwnProperty.call(sample, 'bookEntryNo')
      || Object.prototype.hasOwnProperty.call(sample, 'finalBookEntryNo')
  }, [dashboardData])

  const dedupedDataRowsInfo = useMemo(() => {
    const entryRows = (data?.rows || []).filter(hasValidBudgetEntry)
    return dedupeEntryRows(entryRows)
  }, [data])

  const dedupedDashboardRowsInfo = useMemo(() => {
    const entryRows = (dashboardData?.rows || []).filter(hasValidBudgetEntry)
    return dedupeEntryRows(entryRows)
  }, [dashboardData])

  const baseFilteredRows = useMemo(() => {
    if (!data) return [] as WardWiseExpenditureRow[]
    let rows = dedupedDataRowsInfo.rows

    if (deptNameFilter) {
      const deptNeedle = deptNameFilter.trim().toLowerCase()
      rows = rows.filter((row) => (row.deptName || '').trim().toLowerCase().includes(deptNeedle))
    }

    if (wardFilter === '__MULTI__') {
      rows = rows.filter((row) => {
        const raw = normalizeWardRaw(row.wardNo || '')
        return !isAllWardsPattern(raw) && extractWardList(raw).length > 1
      })
    } else if (wardFilter === '__UNMAPPED__') {
      rows = rows.filter((row) => {
        const raw = normalizeWardRaw(row.wardNo || '')
        return isAllWardsPattern(raw) || extractWardList(raw).length === 0
      })
    } else if (wardFilter) {
      rows = rows.filter((row) => {
        const wardList = extractWardList(row.wardNo || '')
        return wardList.includes(parseInt(wardFilter, 10))
      })
    }

    if (fundFilter) {
      rows = rows.filter((row) => normalizeFundName(row.fundName || 'Fund Not Mapped') === fundFilter)
    }

    return rows
  }, [data, dedupedDataRowsInfo.rows, deptNameFilter, wardFilter, fundFilter])

  const filteredRows = useMemo(() => {
    if (!selectedPartyLeaderHead) return baseFilteredRows
    return baseFilteredRows.filter((row) => normalizeBudgetHeadCode(row.budgetHeadCode) === selectedPartyLeaderHead)
  }, [baseFilteredRows, selectedPartyLeaderHead])

  const filteredTotalProposedCost = useMemo(() => {
    let total = 0
    for (const row of filteredRows) total += Number(row.proposedCost || 0)
    return total
  }, [filteredRows])

  const filteredFundSplit = useMemo(() => {
    let generalAmount = 0
    let otherAmount = 0

    for (const row of filteredRows) {
      const amount = Number(row.proposedCost || 0)
      if (isGeneralFundName(row.fundName || '')) {
        generalAmount += amount
      } else {
        otherAmount += amount
      }
    }

    return {
      generalAmount,
      otherAmount,
    }
  }, [filteredRows])

  const fundOptions = useMemo(() => {
    const sourceRows = dedupedDashboardRowsInfo.rows.length > 0 ? dedupedDashboardRowsInfo.rows : dedupedDataRowsInfo.rows
    const unique = new Set<string>()
    for (const row of sourceRows) {
      unique.add(normalizeFundName(row.fundName || 'Fund Not Mapped'))
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b))
  }, [dedupedDashboardRowsInfo.rows, dedupedDataRowsInfo.rows])

  const exportCsv = useCallback(() => {
    if (!data || filteredRows.length === 0) return

    const header = [
      'Financial Year',
      'Department Name',
      'Nasti Number',
      'Book Entry No',
      'Final Book Entry No',
      'Work Name',
      'Ward Number',
      'Proposed Cost',
      'Budget Head',
      'Fund Name',
    ]

    const lines: string[] = [header.map(csvEscape).join(',')]
    for (const row of filteredRows) {
      lines.push([
        row.finYear,
        row.deptName,
        row.nastiNo,
        row.bookEntryNo && row.bookEntryNo > 0 ? row.bookEntryNo : '',
        row.finalBookEntryNo && row.finalBookEntryNo > 0 ? row.finalBookEntryNo : '',
        row.workName || '',
        wardDisplayLabel(row.wardNo || ''),
        row.proposedCost,
        `${row.budgetHeadCode}${row.budgetHeadName ? ` - ${row.budgetHeadName}` : ''}`,
        row.fundName || '',
      ].map(csvEscape).join(','))
    }

    lines.push(['', '', '', '', '', '', 'TOTAL', filteredTotalProposedCost, '', ''].map(csvEscape).join(','))

    const csvContent = '\uFEFF' + lines.join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ward-wise-expenditure-report-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [data, filteredRows, filteredTotalProposedCost])

  const exportExcel = useCallback(async () => {
    if (!data || filteredRows.length === 0) return

    const XLSX = await import('xlsx')
    const sheetRows: Array<Array<string | number>> = [
      ['Financial Year', 'Department Name', 'Nasti Number', 'Book Entry No', 'Final Book Entry No', 'Work Name', 'Ward Number', 'Proposed Cost', 'Budget Head', 'Fund Name'],
    ]

    for (const row of filteredRows) {
      sheetRows.push([
        row.finYear,
        row.deptName,
        row.nastiNo,
        row.bookEntryNo && row.bookEntryNo > 0 ? row.bookEntryNo : '',
        row.finalBookEntryNo && row.finalBookEntryNo > 0 ? row.finalBookEntryNo : '',
        row.workName || '',
        wardDisplayLabel(row.wardNo || ''),
        row.proposedCost,
        `${row.budgetHeadCode}${row.budgetHeadName ? ` - ${row.budgetHeadName}` : ''}`,
        row.fundName || '',
      ])
    }

    sheetRows.push(['', '', '', '', '', '', 'TOTAL', filteredTotalProposedCost, '', ''])

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.aoa_to_sheet(sheetRows)
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 26 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 44 },
      { wch: 12 },
      { wch: 16 },
      { wch: 44 },
      { wch: 20 },
    ]
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ward Expenditure')
    XLSX.writeFile(workbook, `ward-wise-expenditure-report-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }, [data, filteredRows, filteredTotalProposedCost])

  const exportDashboardsPdf = useCallback(async () => {
    if (!data) {
      alert('Load report data before exporting dashboards.')
      return
    }

    const kpiSection = document.getElementById('kpi-dashboard-section')
    const wardSection = document.getElementById('ward-dashboard-section')
    const leaderSection = document.getElementById('party-leader-dashboard-section')
    if (!kpiSection || !wardSection || !leaderSection) {
      alert('Dashboard sections not found for PDF export.')
      return
    }

    try {
      const html2canvasModule = await import('html2canvas')
      const jsPdfModule = await import('jspdf')
      const html2canvas = html2canvasModule.default
      const JsPDF = jsPdfModule.jsPDF

      // Ensure browser paints and fonts resolve before canvas snapshot.
      if (typeof document !== 'undefined' && 'fonts' in document) {
        await (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
      }
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)))
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)))

      const captureOpts = {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
      }

      const kpiCanvas = await html2canvas(kpiSection, captureOpts)
      const wardCanvas = await html2canvas(wardSection, captureOpts)
      const leaderCanvas = await html2canvas(leaderSection, captureOpts)

      const blockGap = 20
      const outerPad = 24
      const titleHeight = 86

      const maxContentWidth = Math.max(kpiCanvas.width, wardCanvas.width, leaderCanvas.width)
      const outputWidth = maxContentWidth + (outerPad * 2)
      const outputHeight = titleHeight + kpiCanvas.height + blockGap + wardCanvas.height + blockGap + leaderCanvas.height + outerPad

      const composite = document.createElement('canvas')
      composite.width = outputWidth
      composite.height = outputHeight
      const ctx = composite.getContext('2d')
      if (!ctx) throw new Error('Canvas 2D context not available')

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, outputWidth, outputHeight)

      ctx.fillStyle = '#1f3f57'
      ctx.font = 'bold 34px Segoe UI'
      ctx.fillText('Ward-wise Expenditure Dashboard Summary', outerPad, 42)

      ctx.fillStyle = '#4e6478'
      ctx.font = '22px Segoe UI'
      ctx.fillText(`Financial Year: ${data.finYear || '—'}   Period: ${fmtDate(data?.fromDate || '')} to ${fmtDate(data?.toDate || '')}`, outerPad, 74)

      let drawY = titleHeight
      const drawCentered = (canvas: HTMLCanvasElement) => {
        const x = outerPad + Math.round((maxContentWidth - canvas.width) / 2)
        ctx.drawImage(canvas, x, drawY)
        drawY += canvas.height + blockGap
      }

      drawCentered(kpiCanvas)
      drawCentered(wardCanvas)
      drawCentered(leaderCanvas)

      const pdf = new JsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imageData = composite.toDataURL('image/jpeg', 0.97)

      const fitScale = Math.min(pageWidth / outputWidth, pageHeight / outputHeight)
      const finalW = outputWidth * fitScale
      const finalH = outputHeight * fitScale
      const x = (pageWidth - finalW) / 2
      const y = (pageHeight - finalH) / 2

      pdf.addImage(imageData, 'JPEG', x, y, finalW, finalH, undefined, 'FAST')
      pdf.save(`ward-wise-expenditure-dashboards-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      // Keep console details for debugging runtime export failures.
      console.error('Dashboard PDF export failed', err)
      alert('Failed to export dashboard PDF. Please try again.')
    }
  }, [data])

  const rowsCountLabel = useMemo(() => {
    return `${filteredRows.length} rows`
  }, [filteredRows])

  const departmentCount = useMemo(() => {
    return new Set(filteredRows.map((row) => (row.deptName || '').trim()).filter(Boolean)).size
  }, [filteredRows])

  const uniqueFunds = useMemo(() => {
    return new Set(filteredRows.map((row) => row.fundName || 'Fund Not Mapped')).size
  }, [filteredRows])

  const partyLeaderHeadCards = useMemo<PartyLeaderHeadCard[]>(() => {
    const byCode = new Map<string, PartyLeaderHeadCard>()
    for (const head of PARTY_LEADER_BUDGET_HEADS) {
      byCode.set(head.code, {
        code: head.code,
        name: head.name,
        amount: 0,
        count: 0,
      })
    }

    for (const row of baseFilteredRows) {
      const code = normalizeBudgetHeadCode(row.budgetHeadCode)
      const bucket = byCode.get(code)
      if (!bucket) continue
      bucket.amount += Number(row.proposedCost || 0)
      bucket.count += 1
    }

    return PARTY_LEADER_BUDGET_HEADS.map((head) => byCode.get(head.code) as PartyLeaderHeadCard)
  }, [baseFilteredRows])

  const partyLeaderHeadTotal = useMemo(() => {
    let total = 0
    for (const card of partyLeaderHeadCards) total += Number(card.amount || 0)
    return total
  }, [partyLeaderHeadCards])

  const wardCards = useMemo<WardCard[]>(() => {
    const sourceRows = dedupedDashboardRowsInfo.rows.length > 0 ? dedupedDashboardRowsInfo.rows : dedupedDataRowsInfo.rows
    const rows = fundFilter
      ? sourceRows.filter((row) => normalizeFundName(row.fundName || 'Fund Not Mapped') === fundFilter)
      : sourceRows
    if (rows.length === 0) return []

    const byWard = new Map<string, {
      amount: number
      count: number
      generalAmount: number
      generalCount: number
      otherAmount: number
      otherCount: number
    }>()
    for (let i = 1; i <= 20; i++) {
      byWard.set(String(i), {
        amount: 0,
        count: 0,
        generalAmount: 0,
        generalCount: 0,
        otherAmount: 0,
        otherCount: 0,
      })
    }

    let multiAmount = 0
    let multiCount = 0
    let multiGeneralAmount = 0
    let multiGeneralCount = 0
    let multiOtherAmount = 0
    let multiOtherCount = 0

    let unmappedAmount = 0
    let unmappedCount = 0
    let unmappedGeneralAmount = 0
    let unmappedGeneralCount = 0
    let unmappedOtherAmount = 0
    let unmappedOtherCount = 0

    for (const row of rows) {
      const raw = normalizeWardRaw(row.wardNo || '')
      const wardList = extractWardList(raw)
      const amount = Number(row.proposedCost || 0)
      const isGeneral = isGeneralFundName(row.fundName || 'Fund Not Mapped')

      if (wardList.length > 0 && !isAllWardsPattern(raw)) {
        for (const wardNo of wardList) {
          const key = String(wardNo)
          const bucket = byWard.get(key)
          if (bucket) {
            bucket.amount += amount
            bucket.count += 1
            if (isGeneral) {
              bucket.generalAmount += amount
              bucket.generalCount += 1
            } else {
              bucket.otherAmount += amount
              bucket.otherCount += 1
            }
          }
        }

        if (wardList.length > 1) {
          multiAmount += amount
          multiCount += 1
          if (isGeneral) {
            multiGeneralAmount += amount
            multiGeneralCount += 1
          } else {
            multiOtherAmount += amount
            multiOtherCount += 1
          }
        }
      } else if (isAllWardsPattern(raw)) {
        unmappedAmount += amount
        unmappedCount += 1
        if (isGeneral) {
          unmappedGeneralAmount += amount
          unmappedGeneralCount += 1
        } else {
          unmappedOtherAmount += amount
          unmappedOtherCount += 1
        }
      } else if (isMultiWardValue(raw)) {
        multiAmount += amount
        multiCount += 1
        if (isGeneral) {
          multiGeneralAmount += amount
          multiGeneralCount += 1
        } else {
          multiOtherAmount += amount
          multiOtherCount += 1
        }
      } else {
        unmappedAmount += amount
        unmappedCount += 1
        if (isGeneral) {
          unmappedGeneralAmount += amount
          unmappedGeneralCount += 1
        } else {
          unmappedOtherAmount += amount
          unmappedOtherCount += 1
        }
      }
    }

    const cards: WardCard[] = []
    for (let i = 1; i <= 20; i++) {
      const key = String(i)
      const bucket = byWard.get(key) || {
        amount: 0,
        count: 0,
        generalAmount: 0,
        generalCount: 0,
        otherAmount: 0,
        otherCount: 0,
      }
      cards.push({
        key: `ward-${key}`,
        label: `Ward ${key}`,
        amount: bucket.amount,
        count: bucket.count,
        generalAmount: bucket.generalAmount,
        generalCount: bucket.generalCount,
        otherAmount: bucket.otherAmount,
        otherCount: bucket.otherCount,
        wardValue: key,
        wardScope: 'SINGLE',
      })
    }

    cards.push({
      key: 'ward-multi',
      label: 'Multiple Wards',
      amount: multiAmount,
      count: multiCount,
      generalAmount: multiGeneralAmount,
      generalCount: multiGeneralCount,
      otherAmount: multiOtherAmount,
      otherCount: multiOtherCount,
      wardValue: '__MULTI__',
      wardScope: 'MULTI',
    })

    cards.push({
      key: 'ward-unmapped',
      label: 'Other/NA Ward',
      amount: unmappedAmount,
      count: unmappedCount,
      generalAmount: unmappedGeneralAmount,
      generalCount: unmappedGeneralCount,
      otherAmount: unmappedOtherAmount,
      otherCount: unmappedOtherCount,
      wardValue: '__UNMAPPED__',
      wardScope: 'UNMAPPED',
    })

    return cards
  }, [dedupedDashboardRowsInfo.rows, dedupedDataRowsInfo.rows, fundFilter])

  const activeWardScope = wardFilter === '__MULTI__' ? 'MULTI' : wardFilter === '__UNMAPPED__' ? 'UNMAPPED' : wardFilter ? 'SINGLE' : 'ALL'
  const activeWardNo = activeWardScope === 'SINGLE' ? wardFilter : ''

  const isWardCardActive = useCallback((card: WardCard) => {
    if (activeWardScope === 'MULTI') return card.wardScope === 'MULTI'
    if (activeWardScope === 'UNMAPPED') return card.wardScope === 'UNMAPPED'
    if (activeWardScope === 'SINGLE') return card.wardScope === 'SINGLE' && card.wardValue === activeWardNo
    return false
  }, [activeWardNo, activeWardScope])

  const handleWardCardClick = useCallback((card: WardCard) => {
    const active =
      (card.wardScope === 'MULTI' && activeWardScope === 'MULTI')
      || (card.wardScope === 'UNMAPPED' && activeWardScope === 'UNMAPPED')
      || (card.wardScope === 'SINGLE' && activeWardScope === 'SINGLE' && card.wardValue === activeWardNo)

    setWardFilter(active ? '' : card.wardValue)
  }, [activeWardNo, activeWardScope])

  const getWardCardTheme = useCallback((scope: string, active: boolean) => {
    const palette = scope === 'MULTI'
      ? {
        bg: 'linear-gradient(145deg, #fff8eb 0%, #ffe4b3 100%)',
        border: '#f59e0b',
        text: '#92400e',
        badge: '#fef3c7',
        glow: '0 10px 24px rgba(245, 158, 11, 0.24)',
      }
      : scope === 'UNMAPPED'
        ? {
          bg: 'linear-gradient(145deg, #fff2f2 0%, #ffd7d7 100%)',
          border: '#ef4444',
          text: '#991b1b',
          badge: '#fee2e2',
          glow: '0 10px 24px rgba(239, 68, 68, 0.20)',
        }
        : {
          bg: 'linear-gradient(145deg, #ebfff4 0%, #cbf6dc 100%)',
          border: '#22c55e',
          text: '#14532d',
          badge: '#dcfce7',
          glow: '0 10px 24px rgba(34, 197, 94, 0.20)',
        }

    if (!active) {
      return {
        bg: 'linear-gradient(145deg, #ffffff 0%, #f6f9fc 100%)',
        border: '#d9e2ec',
        text: '#1f3a56',
        badge: '#f5f7fa',
        glow: '0 4px 10px rgba(15, 23, 42, 0.06)',
      }
    }

    return palette
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f4f8', fontFamily: "'Segoe UI', 'Noto Sans Devanagari', sans-serif" }}>
      <DeptSidebar deptKey="accounts" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(v => !v)} />

      <div style={{ flex: 1, minWidth: 0, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={STICKY_TOP_PANEL_STYLE}>
          <nav className="dash-breadcrumb" aria-label="Breadcrumb">
            <Link href="/" className="dash-breadcrumb-home">
              <i className="bi bi-house-door-fill" aria-hidden="true" /> Home
            </Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <Link href="/accounts/dashboard" className="dash-breadcrumb-home">Accounts</Link>
            <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
            <span className="dash-breadcrumb-current">Ward-wise Expenditure Report</span>
          </nav>

          <div style={{
            background: 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
            borderRadius: 16,
            padding: '22px 28px',
            marginBottom: 14,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 20px rgba(45,106,79,0.3)',
          }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-buildings-fill" style={{ fontSize: '1.5rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Accounts Department
              </div>
              <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                Ward-wise Expenditure Report
              </h1>
              <div style={{ fontSize: '0.88rem', opacity: 0.92 }}>
                Entry-validated ward expenditure with fund-wise visibility.
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
              <label style={LABEL_STYLE}>Financial Year</label>
              <select
                style={{ ...SELECT_STYLE, minWidth: 170 }}
                value={finYear}
                onChange={(event) => setFinYear(event.target.value)}
                aria-label="Financial year"
              >
                {financialYearOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={LABEL_STYLE}>Ward</label>
              <select
                style={{ ...SELECT_STYLE, minWidth: 150 }}
                value={wardFilter}
                onChange={(event) => setWardFilter(event.target.value)}
                aria-label="Ward number"
              >
                <option value="">All Records</option>
                <option value="__MULTI__">Multiple Wards (Multiple/All Wards)</option>
                <option value="__UNMAPPED__">Other/NA Ward</option>
                {Array.from({ length: 20 }, (_, idx) => {
                  const value = String(idx + 1)
                  return <option key={value} value={value}>Ward {value}</option>
                })}
              </select>
            </div>

            <div>
              <label style={LABEL_STYLE}>Department</label>
              <select
                style={{ ...SELECT_STYLE, minWidth: 230 }}
                value={deptNameFilter}
                onChange={(event) => setDeptNameFilter(event.target.value)}
                aria-label="Department name"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => {
                  const label = dept.deptNameLLUnicode || dept.deptNameLL || dept.deptName || String(dept.deptCode)
                  return <option key={dept.deptCode} value={label}>{label}</option>
                })}
              </select>
            </div>

            <div>
              <label style={LABEL_STYLE}>Fund</label>
              <select
                style={{ ...SELECT_STYLE, minWidth: 230 }}
                value={fundFilter}
                onChange={(event) => setFundFilter(event.target.value)}
                aria-label="Fund name"
              >
                <option value="">All Funds</option>
                {fundOptions.map((fund) => (
                  <option key={fund} value={fund}>{fund}</option>
                ))}
              </select>
            </div>

            <button type="button" style={ACTION_REFRESH_STYLE} onClick={() => loadReport(finYear, wardFilter, deptNameFilter)} disabled={loading}>
              <i className="bi bi-arrow-clockwise me-1" /> Refresh
            </button>
            <button type="button" style={ACTION_EXCEL_STYLE} onClick={exportExcel} disabled={filteredRows.length === 0}>
              <i className="bi bi-file-earmark-excel me-1" /> Export Excel (.xlsx)
            </button>
            <button type="button" style={ACTION_CSV_STYLE} onClick={exportCsv} disabled={filteredRows.length === 0}>
              <i className="bi bi-file-earmark-spreadsheet me-1" /> Export CSV
            </button>
            <button type="button" style={ACTION_DASHBOARD_PDF_STYLE} onClick={exportDashboardsPdf} disabled={loading || !data}>
              <i className="bi bi-filetype-pdf me-1" /> Export Dashboard PDF
            </button>
            <button type="button" style={ACTION_PRINT_STYLE} onClick={() => window.print()} disabled={filteredRows.length === 0}>
              <i className="bi bi-printer me-1" /> Print A4 / Save PDF
            </button>
          </div>

          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ background: '#eef5fb', color: '#334e68', border: '1px solid #d7e3ef', borderRadius: 999, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600 }}>
              Period: {fmtDate(data?.fromDate || '')} to {fmtDate(data?.toDate || '')}
            </span>
            <span style={{ background: '#ecfdf3', color: '#1f5137', border: '1px solid #ccefd9', borderRadius: 999, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
              {rowsCountLabel}
            </span>
          </div>
        </div>

          {!loading && !error && data && (
            <div id="kpi-dashboard-section" style={KPI_GRID_STYLE}>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Financial Year</div>
                <div style={KPI_VALUE_STYLE}>{data.finYear || '—'}</div>
              </div>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Ward Filter</div>
                <div style={KPI_VALUE_STYLE}>
                  {activeWardScope === 'SINGLE' && data.wardNo
                    ? `Ward ${data.wardNo}`
                    : activeWardScope === 'MULTI'
                      ? 'Multiple Wards'
                      : activeWardScope === 'UNMAPPED'
                        ? 'Other/NA Ward'
                        : 'All Records'}
                </div>
              </div>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Total Proposed Cost</div>
                <div style={{ ...KPI_VALUE_STYLE, lineHeight: 1.2 }}>{fmtCompactInr(filteredTotalProposedCost)}</div>
                <div style={{ marginTop: 6, borderTop: '1px dashed #d9e4ef', paddingTop: 6, display: 'grid', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#466079' }}>
                    <span style={{ fontWeight: 600 }}>General Fund</span>
                    <span style={{ fontWeight: 700 }}>{fmtCompactInr(filteredFundSplit.generalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#466079' }}>
                    <span style={{ fontWeight: 600 }}>Other Funds</span>
                    <span style={{ fontWeight: 700 }}>{fmtCompactInr(filteredFundSplit.otherAmount)}</span>
                  </div>
                </div>
              </div>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Funds Covered</div>
                <div style={KPI_VALUE_STYLE}>{uniqueFunds}</div>
              </div>
              <div style={KPI_CARD_STYLE}>
                <div style={KPI_LABEL_STYLE}>Departments Covered</div>
                <div style={KPI_VALUE_STYLE}>{departmentCount}</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', overscrollBehavior: 'contain', padding: '12px 24px 28px 24px' }}>
        <section className="table-shell" id="ward-wise-expenditure-report-sheet">

          {loading && <div className="alert alert-info mb-0">Loading report...</div>}
          {!loading && error && <div className="alert alert-danger mb-0">{error}</div>}
          {!loading && !error && !hasEntryFieldsInPayload && (
            <div className="alert alert-warning mb-3">
              Budget entry fields are not present in API response. Files without primary/final entry are being excluded from this report. Please restart backend API to load latest report contract.
            </div>
          )}
          {!loading && !error && !hasEntryFieldsInDashboardPayload && (
            <div className="alert alert-warning mb-3">
              Ward dashboard is using strict exclusion for files without entry numbers. Restart backend API so card totals include only valid entry-linked files.
            </div>
          )}
          {!loading && !error && (dedupedDataRowsInfo.removed > 0 || dedupedDashboardRowsInfo.removed > 0) && (
            <div className="alert alert-info mb-3">
              Duplicate rows were automatically removed using Financial Year + Department + Nasti No + Book Entry No + Final Book Entry No.
              Removed from table source: {dedupedDataRowsInfo.removed}, removed from dashboard source: {dedupedDashboardRowsInfo.removed}.
            </div>
          )}

          {!loading && !error && data && (
            <>
              <div id="dashboard-pdf-export-root">
                <div id="dashboard-pdf-export-title" style={{ display: 'none' }}>
                  <h2>Ward-wise Expenditure Dashboard Summary</h2>
                  <p>Financial Year: {data.finYear || '—'} | Period: {fmtDate(data?.fromDate || '')} to {fmtDate(data?.toDate || '')}</p>
                </div>

                <div id="ward-dashboard-section" className="ward-dashboard-wrap mb-3" style={{ background: '#ffffff', border: '1px solid #e0eaf2', borderRadius: 14, padding: 14 }}>
                <div className="ward-dashboard-title-row" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <h2 className="ward-dashboard-title" style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f3f57' }}>Ward-wise Expenditure Dashboard</h2>
                  <span className="ward-dashboard-subtitle" style={{ fontSize: '0.76rem', color: '#71869a' }}>Click ward cards for details, and compare General vs Other funds at a glance</span>
                </div>
                <div className="ward-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {wardCards.map((card) => {
                    const active = isWardCardActive(card)
                    const hovered = hoveredWardCard === card.key
                    const theme = getWardCardTheme(card.wardScope, active)
                    return (
                      <button
                        key={card.key}
                        type="button"
                        className={`ward-card ${active ? 'active' : ''}`}
                        onClick={() => handleWardCardClick(card)}
                        onMouseEnter={() => setHoveredWardCard(card.key)}
                        onMouseLeave={() => setHoveredWardCard(null)}
                        disabled={loading}
                        title={active
                          ? `Click to clear ${card.label} filter`
                          : `${card.label} - Total ${fmtAmount(card.amount)} | General ${fmtAmount(card.generalAmount)} | Other ${fmtAmount(card.otherAmount)}`}
                        style={{
                          border: `1px solid ${theme.border}`,
                          background: theme.bg,
                          borderRadius: 12,
                          padding: 12,
                          textAlign: 'left',
                          transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, filter 0.22s ease',
                          cursor: 'pointer',
                          boxShadow: active || hovered ? theme.glow : '0 4px 10px rgba(15, 23, 42, 0.05)',
                          transform: hovered ? 'translateY(-4px) scale(1.01)' : active ? 'translateY(-2px)' : 'translateY(0)',
                          filter: hovered ? 'saturate(1.08)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div className="ward-card-label" style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#486581', fontWeight: 700 }}>{card.label}</div>
                          <span style={{ background: theme.badge, color: theme.text, borderRadius: 999, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {card.count} files
                          </span>
                        </div>
                        <div className="ward-card-amount" style={{ marginTop: 6, fontSize: '1.08rem', fontWeight: 800, color: '#15324f' }}>{fmtCompactInr(card.amount)}</div>
                        <div style={{ marginTop: 7, borderTop: '1px dashed #d9e4ef', paddingTop: 7, display: 'grid', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem', color: '#40586f', lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 600 }}>General Fund</span>
                            <span>{fmtCompactInr(card.generalAmount)} ({card.generalCount})</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.73rem', color: '#40586f', lineHeight: 1.2 }}>
                            <span style={{ fontWeight: 600 }}>Other Funds</span>
                            <span>{fmtCompactInr(card.otherAmount)} ({card.otherCount})</span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                </div>

                <div id="party-leader-dashboard-section" className="party-leader-dashboard-wrap mb-3" style={{ background: '#ffffff', border: '1px solid #e0eaf2', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1f3f57' }}>Party Leader Budget Head Expenditure Dashboard</h2>
                  <span style={{ fontSize: '0.76rem', color: '#71869a' }}>
                    Click a card to filter by that head. Click again to reset default records.
                  </span>
                </div>

                {selectedPartyLeaderHead && (
                  <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ background: '#ecfdf3', color: '#1f5137', border: '1px solid #ccefd9', borderRadius: 999, padding: '4px 10px', fontSize: '0.74rem', fontWeight: 700 }}>
                      Head Filter Active: {selectedPartyLeaderHead}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setSelectedPartyLeaderHead('')}
                    >
                      Clear Head Filter
                    </button>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                  {partyLeaderHeadCards.map((card) => {
                    const active = selectedPartyLeaderHead === card.code
                    return (
                    <button
                      type="button"
                      key={card.code}
                      onClick={() => setSelectedPartyLeaderHead((prev) => (prev === card.code ? '' : card.code))}
                      title={active ? 'Click to clear this filter' : `Filter by ${card.code}`}
                      style={{
                        border: active ? '1px solid #16a34a' : '1px solid #d9e2ec',
                        background: active ? 'linear-gradient(145deg, #ecfdf3 0%, #d9fbe8 100%)' : 'linear-gradient(145deg, #ffffff 0%, #f6f9fc 100%)',
                        borderRadius: 12,
                        padding: 12,
                        boxShadow: active ? '0 8px 18px rgba(22, 163, 74, 0.20)' : '0 4px 10px rgba(15, 23, 42, 0.05)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                        transform: active ? 'translateY(-2px)' : 'translateY(0)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: active ? '#14532d' : '#1f3a56', letterSpacing: '0.03em' }}>{card.code}</span>
                        <span style={{ background: active ? '#dcfce7' : '#eef5fb', color: active ? '#166534' : '#334e68', borderRadius: 999, padding: '2px 8px', fontSize: '0.69rem', fontWeight: 700 }}>
                          {card.count} files
                        </span>
                      </div>
                      <div style={{ marginTop: 4, fontSize: '0.79rem', fontWeight: 600, color: '#40586f', minHeight: 34 }}>
                        {card.name}
                      </div>
                      <div style={{ marginTop: 7, fontSize: '1.02rem', fontWeight: 800, color: '#15324f' }}>
                        {fmtCompactInr(card.amount)}
                      </div>
                    </button>
                  )})}
                </div>

                <div style={{ marginTop: 10, borderTop: '1px dashed #d9e4ef', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', color: '#466079', fontWeight: 700 }}>
                    Total for above party-leader heads
                  </span>
                  <span style={{ fontSize: '0.96rem', color: '#15324f', fontWeight: 800 }}>
                    {fmtCompactInr(partyLeaderHeadTotal)}
                  </span>
                </div>
                </div>
              </div>

              <div className="table-responsive" style={{ maxHeight: '52vh', overflow: 'auto', border: '1px solid #e0eaf2', borderRadius: 10 }}>
                <table className="table table-bordered align-middle mb-0 report-table" style={{ minWidth: 1340 }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: 120, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Financial Year</th>
                      <th style={{ minWidth: 210, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Department Name</th>
                      <th className="text-end" style={{ minWidth: 120, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Nasti Number</th>
                      <th className="text-end" style={{ minWidth: 130, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Book Entry No</th>
                      <th className="text-end" style={{ minWidth: 150, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Final Book Entry No</th>
                      <th style={{ minWidth: 320, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Work Name</th>
                      <th style={{ minWidth: 120, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Ward Number</th>
                      <th className="text-end" style={{ minWidth: 150, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Proposed Cost</th>
                      <th style={{ minWidth: 260, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Budget Head</th>
                      <th style={{ minWidth: 180, position: 'sticky', top: 0, zIndex: 5, background: '#f8fafc' }}>Fund Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center text-muted py-4">No records found for selected filters.</td>
                      </tr>
                    )}
                    {filteredRows.map((row) => (
                      <tr key={`${row.finYear}-${row.deptName}-${row.nastiNo}-${Number(row.bookEntryNo || 0)}-${Number(row.finalBookEntryNo || 0)}`}>
                        <td>{row.finYear}</td>
                        <td>{row.deptName || '—'}</td>
                        <td className="text-end">{row.nastiNo || 0}</td>
                        <td className="text-end">{displayEntryNo(row.bookEntryNo)}</td>
                        <td className="text-end">{displayEntryNo(row.finalBookEntryNo)}</td>
                        <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.workName || '—'}</td>
                        <td>{wardDisplayLabel(row.wardNo || '')}</td>
                        <td className="text-end fw-semibold">{fmtAmount(row.proposedCost)}</td>
                        <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          <div className="fw-semibold">{row.budgetHeadCode || '—'}</div>
                          {row.budgetHeadName && <div className="small text-muted">{row.budgetHeadName}</div>}
                        </td>
                        <td>{row.fundName || 'Fund Not Mapped'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-secondary fw-bold">
                    <tr>
                      <td colSpan={7}>TOTAL PROPOSED COST</td>
                      <td className="text-end">{fmtAmount(filteredTotalProposedCost)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </section>
        </div>
      </div>


    </div>
  )
}
