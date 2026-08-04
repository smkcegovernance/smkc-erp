import { NextRequest } from 'next/server'
import { proxyWcwcRequest } from '../../proxy'

const SWR_PREFIX = '/single-women'

function buildPath(rel: string, search: string): string {
  return `/api/women-child-welfare${SWR_PREFIX}${rel}${search}`
}

export async function GET(req: NextRequest) {
  return proxyWcwcRequest('GET', buildPath('/register', req.nextUrl.search))
}

export async function POST(req: NextRequest) {
  return proxyWcwcRequest('POST', buildPath('/register', req.nextUrl.search), req)
}
