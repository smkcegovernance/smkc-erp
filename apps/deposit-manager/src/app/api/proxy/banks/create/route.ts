import { NextRequest } from 'next/server';
import { proxyRequest } from '../../helper';

export async function POST(request: NextRequest) {
  return proxyRequest(request, '/api/deposits/account/banks/create', 'POST');
}