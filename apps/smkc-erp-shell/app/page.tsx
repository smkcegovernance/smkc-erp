'use client'

import { DEPARTMENTS } from '@smkc/types'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { useLanguage } from './lib/i18n/LanguageContext'
import { usePermissions, hasDeptAccess } from './lib/permissions'
import { useDepts } from './lib/DeptContext'

export default function Home() {
  const { T, lang } = useLanguage()
  const { permissions } = usePermissions()
  const { depts: dbDepts, loading: deptsLoading } = useDepts()

  // Use DB depts once loaded; fall back to hardcoded DEPARTMENTS during initial load
  const sourceDepts = (!deptsLoading && dbDepts.length > 0)
    ? dbDepts.map((d) => ({
        key: d.routeKey,
        label: lang === 'mr' ? (d.nameMr || d.nameEn) : d.nameEn,
        route: `/${d.routeKey}`,
        icon: d.icon,
        color: d.color,
        colorBg: d.colorBg,
        description: T.depts[d.routeKey]?.description ?? '',
      }))
    : DEPARTMENTS.map((d) => ({
        key: d.key,
        label: T.depts[d.key]?.label ?? d.label,
        route: d.route,
        icon: d.icon,
        color: d.color,
        colorBg: d.colorBg,
        description: T.depts[d.key]?.description ?? d.description,
      }))

  // While permissions are loading (null), show all departments
  const visibleDepts = sourceDepts.filter((dept) =>
    permissions === null || hasDeptAccess(permissions, dept.key)
  )

  return (
    <main className="erp-main">
      {/* ── Page Header ── */}
      <div className="erp-page-header">
        <div className="erp-page-header-text">
          <p className="erp-page-kicker">{T.home.kicker}</p>
          <h1 className="erp-page-title">{T.home.title}</h1>
          <p className="erp-page-subtitle">{T.home.subtitle}</p>
        </div>
        <div className="erp-dept-count-badge">
          <span className="erp-dept-count-num">{visibleDepts.length}</span>
          <span className="erp-dept-count-label">{T.home.departments}</span>
        </div>
      </div>

      {/* ── Department Cards Grid ── */}
      <nav className="dept-grid" aria-label="Department Navigation">
        {visibleDepts.map((dept) => (
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

