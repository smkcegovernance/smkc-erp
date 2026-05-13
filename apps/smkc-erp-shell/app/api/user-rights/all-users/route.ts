import { NextRequest, NextResponse } from 'next/server'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function GET(request: NextRequest) {
  const adminUserId = request.nextUrl.searchParams.get('adminUserId')

  if (!adminUserId || !adminUserId.trim()) {
    return NextResponse.json(
      { success: false, message: 'adminUserId is required' },
      { status: 400 }
    )
  }

  try {
    const url = `${SMKC_API_BASE}/api/user-rights/all-users?adminUserId=${encodeURIComponent(adminUserId.trim())}`
    const upstream = await fetch(url, { cache: 'no-store' })
    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { success: false, message: `Backend unreachable: ${msg}` },
      { status: 502 }
    )
  }
}
