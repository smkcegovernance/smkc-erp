import { NextRequest } from 'next/server'
import { proxyBudgetBookRequest } from '../proxy'

export async function POST(req: NextRequest) {
  return proxyBudgetBookRequest('POST', '/primary', req)
}
