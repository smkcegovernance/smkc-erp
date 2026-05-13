import { NextRequest, NextResponse } from 'next/server'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { adminUserId?: string; targetUserId?: string }
    const adminUserId  = (body.adminUserId  ?? '').trim().toUpperCase()
    const targetUserId = (body.targetUserId ?? '').trim().toUpperCase()

    if (!adminUserId || !targetUserId) {
      return NextResponse.json(
        { success: false, message: 'adminUserId and targetUserId are required' },
        { status: 400 }
      )
    }

    const upstream = await fetch(`${SMKC_API_BASE}/api/erp-auth/unlock-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId, targetUserId }),
    })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Service unavailable. Please try again.' },
      { status: 502 }
    )
  }
}
