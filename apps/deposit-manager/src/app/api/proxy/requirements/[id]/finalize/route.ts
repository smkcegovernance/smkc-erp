import { NextRequest } from 'next/server';
import { proxyRequest } from '../../../helper';

type Params = { id: string };

// POST /api/proxy/requirements/[id]/finalize — commissioner: finalize deposit
export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  return proxyRequest(request, `/api/deposits/commissioner/requirements/${id}/finalize`, 'POST');
}
