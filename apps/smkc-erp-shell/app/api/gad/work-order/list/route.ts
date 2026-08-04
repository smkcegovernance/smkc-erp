import { NextRequest } from 'next/server'
import { proxyWorkOrder } from '../proxy'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const finYear = searchParams.get('finYear') ?? ''
  const userId = searchParams.get('userId') ?? ''
  const qs = `finYear=${encodeURIComponent(finYear)}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`
  return proxyWorkOrder(req, `api/gad/work-order/list?${qs}`)
}
