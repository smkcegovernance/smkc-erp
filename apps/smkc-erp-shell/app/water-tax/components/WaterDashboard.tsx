'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '@smkc/api-client'
import { DEPARTMENTS } from '@smkc/types'
import type { WaterConnectionDashboard, WaterRevenueDashboard } from '@smkc/types'
import DeptSidebar from '../../components/DeptSidebar'
import RevenueTab from './RevenueTab'
import ConnectionsTab from './ConnectionsTab'
import { useLanguage } from '../../lib/i18n/LanguageContext'

type Tab = 'revenue' | 'connections'

interface Division { code: string; name: string }

const FIN_YEARS = [
  '2026-2027', '2025-2026', '2024-2025', '2023-2024', '2022-2023',
  '2021-2022', '2020-2021', '2019-2020', '2018-2019',
]

const WARDS = [
  { code: '0', name: 'All Wards' },
  { code: '1', name: 'Sangli' },
  { code: '2', name: 'Miraj' },
]

const DEPT_KEY = 'water-tax'

export default function WaterDashboard() {
  const dept = DEPARTMENTS.find((d) => d.key === DEPT_KEY)!
  const { T } = useLanguage()

  const [tab,        setTab]       = useState<Tab>('revenue')
  const [finYr,      setFinYr]     = useState('2026-2027')
  const [wardCode,   setWardCode]  = useState('0')
  const [divCode,    setDivCode]   = useState('0')
  const [divisions,  setDivisions] = useState<Division[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [revenue,     setRevenue]     = useState<WaterRevenueDashboard | null>(null)
  const [connections, setConnections] = useState<WaterConnectionDashboard | null>(null)
  const [loadingRev,  setLoadingRev]  = useState(false)
  const [loadingConn, setLoadingConn] = useState(false)
  const [errRev,      setErrRev]      = useState<string | null>(null)
  const [errConn,     setErrConn]     = useState<string | null>(null)

  useEffect(() => {
    setDivCode('0')
    apiClient.get<Division[]>(
      `/api/water/dashboard/divisions?wardCode=${encodeURIComponent(wardCode)}`
    ).then(setDivisions).catch(() => setDivisions([]))
  }, [wardCode])

  const loadRevenue = useCallback(async () => {
    setLoadingRev(true)
    setErrRev(null)
    try {
      const data = await apiClient.get<WaterRevenueDashboard>(
        `/api/water/dashboard/revenue?finyr=${encodeURIComponent(finYr)}&wardCode=${encodeURIComponent(wardCode)}&divCode=${encodeURIComponent(divCode)}`
      )
      setRevenue(data)
    } catch (e: unknown) {
      setErrRev(e instanceof Error ? e.message : 'Failed to load revenue data')
    } finally {
      setLoadingRev(false)
    }
  }, [finYr, wardCode, divCode])

  const loadConnections = useCallback(async () => {
    setLoadingConn(true)
    setErrConn(null)
    try {
      const data = await apiClient.get<WaterConnectionDashboard>(
        `/api/water/dashboard/connections?wardCode=${encodeURIComponent(wardCode)}&divCode=${encodeURIComponent(divCode)}`
      )
      setConnections(data)
    } catch (e: unknown) {
      setErrConn(e instanceof Error ? e.message : 'Failed to load connections data')
    } finally {
      setLoadingConn(false)
    }
  }, [wardCode, divCode])

  useEffect(() => { loadRevenue() }, [loadRevenue])
  useEffect(() => { loadConnections() }, [loadConnections])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadRevenue(), loadConnections()])
    setRefreshing(false)
  }, [loadRevenue, loadConnections])

  const isLoading = loadingRev || loadingConn

  return (
    <div className="dept-layout">
      <DeptSidebar
        deptKey={DEPT_KEY}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      <main className="erp-main">
        {/* ── Breadcrumb ── */}
        <nav className="dash-breadcrumb" aria-label="Breadcrumb">
          <Link href="/" className="dash-breadcrumb-home">
            <i className="bi bi-house-door-fill" aria-hidden="true" /> {T.nav.home}
          </Link>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="dash-breadcrumb-current">{dept.label}</span>
          <span className="dash-breadcrumb-sep" aria-hidden="true">›</span>
          <span className="dash-breadcrumb-current">{T.nav.dashboard}</span>
        </nav>

        {/* ── Department Header ── */}
        <div className="dash-dept-header">
          <button
            type="button"
            className="dept-sidebar-toggle-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-expanded={sidebarOpen}
          >
            <i className={`bi ${sidebarOpen ? 'bi-layout-sidebar-inset' : 'bi-layout-sidebar'}`} aria-hidden="true" />
          </button>
          <div
            className="dash-dept-icon"
            style={{ background: dept.colorBg, color: dept.color }}
            aria-hidden="true"
          >
            <i className={`bi ${dept.icon}`} />
          </div>
          <div className="dash-dept-info">
            <h1 className="dash-dept-title">{dept.label}</h1>
            <p className="dash-dept-desc">
              {dept.description}
              {isLoading && <span className="wt-live-dot" title="Loading…" style={{ marginLeft: '0.5rem' }} />}
            </p>
          </div>
        </div>

        {/* ── View Tabs ── */}
        <div className="dash-view-tabs" role="tablist" aria-label="Dashboard views">
          <button
            role="tab"
            aria-selected={tab === 'revenue'}
            className={`dash-view-tab${tab === 'revenue' ? ' active' : ''}`}
            onClick={() => setTab('revenue')}
          >
            <i className="bi bi-graph-up-arrow" aria-hidden="true" />
            <span>Revenue &amp; Collection</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === 'connections'}
            className={`dash-view-tab${tab === 'connections' ? ' active' : ''}`}
            onClick={() => setTab('connections')}
          >
            <i className="bi bi-diagram-3-fill" aria-hidden="true" />
            <span>Water Connections</span>
          </button>
        </div>

        {/* ── Filters Bar ── */}
        <div className="dash-filters" role="search" aria-label="Dashboard filters">
          <div className="dash-filter-group">
            <label className="dash-filter-label">Ward</label>
            <select
              className="dash-filter-input"
              value={wardCode}
              onChange={e => setWardCode(e.target.value)}
            >
              {WARDS.map(w => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>
          </div>

          {wardCode !== '0' && (
            <div className="dash-filter-group">
              <label className="dash-filter-label">Division</label>
              <select
                className="dash-filter-input"
                value={divCode}
                onChange={e => setDivCode(e.target.value)}
              >
                <option value="0">All Divisions</option>
                {divisions.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="dash-filter-group">
            <label className="dash-filter-label">Financial Year</label>
            <select
              className="dash-filter-input"
              value={finYr}
              onChange={e => setFinYr(e.target.value)}
              disabled={tab === 'connections'}
            >
              {FIN_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="dash-filter-actions">
            <button
              type="button"
              className="dash-filter-btn-apply"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh data"
            >
              <i className={`bi bi-arrow-clockwise${refreshing ? ' spinning' : ''}`} aria-hidden="true" />
              {refreshing ? ' Refreshing…' : ' Refresh'}
            </button>
          </div>
        </div>

        {/* ── Tab Content ── */}
        <div style={{ padding: '0 1.5rem 2rem' }}>
          {tab === 'revenue' && (
            <RevenueTab
              data={revenue}
              loading={loadingRev}
              error={errRev}
              finYr={finYr}
              onRetry={loadRevenue}
            />
          )}
          {tab === 'connections' && (
            <ConnectionsTab
              data={connections}
              loading={loadingConn}
              error={errConn}
              onRetry={loadConnections}
            />
          )}
        </div>
      </main>
    </div>
  )
}
