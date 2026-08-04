import { NextRequest, NextResponse } from 'next/server'

function getApiBaseUrl(): string {
  const base = process.env.SMKC_API_BASE_URL ?? ''
  if (!base) throw new Error('SMKC_API_BASE_URL environment variable is not set')
  return base.replace(/\/+$/, '')
}

export async function proxySamaj(
  req: NextRequest,
  upstreamPath: string,
  method?: string
): Promise<NextResponse> {
  const base = getApiBaseUrl()
  const url = `${base}/${upstreamPath}`

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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, message: `Backend unreachable: ${msg}` },
      { status: 503 }
    )
  }
}
