import { NextRequest } from 'next/server'
import { proxyGadRequest, buildPath } from '../proxy'

export async function GET(req: NextRequest) {
  return proxyGadRequest('GET', buildPath('/for-remark', req.nextUrl.search))
}
