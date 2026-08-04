import { NextRequest, NextResponse } from 'next/server'
import { encryptPrintToken } from '@/app/lib/printToken.server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const workOrderNo = Number(searchParams.get('workOrderNo'))
  const deptCode = Number(searchParams.get('deptCode'))
  const finYear = searchParams.get('finYear') ?? ''

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
      { success: false, message: 'Token generation failed.' },
      { status: 500 },
    )
  }
}
