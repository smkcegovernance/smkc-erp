'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { DEPARTMENTS } from '@smkc/types'
import { DEPT_MENUS, type MenuGroup } from '../lib/dept-menus'

const GROUP_ORDER: Array<MenuGroup['key']> = ['transactions', 'applications', 'reports', 'masters']

interface DeptSidebarProps {
  deptKey: string
  isOpen: boolean
  onToggle: () => void
}

export default function DeptSidebar({ deptKey, isOpen, onToggle }: DeptSidebarProps) {
  const pathname = usePathname()
  const dept = DEPARTMENTS.find((d) => d.key === deptKey)
  const groups = DEPT_MENUS[deptKey] ?? []

  // Track which groups are expanded (all open by default)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(GROUP_ORDER)
  )

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  const orderedGroups = GROUP_ORDER
    .map((key) => groups.find((g) => g.key === key))
    .filter((g): g is MenuGroup => g !== undefined)

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="dept-sidebar-backdrop"
          aria-hidden="true"
          onClick={onToggle}
        />
      )}

      <aside
        className={`dept-sidebar${isOpen ? ' open' : ''}`}
        aria-label={`${dept?.label ?? 'Department'} navigation`}
      >
        {/* ── Sidebar header ── */}
        <div className="dept-sidebar-header">
          <div className="dept-sidebar-dept-icon" style={{ color: dept?.color, background: dept?.colorBg }}>
            <i className={`bi ${dept?.icon ?? 'bi-grid-fill'}`} aria-hidden="true" />
          </div>
          <div className="dept-sidebar-dept-name">
            <span>{dept?.label ?? deptKey}</span>
          </div>
          <button
            type="button"
            className="dept-sidebar-close"
            onClick={onToggle}
            aria-label="Close sidebar"
          >
            <i className="bi bi-x-lg" aria-hidden="true" />
          </button>
        </div>

        {/* ── Dashboard link ── */}
        <div className="dept-sidebar-top-link">
          <Link
            href={`/${deptKey}/dashboard`}
            className={`dept-sidebar-dashboard-link${pathname === `/${deptKey}/dashboard` ? ' active' : ''}`}
          >
            <i className="bi bi-speedometer2" aria-hidden="true" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* ── Scrollable nav ── */}
        <nav className="dept-sidebar-nav" aria-label="Department menu">
          {orderedGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.key)
            return (
              <div key={group.key} className="dept-sidebar-group">
                {/* Group header */}
                <button
                  type="button"
                  className={`dept-sidebar-group-header${isExpanded ? ' expanded' : ''}`}
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isExpanded}
                >
                  <i className={`bi ${group.icon}`} aria-hidden="true" />
                  <span>{group.label}</span>
                  <i className="bi bi-chevron-down dept-sidebar-chevron" aria-hidden="true" />
                </button>

                {/* Group items */}
                {isExpanded && (
                  <ul className="dept-sidebar-group-items" role="list">
                    {group.items.map((item) => {
                      const href = `/${deptKey}/${item.key}`
                      const isActive = pathname === href
                      return (
                        <li key={item.key} role="listitem">
                          <Link
                            href={href}
                            className={`dept-sidebar-item${isActive ? ' active' : ''}`}
                          >
                            <i className={`bi ${item.icon}`} aria-hidden="true" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
