'use client'

import type { WaterRevenueDashboard } from '@smkc/types'

interface Props {
  data: WaterRevenueDashboard | null
  loading: boolean
  error: string | null
  finYr: string
  onRetry: () => void
}

function fmt(n: number | undefined | null): string {
  const v = n ?? 0
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(2)} Cr`
  if (v >= 1_00_000)    return `₹${(v / 1_00_000).toFixed(2)} L`
  return `₹${v.toLocaleString('en-IN')}`
}

function pct(n: number | undefined | null) {
  return `${(n ?? 0).toFixed(1)}%`
}

function DonutChart({ segments, size = 130 }: {
  segments: { label: string; value: number; color: string }[]
  size?: number
}) {
  const r  = size / 2 - 14
  const cx = size / 2
  const cy = size / 2
  const total = segments.reduce((s, v) => s + v.value, 0)
  let angle = -90
  const paths = segments.map((s) => {
    const sweep = total > 0 ? (s.value / total) * 360 : 0
    const rad1  = (angle * Math.PI) / 180
    const rad2  = ((angle + sweep) * Math.PI) / 180
    const x1    = cx + r * Math.cos(rad1)
    const y1    = cy + r * Math.sin(rad1)
    const x2    = cx + r * Math.cos(rad2)
    const y2    = cy + r * Math.sin(rad2)
    const large = sweep > 180 ? 1 : 0
    const d     = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    angle += sweep
    return { ...s, d }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="#f0f4f8" />
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="#fff" strokeWidth={2} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.54} fill="white" />
    </svg>
  )
}

export default function RevenueTab({ data, loading, error, finYr, onRetry }: Props) {
  if (loading) {
    return (
      <div className="wt-loading-state">
        <div className="wt-spinner" />
        <span>Loading revenue data…</span>
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

  const hasArrear = data.billingCycles && data.billingCycles.length > 1
  const effPct = Math.min(data.collectionEfficiencyPct ?? 0, 100)

  const kpis = [
    {
      label:   'Current Cycle Demand',
      sub:     data.currentCycleDesc,
      value:   fmt(data.currentCycleDemand),
      icon:    'bi-file-earmark-ruled',
      accent:  '#1565C0',
      light:   '#EFF6FF',
    },
    {
      label:   'Total Collected',
      sub:     `${pct(data.collectionEfficiencyPct)} efficiency`,
      value:   fmt(data.totalCollected),
      icon:    'bi-check-circle-fill',
      accent:  '#2E7D32',
      light:   '#F0FDF4',
    },
    {
      label:   'Total Outstanding',
      sub:     `Prev yrs: ${fmt(data.prevYearsArrearBalance)}`,
      value:   fmt(data.totalOutstanding),
      icon:    'bi-exclamation-circle-fill',
      accent:  '#C62828',
      light:   '#FEF2F2',
    },
    {
      label:   "Today's Collection",
      sub:     finYr,
      value:   fmt(data.todayCollection),
      icon:    'bi-lightning-charge-fill',
      accent:  '#E65100',
      light:   '#FFF7ED',
    },
    {
      label:   'Late Fees Balance',
      sub:     `Charged: ${fmt(data.currentCycleLateFees)}`,
      value:   fmt(data.currentCycleLateFeesBalance),
      icon:    'bi-clock-history',
      accent:  '#6A1B9A',
      light:   '#FAF5FF',
    },
    {
      label:   'Excess Credit',
      sub:     'Advance payments',
      value:   fmt(data.excessCreditBalance),
      icon:    'bi-wallet2',
      accent:  '#00695C',
      light:   '#F0FDFA',
    },
  ]

  const yearlyItems = (data.yearlyTrend ?? []).slice(-6).map(y => ({
    label:  y.finYr.replace('20', '').replace('-', '–'),
    demand: y.demand,
    paid:   y.collected,
  }))
  const yearMax = Math.max(...yearlyItems.map(y => y.demand), 1)

  const ly = data.lastYearInsights ?? null

  const pmColors = ['#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#C62828']
  const pmSegments = (data.paymentMethods ?? []).map((p, i) => ({
    label: p.method,
    value: p.amount,
    color: pmColors[i % pmColors.length],
  }))

  const defColors = ['#1565C0', '#2E7D32', '#E65100', '#6A1B9A', '#C62828', '#00695C', '#AD1457']
  const defItems = (data.defaultersByUsage ?? []).map((d, i) => ({
    label:  d.usageName,
    value:  d.balanceAmt,
    color:  defColors[i % defColors.length],
    conns:  d.pendingConns,
    pct:    d.pctShare,
  }))
  const defMax = Math.max(...defItems.map(d => d.value), 1)

  return (
    <div className="wt-tab-content">

      {/* â”€â”€ KPI GRID â”€â”€ */}
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

      {/* â”€â”€ COLLECTION EFFICIENCY BANNER â”€â”€ */}
      <div className="wt-efficiency-banner">
        <div className="wt-eff-banner-left">
          <span className="wt-eff-banner-title">Collection Efficiency – {finYr}</span>
          <span className="wt-eff-banner-val" style={{ color: effPct >= 70 ? '#2E7D32' : effPct >= 40 ? '#E65100' : '#C62828' }}>
            {pct(data.collectionEfficiencyPct)}
          </span>
        </div>
        <div className="wt-eff-banner-track">
          <div
            className="wt-eff-banner-fill"
            style={{
              width: `${effPct}%`,
              background: effPct >= 70 ? '#2E7D32' : effPct >= 40 ? '#E65100' : '#C62828',
            }}
          />
        </div>
        <div className="wt-eff-banner-right">
          <span>{fmt(data.totalCollected)} collected of {fmt(data.totalDemand)} demand</span>
        </div>
      </div>

      {/* â”€â”€ BILLING CYCLE TABLE â”€â”€ */}
      {data.billingCycles && data.billingCycles.length > 0 && (
        <div className="wt-section">
          <div className="wt-section-header">
            <i className="bi bi-receipt-cutoff" />
            <span>Billing Cycle Breakdown – {finYr}</span>
          </div>
          <div className="wt-section-body">
            <div className="wt-table-wrap">
              <table className="wt-table">
                <thead>
                  <tr>
                    <th>Cycle</th>
                    <th className="text-right">Billed</th>
                    <th className="text-right">Demand</th>
                    <th className="text-right">Paid</th>
                    <th className="text-right">Balance</th>
                    <th className="text-right">Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {data.billingCycles.map((c, i) => (
                    <tr key={i} className={c.isCurrentCycle ? 'wt-row-highlight' : ''}>
                      <td>
                        <span className={`wt-cycle-badge ${c.isCurrentCycle ? 'current' : 'arrear'}`}>
                          {c.isCurrentCycle ? 'Current' : 'Curr Yr Arrear'}
                        </span>
                        {c.cycleDesc}
                        {((c.meterRent ?? 0) > 0 || (c.lateFees ?? 0) > 0) && (
                          <div className="wt-cycle-breakdown">
                            {(c.meterRent ?? 0) > 0 && <span>Meter Rent: {fmt(c.meterRent)}</span>}
                            {(c.lateFees ?? 0) > 0 && <span>Interest: {fmt(c.lateFees)}</span>}
                          </div>
                        )}
                      </td>
                      <td className="text-right">{(c.billedCount ?? 0).toLocaleString('en-IN')}</td>
                      <td className="text-right">{fmt(c.demand)}</td>
                      <td className="text-right wt-text-success">{fmt(c.paid)}</td>
                      <td className="text-right wt-text-danger">{fmt(c.balance)}</td>
                      <td className="text-right">
                        {(c.demand ?? 0) > 0 ? pct((c.paid ?? 0) / (c.demand ?? 1) * 100) : '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Previous Year Arrears row */}
                  <tr className="wt-row-prev-arrear">
                    <td>
                      <span className="wt-cycle-badge prev-arrear">Prev Yr Arrears</span>
                      Carried forward from previous years
                    </td>
                    <td className="text-right">—</td>
                    <td className="text-right">—</td>
                    <td className="text-right wt-text-success">{fmt(data.prevYearsArrearCollected)}</td>
                    <td className="text-right wt-text-danger">{fmt(data.prevYearsArrearBalance)}</td>
                    <td className="text-right">—</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="wt-row-total">
                    <td><strong>Curr Year Demand</strong></td>
                    <td className="text-right">—</td>
                    <td className="text-right"><strong>{fmt(data.totalDemand)}</strong></td>
                    <td className="text-right wt-text-success"><strong>{fmt(data.totalCollected)}</strong></td>
                    <td className="text-right wt-text-danger"><strong>{fmt((data.currentCycleBalance ?? 0) + (data.currYrArrearBalance ?? 0))}</strong></td>
                    <td className="text-right"><strong>{pct(data.collectionEfficiencyPct)}</strong></td>
                  </tr>
                  <tr className="wt-row-grand-total">
                    <td><strong>Total Collected (incl. Prev Arrears)</strong></td>
                    <td className="text-right">—</td>
                    <td className="text-right">—</td>
                    <td className="text-right wt-text-success"><strong>{fmt((data.totalCollected ?? 0) + (data.prevYearsArrearCollected ?? 0))}</strong></td>
                    <td className="text-right wt-text-danger"><strong>{fmt(data.totalOutstanding)}</strong></td>
                    <td className="text-right">—</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ CHARTS ROW â”€â”€ */}
      <div className="wt-row-2">

        {/* 2025-26 at a Glance */}
        <div className="wt-section wt-col-wide">
          <div className="wt-section-header">
            <i className="bi bi-calendar-check-fill" />
            <span>2025-26 · Year Closed – at a Glance</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '2px 9px', borderRadius: 10, background: '#DCFCE7', color: '#15803D', fontWeight: 700, letterSpacing: '0.03em' }}>
              CLOSED
            </span>
          </div>
          <div className="wt-section-body">
            {!ly ? (
              <p className="wt-empty">No last-year data available</p>
            ) : (
              <>
                {/* Stat pills */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {([
                    { label: 'Total Demand',  value: fmt(ly.totalDemand),                     color: '#1565C0' },
                    { label: 'Collected',     value: fmt(ly.totalCollected),                   color: '#2E7D32' },
                    { label: 'Efficiency',    value: `${(ly.collectionEfficiencyPct ?? 0).toFixed(1)}%`, color: (ly.collectionEfficiencyPct ?? 0) >= 70 ? '#2E7D32' : (ly.collectionEfficiencyPct ?? 0) >= 40 ? '#E65100' : '#C62828' },
                    { label: 'Carried Fwd',  value: fmt(ly.carriedForward),                   color: '#C62828' },
                    { label: 'Billed Conns', value: (ly.connectionsBilled ?? 0).toLocaleString('en-IN'), color: '#4A148C' },
                  ] as { label: string; value: string; color: string }[]).map((s, i) => (
                    <div key={i} style={{ flex: '1 1 0', minWidth: 88, padding: '8px 10px', background: '#F8FAFC', border: `1.5px solid ${s.color}33`, borderRadius: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.67rem', color: '#64748B', marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Demand vs collection component breakdown */}
                <div className="wt-table-wrap" style={{ marginBottom: '1rem' }}>
                  <table className="wt-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th className="text-right">Demand</th>
                        <th className="text-right">Collected</th>
                        <th className="text-right">Balance</th>
                        <th className="text-right">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Water Charge</td>
                        <td className="text-right">{fmt(ly.waterCharge)}</td>
                        <td className="text-right wt-text-success">{fmt(ly.waterChargeCollected)}</td>
                        <td className="text-right wt-text-danger">{fmt((ly.waterCharge ?? 0) - (ly.waterChargeCollected ?? 0))}</td>
                        <td className="text-right">{(ly.waterCharge ?? 0) > 0 ? `${((ly.waterChargeCollected ?? 0) / (ly.waterCharge ?? 1) * 100).toFixed(1)}%` : '—'}</td>
                      </tr>
                      <tr>
                        <td>Meter Rent</td>
                        <td className="text-right">{fmt(ly.meterRentBilled)}</td>
                        <td className="text-right wt-text-success">{fmt(ly.meterRentCollected)}</td>
                        <td className="text-right wt-text-danger">{fmt((ly.meterRentBilled ?? 0) - (ly.meterRentCollected ?? 0))}</td>
                        <td className="text-right">{(ly.meterRentBilled ?? 0) > 0 ? `${((ly.meterRentCollected ?? 0) / (ly.meterRentBilled ?? 1) * 100).toFixed(1)}%` : '—'}</td>
                      </tr>
                      <tr>
                        <td>Late Fees</td>
                        <td className="text-right">{fmt(ly.lateFeesBilled)}</td>
                        <td className="text-right wt-text-success">{fmt(ly.lateFeesCollected)}</td>
                        <td className="text-right wt-text-danger">{fmt((ly.lateFeesBilled ?? 0) - (ly.lateFeesCollected ?? 0))}</td>
                        <td className="text-right">{(ly.lateFeesBilled ?? 0) > 0 ? `${((ly.lateFeesCollected ?? 0) / (ly.lateFeesBilled ?? 1) * 100).toFixed(1)}%` : '—'}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr className="wt-row-total">
                        <td><strong>Total</strong></td>
                        <td className="text-right"><strong>{fmt(ly.totalDemand)}</strong></td>
                        <td className="text-right wt-text-success"><strong>{fmt(ly.totalCollected)}</strong></td>
                        <td className="text-right wt-text-danger"><strong>{fmt(ly.carriedForward)}</strong></td>
                        <td className="text-right"><strong>{(ly.collectionEfficiencyPct ?? 0).toFixed(1)}%</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Billing cycle cards */}
                {(ly.billingCycles ?? []).length > 0 && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {(ly.billingCycles ?? []).map((bc, i) => (
                      <div key={i} style={{ flex: '1 1 0', minWidth: 200, padding: '10px 13px', background: i === 0 ? '#EFF6FF' : '#F8F9FA', borderRadius: 8, border: `1px solid ${i === 0 ? '#BFDBFE' : '#E2E8F0'}` }}>
                        <div style={{ fontWeight: 600, fontSize: '0.78rem', color: i === 0 ? '#1565C0' : '#475569', marginBottom: 6 }}>
                          {i === 0 ? 'Current Cycle' : 'Earlier Cycle'} · {bc.bcDesc}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem', fontSize: '0.76rem' }}>
                          <span>Billed: <strong>{(bc.billedCount ?? 0).toLocaleString('en-IN')}</strong></span>
                          <span>Demand: <strong>{fmt(bc.demand)}</strong></span>
                          <span>Collected: <strong style={{ color: '#2E7D32' }}>{fmt(bc.collected)}</strong></span>
                          <span>Balance: <strong style={{ color: '#C62828' }}>{fmt(bc.balance)}</strong></span>
                          <span>Eff: <strong>{(bc.efficiencyPct ?? 0).toFixed(1)}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Connection clearance bar */}
                <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.73rem', color: '#64748B', marginBottom: 6, fontWeight: 600 }}>Connection Status at Year-End</div>
                  {(() => {
                    const total    = (ly.connectionsCleared ?? 0) + (ly.connectionsPending ?? 0)
                    const pctClrd  = total > 0 ? (ly.connectionsCleared ?? 0) / total * 100 : 0
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden', height: 16 }}>
                          <div style={{ width: `${pctClrd}%`, background: '#2E7D32', transition: 'width 0.4s' }} title={`Fully Paid: ${(ly.connectionsCleared ?? 0).toLocaleString('en-IN')}`} />
                          <div style={{ flex: 1, background: '#FECACA' }} title={`Pending: ${(ly.connectionsPending ?? 0).toLocaleString('en-IN')}`} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', fontSize: '0.72rem', gap: '0.25rem 1.5rem' }}>
                          <span><span style={{ color: '#2E7D32', fontWeight: 700 }}>■</span> Fully Paid: {(ly.connectionsCleared ?? 0).toLocaleString('en-IN')} ({pctClrd.toFixed(1)}%)</span>
                          <span><span style={{ color: '#C62828', fontWeight: 700 }}>■</span> Pending: {(ly.connectionsPending ?? 0).toLocaleString('en-IN')} ({(100 - pctClrd).toFixed(1)}%)</span>
                          <span style={{ marginLeft: 'auto' }}>Total billed: <strong>{total.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </>
            )}
          </div>
        </div>        {/* Payment Methods */}
        <div className="wt-section wt-col-narrow">
          <div className="wt-section-header">
            <i className="bi bi-pie-chart-fill" />
            <span>Payment Methods</span>
          </div>
          <div className="wt-section-body">
            {pmSegments.length === 0 ? (
              <p className="wt-empty">No payment data</p>
            ) : (
              <div className="wt-donut-layout">
                <DonutChart segments={pmSegments} size={130} />
                <div className="wt-donut-legend">
                  {(data.paymentMethods ?? []).map((p, i) => (
                    <div key={i} className="wt-donut-legend-item">
                      <span className="wt-legend-dot" style={{ background: pmColors[i % pmColors.length] }} />
                      <div>
                        <div className="wt-legend-name">{p.method}</div>
                        <div className="wt-legend-meta">{fmt(p.amount)} · {(p.pctShare ?? 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* â”€â”€ MONTHLY COLLECTION TREND â”€â”€ */}
      <div className="wt-section">
        <div className="wt-section-header">
          <i className="bi bi-graph-up" />
            <span>Monthly Collection Trend – {finYr}</span>
        </div>
        <div className="wt-section-body">
          {(data.monthlyTrend ?? []).length === 0 ? (
            <p className="wt-empty">No monthly data available</p>
          ) : (
            (() => {
              const months  = data.monthlyTrend ?? []
              const maxAmt  = Math.max(...months.map(m => m.amount), 1)
              return (
                <>
                  <div className="wt-monthly-legend">
                    <i className="bi bi-info-circle" />
                    <span>Bar height = amount collected · Count below = number of receipts</span>
                  </div>
                  <div className="wt-bar-chart-h">
                    {months.map((m, i) => {
                      const [mon, yr] = m.monthYr.split('-')
                      const yrAbbr = (yr ?? '').slice(2)
                      return (
                        <div key={i} className="wt-bar-col">
                          <div className="wt-bar-col-amt" title="Amount collected">{fmt(m.amount)}</div>
                          <div className="wt-bar-col-track">
                            <div
                              className="wt-bar-col-fill"
                              style={{ height: `${Math.round((m.amount / maxAmt) * 100)}%` }}
                              title={`${m.monthYr}: ${fmt(m.amount)} | ${(m.receipts ?? 0).toLocaleString('en-IN')} receipts`}
                            />
                          </div>
                          <div className="wt-bar-col-label">{mon}</div>
                          <div className="wt-bar-col-yr">&apos;{yrAbbr}</div>
                          <div className="wt-bar-col-rcpt" title="Receipts count">{(m.receipts ?? 0).toLocaleString('en-IN')}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()
          )}
        </div>
      </div>

      {/* â”€â”€ WARD + DEFAULTERS â”€â”€ */}
      <div className="wt-row-2">
        {/* Ward-wise revenue */}
        <div className="wt-section">
          <div className="wt-section-header">
            <i className="bi bi-map-fill" />
            <span>Ward-wise Revenue – {finYr}</span>
          </div>
          <div className="wt-section-body">
            <div className="wt-table-wrap">
              <table className="wt-table">
                <thead>
                  <tr>
                    <th>Ward</th>
                    <th className="text-right">Demand</th>
                    <th className="text-right">Collected</th>
                    <th>Efficiency</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.wardStats ?? []).map((w, i) => (
                    <tr key={i}>
                      <td><strong>{w.wardName}</strong></td>
                      <td className="text-right">{fmt(w.demand)}</td>
                      <td className="text-right wt-text-success">{fmt(w.collected)}</td>
                      <td>
                        <div className="wt-inline-bar-wrap">
                          <div className="wt-inline-bar-track">
                            <div
                              className="wt-inline-bar-fill"
                              style={{
                                width: `${Math.min(w.efficiencyPct ?? 0, 100)}%`,
                                background: (w.efficiencyPct ?? 0) >= 70 ? '#2E7D32' : '#E65100',
                              }}
                            />
                          </div>
                          <span className="wt-inline-bar-label">{pct(w.efficiencyPct)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pending demand by usage */}
        <div className="wt-section">
          <div className="wt-section-header">
            <i className="bi bi-bar-chart-steps" />
            <span>Pending Demand by Usage – {finYr}</span>
          </div>
          <div className="wt-section-body">
            {defItems.length === 0 ? (
              <p className="wt-empty">No defaulter data</p>
            ) : (
              <div className="wt-hbar-chart">
                {defItems.map((d, i) => (
                  <div key={i} className="wt-hbar-row">
                    <span className="wt-hbar-label" title={d.label}>
                      {d.label.length > 16 ? d.label.slice(0, 15) + '…' : d.label}
                    </span>
                    <div className="wt-hbar-track">
                      <div
                        className="wt-hbar-fill"
                        style={{ width: `${(d.value / defMax) * 100}%`, background: d.color }}
                        title={fmt(d.value)}
                      />
                    </div>
                    <span className="wt-hbar-val">{fmt(d.value)}</span>
                  </div>
                ))}
              </div>
            )}
            {(data.defaultersByUsage ?? []).length > 0 && (
              <div className="wt-table-wrap" style={{ marginTop: '1rem' }}>
                <table className="wt-table">
                  <thead>
                    <tr>
                      <th>Usage Type</th>
                      <th className="text-right">Connections</th>
                      <th className="text-right">Balance</th>
                      <th className="text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.defaultersByUsage ?? []).map((d, i) => (
                      <tr key={i}>
                        <td>
                          <span className="wt-dot-inline" style={{ background: defColors[i % defColors.length] }} />
                          {d.usageName}
                        </td>
                        <td className="text-right">{(d.pendingConns ?? 0).toLocaleString('en-IN')}</td>
                        <td className="text-right wt-text-danger">{fmt(d.balanceAmt)}</td>
                        <td className="text-right">{pct(d.pctShare)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
