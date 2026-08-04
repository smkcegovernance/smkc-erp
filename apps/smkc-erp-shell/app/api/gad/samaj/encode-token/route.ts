import { NextRequest, NextResponse } from 'next/server'
import { encryptPrintToken } from '@/app/lib/printToken.server'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const workOrderNo = Number(sp.get('workOrderNo'))
  const deptCode = Number(sp.get('deptCode'))
  const finYear = sp.get('finYear') ?? ''

  if (!workOrderNo || !deptCode || !finYear) {
    return NextResponse.json(
      { success: false, message: 'Missing required parameters.' },
      { status: 400 },
    )
  }

  try {
    const token = encryptPrintToken(workOrderNo, deptCode, finYear)
    return NextResponse.json({ success: true, token })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to generate token.' },
      { status: 500 },
    )
  }
}
