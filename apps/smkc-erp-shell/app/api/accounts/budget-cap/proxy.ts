import { NextRequest, NextResponse } from 'next/server'

function getApiBaseUrl(): string {
  const baseUrl = process.env.SMKC_API_BASE_URL ?? ''
  if (!baseUrl) throw new Error('SMKC_API_BASE_URL environment variable is not set')
  return baseUrl.replace(/\/+$/, '')
}

export async function proxyBudgetCap(
  req: NextRequest,
  upstreamPath: string,
  method?: string
): Promise<NextResponse> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/${upstreamPath}`

  const init: RequestInit = {
    method: method ?? req.method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(30_000),
  }

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    const body = await req.text()
    if (body) init.body = body
  }

  try {
    const upstream = await fetch(url, init)
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
