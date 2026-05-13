import { NextRequest } from 'next/server'
import { proxyGadRequest, buildPath } from '../proxy'

export async function GET(req: NextRequest) {
  return proxyGadRequest('GET', buildPath('/account-heads', req.nextUrl.search))
}
