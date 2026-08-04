import { NextRequest } from 'next/server'
import { proxyWorkOrder } from '../proxy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const workOrderNo = searchParams.get('workOrderNo') ?? ''
  const deptCode = searchParams.get('deptCode') ?? ''
  const finYear = searchParams.get('finYear') ?? ''
  return proxyWorkOrder(
    req,
    `api/gad/work-order/detail?workOrderNo=${encodeURIComponent(workOrderNo)}&deptCode=${encodeURIComponent(deptCode)}&finYear=${encodeURIComponent(finYear)}`
  )
}
