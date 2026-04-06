import { NextRequest } from 'next/server';
import { proxyRequest } from '../helper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role') || 'account';
  const status = searchParams.get('status');
  const depositType = searchParams.get('depositType');
  const fromDate = searchParams.get('fromDate');
  const toDate = searchParams.get('toDate');
  
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (depositType) params.append('depositType', depositType);
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const query = params.toString();
  const apiPath = `/api/deposits/${role}/requirements${query ? '?' + query : ''}`;
  
  return proxyRequest(request, apiPath, 'GET');
}

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/api/deposits/account/requirements', 'POST');
}