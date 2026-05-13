import { NextRequest, NextResponse } from 'next/server'

function getApiBaseUrl(): string {
  const baseUrl = process.env.SMKC_API_BASE_URL ?? ''
  if (!baseUrl) throw new Error('SMKC_API_BASE_URL is not set')
  return baseUrl.replace(/\/+$/, '')
}

// GET /api/accounts/budget-cap/history?acSubhead=E-4219&finYear=2026-2027
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const acSubhead = sp.get('acSubhead') ?? ''
  const finYear   = sp.get('finYear')   ?? ''
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/gad/budget-cap/history?acSubhead=${encodeURIComponent(acSubhead)}&finYear=${encodeURIComponent(finYear)}`
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(20_000) })
    const data = await r.json()
    return NextResponse.json(data, { status: r.status })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
