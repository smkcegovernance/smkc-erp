import { NextRequest, NextResponse } from 'next/server'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId is required' },
        { status: 400 }
      )
    }

    const upstream = await fetch(
      `${SMKC_API_BASE}/api/erp-auth/profile/${encodeURIComponent(userId)}`,
      { headers: { 'Content-Type': 'application/json' } }
    )

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Profile service unavailable. Please try again.' },
      { status: 502 }
    )
  }
}
