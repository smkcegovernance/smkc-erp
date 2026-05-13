import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../../proxy'

export async function GET(req: NextRequest) {
  return proxyWcwcRequest('GET', buildWcwcPath('/documents/download', req.nextUrl.search))
}
