import { NextRequest } from 'next/server'
import { proxyGadRequest } from '../proxy'

export async function POST(req: NextRequest) {
  return proxyGadRequest('POST', '/over-10l', req)
}
