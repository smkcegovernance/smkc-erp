import { NextRequest } from 'next/server'
import { proxyBudgetBookRequest, buildPath } from '../proxy'

export async function GET(req: NextRequest) {
  return proxyBudgetBookRequest('GET', buildPath('/subheads', req.nextUrl.search))
}
