import { NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/apiErrors'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { userId?: string; password?: string }

    const userId   = (body.userId   ?? '').trim().toUpperCase()
    const password = (body.password ?? '').trim()

    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: 'User ID and password are required' },
        { status: 400 }
      )
    }

    if (!/^[A-Za-z0-9]{1,8}$/.test(userId) || !/^[A-Za-z0-9]{1,8}$/.test(password)) {
      return NextResponse.json(
        { success: false, message: 'User ID and password must be alphanumeric, maximum 8 characters' },
        { status: 400 }
      )
    }

    // Forward client IP for audit log
    const ipAddr =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null

    const upstreamUrl = `${SMKC_API_BASE}/api/erp-auth/login`
    console.log(`[ERP-AUTH/LOGIN] → POST ${upstreamUrl} (userId=${userId}, ip=${ipAddr ?? 'unknown'})`)

    let upstream: Response
    try {
      upstream = await fetchWithTimeout(upstreamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password, ipAddr }),
      })
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      console.error(`[ERP-AUTH/LOGIN] ✗ Could not reach backend at ${upstreamUrl}: ${msg}`)
      console.error(`[ERP-AUTH/LOGIN] ✗ SMKC_API_BASE_URL env = "${SMKC_API_BASE}"`)
      console.error(`[ERP-AUTH/LOGIN] ✗ ALLOW_INSECURE_LOCALHOST_TLS = "${process.env.ALLOW_INSECURE_LOCALHOST_TLS}"`)
      console.error(`[ERP-AUTH/LOGIN] ✗ NODE_TLS_REJECT_UNAUTHORIZED = "${process.env.NODE_TLS_REJECT_UNAUTHORIZED}"`)
      return NextResponse.json(
        { success: false, message: `Login service unavailable. Backend unreachable: ${msg}` },
        { status: 502 }
      )
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '')
      console.error(`[ERP-AUTH/LOGIN] ✗ Backend returned HTTP ${upstream.status}: ${text.slice(0, 500)}`)
      const data = text ? JSON.parse(text) : { success: false, message: 'Login failed' }
      return NextResponse.json(data, { status: upstream.status })
    }

    console.log(`[ERP-AUTH/LOGIN] ✓ Backend responded HTTP ${upstream.status}`)
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[ERP-AUTH/LOGIN] ✗ Unexpected error: ${msg}`)
    return NextResponse.json(
      { success: false, message: 'Login service unavailable. Please try again.' },
      { status: 502 }
    )
  }
}
