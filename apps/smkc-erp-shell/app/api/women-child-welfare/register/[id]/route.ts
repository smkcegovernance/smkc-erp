import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../../proxy'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return proxyWcwcRequest('GET', buildWcwcPath(`/register/${encodeURIComponent(id)}`, req.nextUrl.search))
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return proxyWcwcRequest('PUT', buildWcwcPath(`/register/${encodeURIComponent(id)}`, req.nextUrl.search), req)
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  return proxyWcwcRequest('DELETE', buildWcwcPath(`/register/${encodeURIComponent(id)}`, req.nextUrl.search))
}