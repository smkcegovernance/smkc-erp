'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface SettingsSection {
  key: string
  href: string
  icon: string
  label: string
  description: string
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    key: 'user-rights',
    href: '/admin/user-rights',
    icon: 'bi-shield-lock-fill',
    label: 'User Rights',
    description: 'Assign and manage menu access for ERP users',
  },
  {
    key: 'user-locks',
    href: '/admin/user-locks',
    icon: 'bi-lock-fill',
    label: 'User Lock Management',
    description: 'Release accounts locked after failed login attempts',
  },
]

export default function AdminSettingsMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div className="admin-settings-menu" ref={ref}>
      <button
        type="button"
        className={`admin-settings-trigger${open ? ' active' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        title="Admin Settings"
      >
        <i className="bi bi-gear-fill" aria-hidden="true" />
      </button>

      {open && (
        <div className="admin-settings-panel" role="menu" aria-label="Admin Settings">
          <div className="admin-settings-panel-header">
            <i className="bi bi-sliders" aria-hidden="true" />
            <span>Admin Settings</span>
          </div>
          <div className="admin-settings-sections">
            {SETTINGS_SECTIONS.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                className="admin-settings-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <div className="admin-settings-item-icon">
                  <i className={`bi ${section.icon}`} aria-hidden="true" />
                </div>
                <div className="admin-settings-item-body">
                  <span className="admin-settings-item-label">{section.label}</span>
                  <span className="admin-settings-item-desc">{section.description}</span>
                </div>
                <i className="bi bi-chevron-right admin-settings-item-arrow" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
