import { NextRequest } from 'next/server'
import { proxyWcwcRequest } from '../../../proxy'

const SWR_PREFIX = '/single-women'

function buildPath(id: string, rel: string): string {
  return `/api/women-child-welfare${SWR_PREFIX}/register/${encodeURIComponent(id)}${rel}`
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return proxyWcwcRequest('GET', buildPath(id, ''))
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return proxyWcwcRequest('PUT', buildPath(id, ''), req)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return proxyWcwcRequest('PATCH', buildPath(id, '/status'), req)
}
