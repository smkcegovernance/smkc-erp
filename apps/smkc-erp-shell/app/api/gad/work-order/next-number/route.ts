import { NextRequest } from 'next/server'
import { proxyWorkOrder } from '../proxy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const deptCode = searchParams.get('deptCode') ?? ''
  const finYear = searchParams.get('finYear') ?? ''
  return proxyWorkOrder(
    req,
    `api/gad/work-order/next-number?deptCode=${encodeURIComponent(deptCode)}&finYear=${encodeURIComponent(finYear)}`
  )
}
