import { NextRequest } from 'next/server';
import { proxyRequest } from '../../helper';

type Params = { id: string };

// GET /api/proxy/requirements/[id]?role=account|bank|commissioner
export async function GET(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'account';
  return proxyRequest(request, `/api/deposits/${role}/requirements/${id}`, 'GET');
}

// PUT /api/proxy/requirements/[id] — account: update requirement
export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  return proxyRequest(request, `/api/deposits/account/requirements/${id}`, 'PUT');
}

// DELETE /api/proxy/requirements/[id] — account: delete requirement
export async function DELETE(request: NextRequest, { params }: { params: Promise<Params> }) {
  const { id } = await params;
  return proxyRequest(request, `/api/deposits/account/requirements/${id}`, 'DELETE');
}
