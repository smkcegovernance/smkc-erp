import { NextRequest, NextResponse } from 'next/server'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function GET(request: NextRequest) {
  try {
    const adminUserId = request.nextUrl.searchParams.get('adminUserId') ?? ''
    if (!adminUserId.trim()) {
      return NextResponse.json(
        { success: false, message: 'adminUserId is required' },
        { status: 400 }
      )
    }

    const upstream = await fetch(
      `${SMKC_API_BASE}/api/erp-auth/locked-users?adminUserId=${encodeURIComponent(adminUserId.trim())}`,
      { cache: 'no-store' }
    )
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Service unavailable. Please try again.' },
      { status: 502 }
    )
  }
}
