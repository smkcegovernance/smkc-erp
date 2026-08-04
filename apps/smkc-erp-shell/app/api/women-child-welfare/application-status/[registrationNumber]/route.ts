import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../../proxy'

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ registrationNumber: string }> }
) {
  const { registrationNumber } = await ctx.params
  return proxyWcwcRequest(
    'GET',
    buildWcwcPath(`/application-status/${encodeURIComponent(registrationNumber)}`, '')
  )
}
