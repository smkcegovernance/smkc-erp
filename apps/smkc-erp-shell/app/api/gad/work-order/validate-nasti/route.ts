import { NextRequest } from 'next/server'
import { proxyWorkOrder } from '../proxy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const nastiNo = searchParams.get('nastiNo') ?? ''
  const finYear = searchParams.get('finYear') ?? ''
  return proxyWorkOrder(
    req,
    `api/gad/work-order/validate-nasti?nastiNo=${encodeURIComponent(nastiNo)}&finYear=${encodeURIComponent(finYear)}`
  )
}
