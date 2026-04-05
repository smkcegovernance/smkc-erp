'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@smkc/api-client'
import type { WaterConnectionDashboard, WaterRevenueDashboard } from '@smkc/types'
import RevenueTab from './RevenueTab'
import ConnectionsTab from './ConnectionsTab'

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

export default function WaterDashboard() {
  const [tab,       setTab]      = useState<Tab>('revenue')
  const [finYr,     setFinYr]    = useState('2026-2027')
  const [wardCode,  setWardCode] = useState('0')
  const [divCode,   setDivCode]  = useState('0')
  const [divisions, setDivisions] = useState<Division[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const [revenue,     setRevenue]     = useState<WaterRevenueDashboard | null>(null)
  const [connections, setConnections] = useState<WaterConnectionDashboard | null>(null)
  const [loadingRev,  setLoadingRev]  = useState(false)
  const [loadingConn, setLoadingConn] = useState(false)
  const [errRev,      setErrRev]      = useState<string | null>(null)
  const [errConn,     setErrConn]     = useState<string | null>(null)

  // Load division list whenever ward changes
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
    <div className="wt-root">
      {/* ═══ PAGE HEADER ═══ */}
      <div className="wt-page-header">
        <div className="wt-page-header-left">
          <div className="wt-page-icon">
            <i className="bi bi-droplet-fill" />
          </div>
          <div>
            <h1 className="wt-page-title">Water Tax Department</h1>
            <p className="wt-page-subtitle">
              Live dashboard
              <span className="wt-badge-year">{finYr}</span>
              {isLoading && <span className="wt-live-dot" title="Loading…" />}
            </p>
          </div>
        </div>

        <div className="wt-page-header-right">
          {/* Ward filter */}
          <div className="wt-filter-group">
            <label className="wt-filter-label">
              <i className="bi bi-geo-alt" />
            </label>
            <select
              className="wt-select"
              value={wardCode}
              onChange={e => setWardCode(e.target.value)}
            >
              {WARDS.map(w => (
                <option key={w.code} value={w.code}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Division filter — only when a specific ward is selected */}
          {wardCode !== '0' && (
            <div className="wt-filter-group">
              <label className="wt-filter-label">
                <i className="bi bi-diagram-2" />
              </label>
              <select
                className="wt-select"
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

          <div className="wt-filter-group">
            <label className="wt-filter-label">
              <i className="bi bi-calendar3" />
            </label>
            <select
              className="wt-select"
              value={finYr}
              onChange={e => setFinYr(e.target.value)}
              disabled={tab === 'connections'}
            >
              {FIN_YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            className={`wt-refresh-btn${refreshing ? ' spinning' : ''}`}
            onClick={handleRefresh}
            title="Refresh data"
            disabled={refreshing}
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>
      </div>

      {/* ═══ TAB NAV ═══ */}
      <div className="wt-tab-nav">
        <button
          className={`wt-tab-btn${tab === 'revenue' ? ' active' : ''}`}
          onClick={() => setTab('revenue')}
        >
          <i className="bi bi-graph-up-arrow" />
          <span>Revenue &amp; Collection</span>
        </button>
        <button
          className={`wt-tab-btn${tab === 'connections' ? ' active' : ''}`}
          onClick={() => setTab('connections')}
        >
          <i className="bi bi-diagram-3-fill" />
          <span>Water Connections</span>
        </button>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div className="wt-content">
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
    </div>
  )
}
