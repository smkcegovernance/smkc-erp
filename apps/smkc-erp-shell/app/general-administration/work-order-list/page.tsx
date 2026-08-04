'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { currentUser } from '@smkc/auth'
import DeptSidebar from '@/app/components/DeptSidebar'
import { useLanguage } from '@/app/lib/i18n/LanguageContext'

interface WorkOrderListItem {
  workOrderNo: number
  workOrderDisplayNo: string
  deptCode: number
  deptName: string
  finYear: string
  workOrderDate: string
  proposalName: string
  eligibleVendorName: string
  vendorProposedAmount: number
  nastiNo: string
}

function getCurrentFinYear(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startYear = month >= 4 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

function formatAmount(amt: number): string {
  return new Intl.NumberFormat('en-IN').format(amt)
}

export default function WorkOrderListPage() {
  const [finYear, setFinYear] = useState<string>(getCurrentFinYear())
  const [items, setItems] = useState<WorkOrderListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { lang, T } = useLanguage()
  const mr = lang === 'mr'

  const finYears = (() => {
    const now = new Date()
    const m = now.getMonth() + 1
    const y = now.getFullYear()
    const cur = m >= 4 ? y : y - 1
    return Array.from({ length: 5 }, (_, i) => {
      const s = cur - i
      return `${s}-${s + 1}`
    })
  })()

  async function fetchList(fy: string) {
    setLoading(true)
    setError(null)
    try {
      const user = currentUser()
      const uidParam = user?.userId ? `&userId=${encodeURIComponent(user.userId)}` : ''
      const res = await fetch(`/api/gad/work-order/list?finYear=${encodeURIComponent(fy)}${uidParam}`)
      const json = await res.json()
      if (json.success) {
        setItems(json.data || [])
      } else {
        setError(json.message || 'डेटा मिळवण्यात अडचण आली.')
      }
    } catch {
      setError('नेटवर्क एरर. कृपया पुन्हा प्रयत्न करा.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList(finYear)
  }, [finYear])

  async function openPrint(item: WorkOrderListItem) {
    try {
      const r = await fetch(
        `/api/gad/work-order/make-print-token?workOrderNo=${item.workOrderNo}&deptCode=${item.deptCode}&finYear=${encodeURIComponent(item.finYear)}`
      )
      const json = await r.json()
      if (json.success)
        window.open(`/general-administration/create-work-order/print?t=${json.token}`, '_blank')
    } catch { /* ignore */ }
  }

  return (
    <div className="dept-layout">
      <DeptSidebar deptKey="general-administration" isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
      <main className="erp-main">
        {/* Breadcrumb */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <Link href="/general-administration/dashboard" className="dash-breadcrumb-home">
            {T.depts['general-administration']?.label ?? 'सामान्य प्रशासन'}
          </Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="dash-breadcrumb-current">{mr ? 'वर्क ऑर्डर यादी' : 'Work Order List'}</span>
        </nav>

        {/* Page header */}
        <div className="erp-page-header">
          <div className="erp-page-header-text">
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="dept-sidebar-toggle-btn"
                onClick={() => setSidebarOpen(o => !o)}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} />
              </button>
              <h1 className="erp-page-title mb-0">{mr ? 'वर्क ऑर्डर यादी' : 'Work Order List'}</h1>
            </div>
          </div>
          <Link href="/general-administration/create-work-order" className="btn btn-primary btn-sm">
            + {mr ? 'नवीन वर्क ऑर्डर' : 'New Work Order'}
          </Link>
        </div>

        <div className="mb-3 d-flex align-items-center gap-2">
          <label className="form-label mb-0 fw-semibold">{mr ? 'आर्थिक वर्ष:' : 'Financial Year:'}</label>
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={finYear}
            onChange={(e) => setFinYear(e.target.value)}
          >
            {finYears.map((fy) => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="alert alert-danger py-2">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-5 text-secondary">
            <div className="spinner-border spinner-border-sm me-2" />
            {mr ? 'लोड होत आहे...' : 'Loading...'}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            {mr ? 'कोणतीही नोंद आढळली नाही.' : 'No records found.'}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-sm">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>{mr ? 'वर्क ऑर्डर क्रमांक' : 'WO No.'}</th>
                  <th>{mr ? 'दिनांक' : 'Date'}</th>
                  <th>{mr ? 'नस्ती क्रमांक' : 'Nasti No.'}</th>
                  <th>{mr ? 'विभाग' : 'Department'}</th>
                  <th>{mr ? 'कामाचे नाव' : 'Proposal Name'}</th>
                  <th>{mr ? 'कंत्राटदार' : 'Contractor'}</th>
                  <th className="text-end">{mr ? 'रक्कम (रु.)' : 'Amount (₹)'}</th>
                  <th className="text-center">{mr ? 'क्रिया' : 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={`${item.workOrderNo}-${item.deptCode}`}>
                    <td>{idx + 1}</td>
                    <td>
                      <span className="badge bg-primary">{item.workOrderDisplayNo}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>{item.workOrderDate}</td>
                    <td>{item.nastiNo}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.deptName}>
                      {item.deptName}
                    </td>
                    <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.proposalName}>
                      {item.proposalName}
                    </td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.eligibleVendorName}>
                      {item.eligibleVendorName}
                    </td>
                    <td className="text-end" style={{ whiteSpace: 'nowrap' }}>
                      ₹ {formatAmount(item.vendorProposedAmount)}
                    </td>
                    <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => openPrint(item)}
                      >
                        {mr ? 'पाहा / छापा' : 'View / Print'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
