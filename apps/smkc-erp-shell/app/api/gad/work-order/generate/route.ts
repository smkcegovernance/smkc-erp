import { NextRequest } from 'next/server'
import { proxyWorkOrder } from '../proxy'

export async function POST(req: NextRequest) {
  return proxyWorkOrder(req, 'api/gad/work-order/generate', 'POST')
}
