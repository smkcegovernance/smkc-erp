import { NextRequest } from 'next/server'
import { buildWcwcPath, proxyWcwcRequest } from '../../../women-child-welfare/proxy'

// Public read-only endpoint — allows retrieving a single registration by ID
// (e.g. to show the applicant their submission status).

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return proxyWcwcRequest('GET', buildWcwcPath(`/register/${encodeURIComponent(id)}`, ''))
}
