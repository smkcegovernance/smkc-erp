import { NextRequest, NextResponse } from 'next/server'
import { decryptPrintToken } from '@/app/lib/printToken.server'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t') ?? ''
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Missing token.' },
      { status: 400 },
    )
  }
  try {
    const { workOrderNo, deptCode, finYear } = decryptPrintToken(token)
    return NextResponse.json({ success: true, workOrderNo, deptCode, finYear })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid or tampered token.' },
      { status: 400 },
    )
  }
}
