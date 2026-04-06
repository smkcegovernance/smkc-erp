import { NextRequest } from 'next/server';
import { proxyRequest } from '../helper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  const query = status ? `?status=${status}` : '';
  const apiPath = `/api/deposits/account/banks${query}`;
  
  return proxyRequest(request, apiPath, 'GET');
}