'use client'

import type { WaterConnectionDashboard } from '@smkc/types'

interface Props {
  data: WaterConnectionDashboard | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

function fmt(n: number | undefined | null) {
  return (n ?? 0).toLocaleString('en-IN')
}
function pct(n: number | undefined | null) {
  return `${(n ?? 0).toFixed(1)}%`
}

function DonutChart({ segments, size = 130 }: {
  segments: { label: string; value: number; color: string }[]
  size?: number
}) {
  const r  = size / 2 - 12
  const cx = size / 2
  const cy = size / 2
  const total = segments.reduce((s, v) => s + v.value, 0)
  let angle = -90
  const paths = segments.map((s) => {
    const sweep = total > 0 ? (s.value / total) * 360 : 360 / segments.length
    const rad1  = (angle * Math.PI) / 180
    const rad2  = ((angle + sweep) * Math.PI) / 180
    const x1    = cx + r * Math.cos(rad1)
    const y1    = cy + r * Math.sin(rad1)
    const x2    = cx + r * Math.cos(rad2)
    const y2    = cy + r * Math.sin(rad2)
    const large = sweep > 180 ? 1 : 0
    const d     = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    angle += sweep
    return { ...s, d, pct: total > 0 ? Math.round(s.value / total * 100) : 0 }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#f0f4f8" />
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="#fff" strokeWidth={2} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
    </svg>
  )
}

const USAGE_COLORS = ['#1565C0', '#2E7D32', '#C62828', '#E65100', '#6A1B9A', '#00695C', '#AD1457']
const MS_COLORS: Record<string, string> = {
  'Working':      '#2E7D32',
  'Not Working':  '#C62828',
  'Locked':       '#E65100',
  'House Locked': '#E65100',
}
const MS_KPI_CONFIG: Record<string, { icon: string; accent: string; light: string }> = {
  'Working':      { icon: 'bi-check-circle-fill',  accent: '#2E7D32', light: '#F0FDF4' },
  'Not Working':  { icon: 'bi-tools',              accent: '#C62828', light: '#FEF2F2' },
  'Locked':       { icon: 'bi-house-lock-fill',    accent: '#E65100', light: '#FFF7ED' },
  'House Locked': { icon: 'bi-house-lock-fill',    accent: '#E65100', light: '#FFF7ED' },
}

export default function ConnectionsTab({ data, loading, error, onRetry }: Props) {
  if (loading) {
    return (
      <div className="wt-loading-state">
        <div className="wt-spinner" />
        <span>Loading connections data…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="wt-error-state">
        <i className="bi bi-exclamation-triangle-fill" />
        <div>
          <strong>Failed to load data</strong>
          <p>{error}</p>
          <button className="wt-retry-btn" onClick={onRetry}>
            <i className="bi bi-arrow-clockwise" /> Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const kpis = [
    {
      label:  'Total Connections',
      value:  fmt(data.total),
      icon:   'bi-droplet-fill',
      accent: '#1565C0',
      light:  '#EFF6FF',
    },
    {
      label:  'New Pending',
      sub:    'Awaiting activation',
      value:  fmt(data.newPending),
      icon:   'bi-hourglass-split',
      accent: '#E65100',
      light:  '#FFF7ED',
    },
    {
      label:  'Perm. Disconnected',
      sub:    'Permanently closed',
      value:  fmt(data.permDisconnected),
      icon:   'bi-x-circle-fill',
      accent: '#C62828',
      light:  '#FEF2F2',
    },
    ...(data.meterStatusBreakdown ?? []).map((ms) => {
      const cfg = MS_KPI_CONFIG[ms.msDesc ?? ''] ?? { icon: 'bi-speedometer', accent: '#6A1B9A', light: '#FAF5FF' }
      return {
        label:  ms.msDesc ?? 'Unknown',
        sub:    `${pct(ms.pctShare)} of metered`,
        value:  fmt(ms.count),
        icon:   cfg.icon,
        accent: cfg.accent,
        light:  cfg.light,
      }
    }),
  ]

  const usageSegs = (data.usageTypeBreakdown ?? []).map((u, i) => ({
    label: u.usageName,
    value: u.count,
    color: USAGE_COLORS[i % USAGE_COLORS.length],
  }))

  const pipeMax  = Math.max(...(data.pipeSizeBreakdown ?? []).map(p => p.total), 1)
  const connTrend = [...(data.newConnectionTrend ?? [])].reverse()
  const connMax   = Math.max(...connTrend.map(c => c.total), 1)

  const totalConns = data.total ?? 0

  return (
    <div className="wt-tab-content">

      {/* ── KPI GRID ── */}
      <div className="wt-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="wt-kpi-card" style={{ '--kpi-accent': k.accent, '--kpi-light': k.light } as React.CSSProperties}>
            <div className="wt-kpi-icon-wrap">
              <i className={`bi ${k.icon}`} />
            </div>
            <div className="wt-kpi-info">
              <div className="wt-kpi-val">{k.value}</div>
              <div className="wt-kpi-lbl">{k.label}</div>
              {k.sub && <div className="wt-kpi-sub">{k.sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* ── CONNECTION MIX BANNER ── */}
      <div className="wt-efficiency-banner">
        <div className="wt-eff-banner-left">
          <span className="wt-eff-banner-title">Metered Coverage</span>
          <span className="wt-eff-banner-val" style={{ color: '#1565C0' }}>
            {pct(totalConns > 0 ? (data.metered ?? 0) / totalConns * 100 : 0)}
          </span>
        </div>
        <div className="wt-eff-banner-track">
          <div
            className="wt-eff-banner-fill"
            style={{
              width: `${totalConns > 0 ? Math.min((data.metered ?? 0) / totalConns * 100, 100) : 0}%`,
              background: '#1565C0',
            }}
          />
        </div>
        <div className="wt-eff-banner-right">
          <span>{fmt(data.metered)} metered of {fmt(totalConns)} total connections</span>
        </div>
      </div>

      {/* ── USAGE TYPE + METER STATUS ── */}
      <div className="wt-row-2">
        {/* Usage type */}
        <div className="wt-section">
          <div className="wt-section-header">
            <i className="bi bi-pie-chart-fill" />
            <span>Connections by Usage Type</span>
          </div>
          <div className="wt-section-body">
            {usageSegs.length === 0 ? (
              <p className="wt-empty">No data available</p>
            ) : (
              <div className="wt-donut-layout">
                <DonutChart segments={usageSegs} size={130} />
                <div className="wt-donut-legend">
                  {(data.usageTypeBreakdown ?? []).map((u, i) => (
                    <div key={i} className="wt-donut-legend-item">
                      <span className="wt-legend-dot" style={{ background: USAGE_COLORS[i % USAGE_COLORS.length] }} />
                      <div>
                        <div className="wt-legend-name">{u.usageName}</div>
                        <div className="wt-legend-meta">{fmt(u.count)} · {(u.pctShare ?? 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Meter status */}
        <div className="wt-section">
          <div className="wt-section-header">
            <i className="bi bi-speedometer" />
            <span>Meter Status Breakdown</span>
          </div>
          <div className="wt-section-body">
            {(data.meterStatusBreakdown ?? []).length === 0 ? (
              <p className="wt-empty">No meter data</p>
            ) : (
              <>
                <div className="wt-ms-cards">
                  {(data.meterStatusBreakdown ?? []).map((ms, i) => {
                    const col = MS_COLORS[ms.msDesc] ?? USAGE_COLORS[i % USAGE_COLORS.length]
                    return (
                      <div key={i} className="wt-ms-card" style={{ '--ms-color': col } as React.CSSProperties}>
                        <div className="wt-ms-val">{fmt(ms.count)}</div>
                        <div className="wt-ms-desc">{ms.msDesc}</div>
                        <div className="wt-ms-pct">{pct(ms.pctShare)}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="wt-stack-bar">
                  {(data.meterStatusBreakdown ?? []).map((ms, i) => {
                    const col = MS_COLORS[ms.msDesc] ?? USAGE_COLORS[i % USAGE_COLORS.length]
                    return (
                      <div
                        key={i}
                        className="wt-stack-seg"
                        style={{ width: `${ms.pctShare ?? 0}%`, background: col }}
                        title={`${ms.msDesc}: ${fmt(ms.count)} (${pct(ms.pctShare)})`}
                      />
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── PIPE SIZE ── */}
      <div className="wt-section">
        <div className="wt-section-header">
          <i className="bi bi-funnel-fill" />
          <span>Connections by Pipe Size</span>
        </div>
        <div className="wt-section-body">
          {(data.pipeSizeBreakdown ?? []).length === 0 ? (
            <p className="wt-empty">No pipe data</p>
          ) : (
            <div className="wt-table-wrap">
              <table className="wt-table">
                <thead>
                  <tr>
                    <th>Size (mm / inch)</th>
                    <th className="text-right">Total</th>
                    <th className="text-right">Residential</th>
                    <th className="text-right">Others</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.pipeSizeBreakdown ?? []).map((p, i) => (
                    <tr key={i}>
                      <td><strong>{p.pipeDescMm}</strong> / {p.pipeDescInch}</td>
                      <td className="text-right">{fmt(p.total)}</td>
                      <td className="text-right">{fmt(p.residential)}</td>
                      <td className="text-right">{fmt(p.nonResidential)}</td>
                      <td>
                        <div className="wt-inline-bar-wrap">
                          <div className="wt-inline-bar-track">
                            <div
                              className="wt-inline-bar-fill"
                              style={{ width: `${Math.round((p.total / pipeMax) * 100)}%`, background: '#6A1B9A' }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── NEW CONNECTIONS TREND ── */}
      <div className="wt-section">
        <div className="wt-section-header">
          <i className="bi bi-graph-up-arrow" />
          <span>New Connections by Year</span>
        </div>
        <div className="wt-section-body">
          {connTrend.length === 0 ? (
            <p className="wt-empty">No data</p>
          ) : (
            <>
              <div className="wt-bar-chart-h" style={{ '--bar-color': '#6A1B9A' } as React.CSSProperties}>
                {connTrend.map((c, i) => (
                  <div key={i} className="wt-bar-col">
                    <div className="wt-bar-col-track">
                      <div
                        className="wt-bar-col-fill conn"
                        style={{ height: `${Math.round((c.total / connMax) * 100)}%` }}
                        title={`${c.connYear}: ${fmt(c.total)}`}
                      />
                    </div>
                    <div className="wt-bar-col-label">{(c.connYear ?? '').slice(2)}</div>
                  </div>
                ))}
              </div>
              <div className="wt-table-wrap" style={{ marginTop: '1.25rem' }}>
                <table className="wt-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Residential</th>
                      <th className="text-right">Others</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(data.newConnectionTrend ?? [])].slice(0, 8).map((c, i) => (
                      <tr key={i}>
                        <td>{c.connYear}</td>
                        <td className="text-right">{fmt(c.total)}</td>
                        <td className="text-right">{fmt(c.residential)}</td>
                        <td className="text-right">{fmt(c.nonResidential)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── WARD-WISE SUMMARY ── */}
      <div className="wt-section">
        <div className="wt-section-header">
          <i className="bi bi-map-fill" />
          <span>Ward-wise Connection Summary</span>
        </div>
        <div className="wt-section-body">
          <div className="wt-table-wrap">
            <table className="wt-table">
              <thead>
                <tr>
                  <th>Ward</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Residential</th>
                  <th className="text-right">Non-Residential</th>
                  <th className="text-right">Metered</th>
                  <th className="text-right">Perm. Disc.</th>
                  <th>Residential %</th>
                </tr>
              </thead>
              <tbody>
                {(data.wardStats ?? []).map((w, i) => (
                  <tr key={i}>
                    <td><strong>{w.wardName}</strong></td>
                    <td className="text-right">{fmt(w.total)}</td>
                    <td className="text-right">{fmt(w.residential)}</td>
                    <td className="text-right">{fmt(w.nonResidential)}</td>
                    <td className="text-right">{fmt(w.metered)}</td>
                    <td className="text-right wt-text-danger">{fmt(w.permDisc)}</td>
                    <td>
                      <div className="wt-inline-bar-wrap">
                        <div className="wt-inline-bar-track">
                          <div
                            className="wt-inline-bar-fill"
                            style={{
                              width: `${(w.total ?? 0) > 0 ? Math.round((w.residential ?? 0) / (w.total ?? 1) * 100) : 0}%`,
                              background: '#1565C0',
                            }}
                          />
                        </div>
                        <span className="wt-inline-bar-label">
                          {(w.total ?? 0) > 0 ? `${Math.round((w.residential ?? 0) / (w.total ?? 1) * 100)}%` : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}
