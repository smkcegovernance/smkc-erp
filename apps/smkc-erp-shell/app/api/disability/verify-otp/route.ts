import { NextRequest, NextResponse } from 'next/server'
import { classifyUpstreamFetchError, fetchWithTimeout } from '@/lib/apiErrors'

const SMKC_API_BASE = process.env.SMKC_API_BASE_URL ?? 'http://localhost:57031'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const mobile: string = (body.mobile ?? '').trim()
    const otp: string = (body.otp ?? '').trim()

    if (!/^\d{10}$/.test(mobile) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, errorCode: 'VALIDATION_ERROR', message: 'अवैध विनंती' },
        { status: 400 }
      )
    }

    const upstream = await fetchWithTimeout(
      `${SMKC_API_BASE}/api/disability/verify-otp`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      }
    )

    const data = await upstream.json()
    return NextResponse.json(data, { status: upstream.status })
  } catch (err) {
    const { code, message, status } = classifyUpstreamFetchError(err)
    return NextResponse.json(
      { success: false, errorCode: code, message },
      { status }
    )
  }
}
