import { DEPARTMENTS } from '@smkc/types'
import Link from 'next/link'
import type { CSSProperties } from 'react'

export default function Home() {
  return (
    <main className="erp-main">
      {/* ── Page Header ── */}
      <div className="erp-page-header">
        <div className="erp-page-header-text">
          <p className="erp-page-kicker">SMKC Enterprise Resource Planning</p>
          <h1 className="erp-page-title">Department Portal</h1>
          <p className="erp-page-subtitle">
            Select a department to access its dashboard, records, and management tools.
          </p>
        </div>
        <div className="erp-dept-count-badge">
          <span className="erp-dept-count-num">{DEPARTMENTS.length}</span>
          <span className="erp-dept-count-label">Departments</span>
        </div>
      </div>

      {/* ── Department Cards Grid ── */}
      <nav className="dept-grid" aria-label="Department Navigation">
        {DEPARTMENTS.map((dept) => (
          <Link
            key={dept.key}
            href={`${dept.route}/dashboard`}
            className="dept-card"
            style={
              {
                '--dept-color': dept.color,
                '--dept-bg': dept.colorBg,
              } as CSSProperties
            }
          >
            {/* Top row: icon + arrow */}
            <div className="dept-card-top">
              <div className="dept-card-icon">
                <i className={`bi ${dept.icon}`} aria-hidden="true" />
              </div>
              <i className="bi bi-arrow-right-circle dept-card-arrow" aria-hidden="true" />
            </div>
            {/* Body: name + description */}
            <div className="dept-card-body">
              <span className="dept-card-name">{dept.label}</span>
              <span className="dept-card-desc">{dept.description}</span>
            </div>
          </Link>
        ))}
      </nav>
    </main>
  )
}
