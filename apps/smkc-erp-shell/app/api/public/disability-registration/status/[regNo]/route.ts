import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../../../../women-child-welfare/proxy'

// Public endpoint — no auth required.
// Allows citizens to check their disability registration status.

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ regNo: string }> }
) {
  const { regNo } = await ctx.params
  return proxyWcwcRequest(
    'GET',
    buildWcwcPath(`/application-status/${encodeURIComponent(regNo)}`, '')
  )
}
