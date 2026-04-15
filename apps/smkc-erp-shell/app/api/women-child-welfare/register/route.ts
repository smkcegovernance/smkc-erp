import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../proxy'

export async function GET(req: NextRequest) {
  return proxyWcwcRequest('GET', buildWcwcPath('/register', req.nextUrl.search))
}

export async function POST(req: NextRequest) {
  return proxyWcwcRequest('POST', buildWcwcPath('/register', req.nextUrl.search), req)
}