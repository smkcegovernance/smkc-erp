import { NextRequest } from 'next/server'
import { buildPath, proxyBudgetBookRequest } from '../proxy'

export async function GET(req: NextRequest) {
  return proxyBudgetBookRequest('GET', buildPath('/fund-wise-liability-report', req.nextUrl.search))
}