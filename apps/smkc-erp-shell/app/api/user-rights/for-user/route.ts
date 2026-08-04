import { NextRequest, NextResponse } from 'next/server'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')

  if (!userId || !userId.trim()) {
    return NextResponse.json(
      { success: false, message: 'userId is required' },
      { status: 400 }
    )
  }

  try {
    const encodedUserId = encodeURIComponent(userId.trim())
    const url = `${SMKC_API_BASE}/api/user-rights/for-user?userId=${encodedUserId}`
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
