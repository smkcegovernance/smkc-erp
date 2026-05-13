import { NextRequest, NextResponse } from 'next/server'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      userId?: string
      oldPassword?: string
      newPassword?: string
    }

    const userId      = (body.userId      ?? '').trim().toUpperCase()
    const oldPassword = (body.oldPassword ?? '').trim()
    const newPassword = (body.newPassword ?? '').trim()

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'userId, oldPassword and newPassword are required' },
        { status: 400 }
      )
    }

    if (!/^[A-Za-z0-9]{1,8}$/.test(newPassword)) {
      return NextResponse.json(
        { success: false, message: 'New password must be alphanumeric, maximum 8 characters' },
        { status: 400 }
      )
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: 'New password must be different from the current password' },
        { status: 400 }
      )
    }

    const upstream = await fetch(`${SMKC_API_BASE}/api/erp-auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword }),
    })

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Password change service unavailable. Please try again.' },
      { status: 502 }
    )
  }
}
