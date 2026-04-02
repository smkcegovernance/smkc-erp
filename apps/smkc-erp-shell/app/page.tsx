import { DEPARTMENTS } from '@smkc/types'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="erp-main">
      <div className="erp-page-header">
        <h1 className="erp-page-title">Department Portal</h1>
        <p className="erp-page-subtitle">Select a department to access services and records.</p>
      </div>

      <nav className="dept-grid" aria-label="Departments">
        {DEPARTMENTS.map((dept) => (
          <Link key={dept.key} href={dept.route} className="dept-card">
            <div className="dept-card-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3h18v2H3V3zm2 4h14v13H5V7zm2 2v9h10V9H7zm2 2h6v2H9v-2zm0 4h6v2H9v-2z" />
              </svg>
            </div>
            <span className="dept-card-label">{dept.label}</span>
            <span className="dept-card-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </nav>
    </main>
  )
}
