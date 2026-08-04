import { NextRequest } from 'next/server'
import { proxyWorkOrder } from '../proxy'

export async function GET(req: NextRequest) {
  return proxyWorkOrder(req, 'api/gad/work-order/sanction-authorities')
}
