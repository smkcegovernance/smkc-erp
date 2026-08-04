import { NextRequest, NextResponse } from 'next/server'
import { proxySamaj } from '../proxy'
import { decryptPrintToken } from '@/app/lib/printToken.server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  // Preferred: encrypted token
  const token = searchParams.get('t')
  if (token) {
    try {
      const { workOrderNo, deptCode, finYear } = decryptPrintToken(token)
      const qs = `workOrderNo=${workOrderNo}&deptCode=${deptCode}&finYear=${encodeURIComponent(finYear)}`
      return proxySamaj(req, `api/gad/samaj/detail?${qs}`)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid or tampered print token.' },
        { status: 400 },
      )
    }
  }

  // Fallback: plain params (backward compatibility)
  const workOrderNo = searchParams.get('workOrderNo') ?? ''
  const deptCode = searchParams.get('deptCode') ?? ''
  const finYear = searchParams.get('finYear') ?? ''
  const qs = `workOrderNo=${encodeURIComponent(workOrderNo)}&deptCode=${encodeURIComponent(deptCode)}&finYear=${encodeURIComponent(finYear)}`
  return proxySamaj(req, `api/gad/samaj/detail?${qs}`)
}
