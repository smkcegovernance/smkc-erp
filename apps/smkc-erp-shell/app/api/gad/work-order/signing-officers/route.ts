import { NextRequest } from 'next/server'
import { proxyWorkOrder } from '../proxy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const deptCode = searchParams.get('deptCode') ?? ''
  return proxyWorkOrder(
    req,
    `api/gad/work-order/signing-officers?deptCode=${encodeURIComponent(deptCode)}`
  )
}
