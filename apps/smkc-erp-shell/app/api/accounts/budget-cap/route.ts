import { NextRequest, NextResponse } from 'next/server'
import { proxyBudgetCap } from './proxy'

function getApiBaseUrl(): string {
  const baseUrl = process.env.SMKC_API_BASE_URL ?? ''
  if (!baseUrl) throw new Error('SMKC_API_BASE_URL environment variable is not set')
  return baseUrl.replace(/\/+$/, '')
}

// GET /api/accounts/budget-cap?ulbCode=1&finYear=2026-2027  → list
// GET /api/accounts/budget-cap?ulbCode=1&acSubhead=E-4219&finYear=2026-2027  → single
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const ulbCode = sp.get('ulbCode') ?? '1'
  const finYear = sp.get('finYear') ?? ''
  const acSubhead = sp.get('acSubhead')

  const baseUrl = getApiBaseUrl()

  if (acSubhead) {
    const url = `${baseUrl}/api/gad/budget-cap/single?ulbCode=${ulbCode}&acSubhead=${encodeURIComponent(acSubhead)}&finYear=${encodeURIComponent(finYear)}`
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(20_000) })
      const data = await r.json()
      return NextResponse.json(data, { status: r.status })
    } catch (err: unknown) {
      return NextResponse.json({ error: String(err) }, { status: 502 })
    }
  }

  const url = `${baseUrl}/api/gad/budget-cap?ulbCode=${ulbCode}&finYear=${encodeURIComponent(finYear)}`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}

// POST /api/accounts/budget-cap  → upsert
export async function POST(req: NextRequest) {
  return proxyBudgetCap(req, 'api/gad/budget-cap')
}

// DELETE /api/accounts/budget-cap?ulbCode=1&acSubhead=E-4219&finYear=2026-2027&actionBy=user
export async function DELETE(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const baseUrl = getApiBaseUrl()
  const params = new URLSearchParams({
    ulbCode:   sp.get('ulbCode')   ?? '1',
    acSubhead: sp.get('acSubhead') ?? '',
    finYear:   sp.get('finYear')   ?? '',
    actionBy:  sp.get('actionBy')  ?? '',
  })
  try {
    const r = await fetch(`${baseUrl}/api/gad/budget-cap?${params}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(20_000),
    })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
