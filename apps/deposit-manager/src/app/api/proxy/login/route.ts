import { NextRequest, NextResponse } from 'next/server';
import { maybeEnableInsecureLocalhostTls } from '@/lib/tls';

// Use server-side base URL for production
const API_BASE_URL = process.env.BASE_URL || 'https://localhost:5443/api';

function maskUserId(userId: string): string {
  if (!userId) return 'empty';
  if (userId.length <= 3) return '***';
  return `${userId.substring(0, 2)}***${userId.substring(userId.length - 1)}`;
}

function buildApiUrl(apiPath: string): string {
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  let path = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const baseHasApi = /\/api$/i.test(base);
  const pathStartsWithApi = /^\/api\//i.test(path);
  if (baseHasApi && pathStartsWithApi) {
    path = path.replace(/^\/api/i, '');
  }
  return `${base}${path}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    // Use unified login endpoint - API determines role from database
    const apiUrl = buildApiUrl('/api/auth/login');

    console.log('[Proxy/Login] Incoming -> Backend mapping:', {
      incomingMethod: request.method,
      incomingPath: new URL(request.url).pathname,
      backendMethod: 'POST',
      backendPath: '/api/auth/login',
      backendUrl: apiUrl,
    });

    console.log('[Proxy/Login] Request payload preview:', {
      userId: maskUserId(String(userId || '')),
      hasPassword: !!password,
    });
    
    maybeEnableInsecureLocalhostTls(apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, password }),
    });

    const data = await response.json();
    console.log('[Proxy/Login] API response status:', response.status);
    console.log('[Proxy/Login] API response payload:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('[Proxy/Login] Proxy login error:', error);
    return NextResponse.json(
      { 
        Success: false, 
        Message: error.message || 'Proxy request failed',
        Data: null 
      },
      { status: 500 }
    );
  }
}
