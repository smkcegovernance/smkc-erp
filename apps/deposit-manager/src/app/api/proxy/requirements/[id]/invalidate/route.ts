import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../helper';

type Params = { id: string };

// POST /api/proxy/requirements/[id]/invalidate — account: invalidate a published requirement
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  return proxyRequest(request, `/api/deposits/account/requirements/${id}/invalidate`, 'POST');
}
