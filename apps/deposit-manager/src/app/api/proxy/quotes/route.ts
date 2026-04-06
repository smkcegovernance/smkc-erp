import { NextRequest } from 'next/server';
import { proxyRequest } from '../helper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'account';
  const requirementId = searchParams.get('requirementId');
  const bankId = searchParams.get('bankId');
  
  const params = new URLSearchParams();
  if (requirementId) params.append('requirementId', requirementId);
  if (bankId) params.append('bankId', bankId);
  
  const query = params.toString();
  const apiPath = `/api/deposits/${role}/quotes${query ? '?' + query : ''}`;
  
  return proxyRequest(request, apiPath, 'GET');
}