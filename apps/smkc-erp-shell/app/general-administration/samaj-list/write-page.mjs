import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const content = `'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SamajListItem {
  workOrderNo: number
  samajDisplayNo: string
  deptCode: number
  deptName: string
  finYear: string
  workOrderDate: string
  proposalName: string
  eligibleVendorName: string
  vendorProposedAmount: number
}

function getCurrentFinYear(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startYear = month >= 4 ? year : year - 1
  return \`\${startYear}-\${startYear + 1}\`
}

function formatAmount(amt: number): string {
  return new Intl.NumberFormat('en-IN').format(amt)
}

export default function SamajListPage() {
  const [finYear, setFinYear] = useState<string>(getCurrentFinYear())
  const [items, setItems] = useState<SamajListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const finYears = (() => {
    const now = new Date()
    const m = now.getMonth() + 1
    const y = now.getFullYear()
    const cur = m >= 4 ? y : y - 1
    return Array.from({ length: 5 }, (_, i) => {
      const s = cur - i
      return \`\${s}-\${s + 1}\`
    })
  })()

  async function fetchList(fy: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(\`/api/gad/samaj/list?finYear=\${encodeURIComponent(fy)}\`)
      const json = await res.json()
      if (json.success) {
        setItems(json.data || [])
      } else {
        setError(json.message || '\u0921\u0947\u091f\u093e \u092e\u093f\u0933\u0935\u0923\u094d\u092f\u093e\u0924 \u0905\u0921\u091a\u0923 \u0906\u0932\u0940.')
      }
    } catch {
      setError('\u0928\u0947\u091f\u0935\u0930\u094d\u0915 \u090f\u0930\u0930. \u0915\u0943\u092a\u092f\u093e \u092a\u0941\u0928\u094d\u0939\u093e \u092a\u094d\u0930\u092f\u0924\u094d\u0928 \u0915\u0930\u093e.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList(finYear)
  }, [finYear])

  function openPrint(item: SamajListItem) {
    const url = \`/general-administration/create-samaj/print?workOrderNo=\${item.workOrderNo}&deptCode=\${item.deptCode}&finYear=\${encodeURIComponent(item.finYear)}\`
    window.open(url, '_blank')
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="mb-0">
          \u0928\u093f\u0935\u093f\u0926\u093e \u092e\u0902\u091c\u0941\u0930\u0940\u091a\u0940 \u0938\u092e\u091c \u092f\u093e\u0926\u0940
        </h4>
        <Link href="/general-administration/create-samaj" className="btn btn-primary btn-sm">
          + \u0928\u0935\u0940\u0928 \u0938\u092e\u091c
        </Link>
      </div>

      <div className="mb-3 d-flex align-items-center gap-2">
        <label className="form-label mb-0 fw-semibold">\u0906\u0930\u094d\u0925\u093f\u0915 \u0935\u0930\u094d\u0937:</label>
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
          \u0932\u094b\u0921 \u0939\u094b\u0924 \u0906\u0939\u0947...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-5 text-secondary">
          \u0915\u094b\u0923\u0924\u0940\u0939\u0940 \u0928\u094b\u0902\u0926 \u0906\u0922\u0933\u0932\u0940 \u0928\u093e\u0939\u0940.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover table-sm">
            <thead className="table-dark">
              <tr>
                <th style={{ width: 50 }}>#</th>
                <th>\u0938\u092e\u091c \u0915\u094d\u0930\u092e\u093e\u0902\u0915</th>
                <th>\u0926\u093f\u0928\u093e\u0902\u0915</th>
                <th>\u0935\u093f\u092d\u093e\u0917</th>
                <th>\u0915\u093e\u092e\u093e\u091a\u0947 \u0928\u093e\u0935</th>
                <th>\u0915\u0902\u0924\u094d\u0930\u093e\u091f\u0926\u093e\u0930</th>
                <th className="text-end">\u0930\u0915\u094d\u0915\u092e (\u0930\u0941.)</th>
                <th className="text-center">\u0915\u094d\u0930\u093f\u092f\u093e</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.workOrderNo + '-' + item.deptCode}>
                  <td>{idx + 1}</td>
                  <td>
                    <span className="badge bg-secondary">{item.samajDisplayNo}</span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{item.workOrderDate}</td>
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
                    \u20b9\u00a0{formatAmount(item.vendorProposedAmount)}
                  </td>
                  <td className="text-center" style={{ whiteSpace: 'nowrap' }}>
                    <Link
                      href={\`/general-administration/create-samaj/print?workOrderNo=\${item.workOrderNo}&deptCode=\${item.deptCode}&finYear=\${encodeURIComponent(item.finYear)}\`}
                      className="btn btn-outline-primary btn-sm me-1"
                      target="_blank"
                    >
                      \u092a\u093e\u0939\u093e / \u091b\u093e\u092a\u093e
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
`

mkdirSync(__dirname, { recursive: true })
writeFileSync(join(__dirname, 'page.tsx'), content, 'utf8')
console.log('List page written successfully.')
