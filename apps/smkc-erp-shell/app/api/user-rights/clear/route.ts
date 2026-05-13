import { NextRequest, NextResponse } from 'next/server'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function DELETE(request: NextRequest) {
  const userId      = request.nextUrl.searchParams.get('userId')
  const adminUserId = request.nextUrl.searchParams.get('adminUserId')

  if (!userId || !adminUserId) {
    return NextResponse.json(
      { success: false, message: 'userId and adminUserId are required' },
      { status: 400 }
    )
  }

  try {
    const url = `${SMKC_API_BASE}/api/user-rights/clear?userId=${encodeURIComponent(userId)}&adminUserId=${encodeURIComponent(adminUserId)}`
    const upstream = await fetch(url, { method: 'DELETE' })
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
