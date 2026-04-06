import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { maybeEnableInsecureLocalhostTls } from '@/lib/tls';

// Use server-side environment variables for production
const API_BASE_URL = process.env.BASE_URL || 'https://localhost:5443/api';
const API_KEY = process.env.API_KEY || 'TEST_API_KEY_12345678901234567890123456789012';
const SECRET_KEY = process.env.SECRET_KEY || 'TEST_SECRET_KEY_67890ABCDEFGHIJ1234567890';

function sanitizeForLog(value: unknown, maxLength = 500): string {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    if (!text) return 'empty';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...(truncated)` : text;
  } catch {
    return 'unserializable';
  }
}

function maskToken(value: string): string {
  if (!value) return 'empty';
  if (value.length <= 8) return '***';
  return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
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

// Generate HMAC-SHA256 signature
function generateHmacSignature(
  method: string,
  uri: string,
  body: string,
  timestamp: string
): string {
  const stringToSign = method + uri + body + timestamp + API_KEY;
  return CryptoJS.HmacSHA256(stringToSign, SECRET_KEY).toString(CryptoJS.enc.Base64);
}

// Generic proxy handler
export async function proxyRequest(
  request: NextRequest,
  apiPath: string,
  method?: string
) {
  try {
    const httpMethod = method || request.method;
    let body = '';
    
    if (httpMethod !== 'GET' && httpMethod !== 'HEAD') {
      try {
        const json = await request.json();
        body = JSON.stringify(json);
      } catch (e) {
        // No body or invalid JSON
      }
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = generateHmacSignature(httpMethod, apiPath, body, timestamp);

    const apiUrl = buildApiUrl(apiPath);

    maybeEnableInsecureLocalhostTls(apiUrl);
    
    console.log('[Proxy] Incoming -> Backend mapping:', {
      incomingMethod: request.method,
      incomingPath: new URL(request.url).pathname,
      incomingQuery: new URL(request.url).search,
      backendMethod: httpMethod,
      backendPath: apiPath,
      backendUrl: apiUrl,
    });

    console.log('[Proxy] Request payload preview:', {
      method: httpMethod,
      timestamp,
      hasBody: !!body,
      bodyPreview: sanitizeForLog(body),
    });
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    };

    const fetchOptions: RequestInit = {
      method: httpMethod,
      headers,
    };

    console.log('[Proxy] Outbound auth headers (masked):', {
      'X-API-Key': maskToken(API_KEY),
      'X-Timestamp': timestamp,
      'X-Signature': maskToken(signature),
    });

    if (body && httpMethod !== 'GET' && httpMethod !== 'HEAD') {
      fetchOptions.body = body;
    }

    const response = await fetch(apiUrl, fetchOptions);
    console.log('[Proxy] API response status:', response.status);
    console.log('[Proxy] API response headers:', Object.fromEntries(response.headers.entries()));
    
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      console.log('[Proxy] API response data:', data);
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      console.error('[Proxy] Non-JSON response received:', text.substring(0, 500));
      return NextResponse.json(
        {
          Success: false,
          Message: `API returned non-JSON response (${response.status}): ${text.substring(0, 200)}`,
          Data: null
        },
        { status: response.status }
      );
    }
  } catch (error: any) {
    console.error('[Proxy] Request error:', error);
    console.error('[Proxy] Error details:', {
      message: error.message,
      stack: error.stack,
      apiPath
    });
    return NextResponse.json(
      {
        Success: false,
        Message: error.message || 'Proxy request failed',
        Data: null,
        Error: error.toString()
      },
      { status: 500 }
    );
  }
}
