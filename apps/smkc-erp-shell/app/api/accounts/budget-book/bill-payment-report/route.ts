import { NextRequest } from 'next/server'
import { proxyBudgetBookRequest, buildPath } from '../proxy'

export async function GET(req: NextRequest) {
  return proxyBudgetBookRequest('GET', buildPath('/bill-payment-report', req.nextUrl.search))
}
