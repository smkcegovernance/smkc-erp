import { NextRequest } from 'next/server';
import { proxyRequest } from '../helper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'account';
  const bankId = searchParams.get('bankId');
  
  let apiPath = `/api/deposits/${role}/dashboard/stats`;
  if (role === 'bank' && bankId) {
    apiPath += `?bankId=${bankId}`;
  }
  
  return proxyRequest(request, apiPath, 'GET');
}