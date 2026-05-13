import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../../women-child-welfare/proxy'

// Public endpoint — no auth required.
// Allows citizens / field workers to submit disability registrations
// without needing department login credentials.

export async function POST(req: NextRequest) {
  return proxyWcwcRequest('POST', buildWcwcPath('/register', req.nextUrl.search), req)
}
