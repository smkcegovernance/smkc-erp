import { NextRequest } from 'next/server';
import { proxyRequest } from '../../helper';

type Params = { id: string };

// GET /api/proxy/banks/[id] — account: get bank by ID
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  return proxyRequest(request, `/api/deposits/account/banks/${id}`, 'GET');
}
