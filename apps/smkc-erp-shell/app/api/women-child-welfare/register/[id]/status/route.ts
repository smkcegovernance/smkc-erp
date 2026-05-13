import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../../../proxy'

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return proxyWcwcRequest('PATCH', buildWcwcPath(`/register/${encodeURIComponent(id)}/status`, ''), req)
}
