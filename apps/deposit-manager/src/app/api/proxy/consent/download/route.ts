import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { maybeEnableInsecureLocalhostTls } from '@/lib/tls';

const API_BASE_URL = process.env.BASE_URL || 'https://localhost:5443/api';
const API_KEY = process.env.API_KEY || 'TEST_API_KEY_12345678901234567890123456789012';
const SECRET_KEY = process.env.SECRET_KEY || 'TEST_SECRET_KEY_67890ABCDEFGHIJ1234567890';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requirementId = searchParams.get('requirementId') || '';
  const bankId = searchParams.get('bankId') || '';
  const fileName = searchParams.get('fileName') || '';

  const apiPath = '/api/deposits/consent/downloadconsent';
  const qs = new URLSearchParams({ requirementId, bankId, fileName }).toString();

  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  const baseHasApi = /\/api$/i.test(base);
  const pathStartsWithApi = /^\/api\//i.test(apiPath);
  let cleanPath = apiPath;
  if (baseHasApi && pathStartsWithApi) {
    cleanPath = apiPath.replace(/^\/api/i, '');
  }
  const apiUrl = `${base}${cleanPath}?${qs}`;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const stringToSign = 'GET' + apiPath + '' + timestamp + API_KEY;
  const signature = CryptoJS.HmacSHA256(stringToSign, SECRET_KEY).toString(CryptoJS.enc.Base64);

  maybeEnableInsecureLocalhostTls(apiUrl);

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
      },
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Binary response (PDF) — stream back with proper headers
    const buffer = await response.arrayBuffer();
    const cd = response.headers.get('content-disposition') || `attachment; filename="${fileName || 'consent-document.pdf'}"`;
    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'application/pdf',
        'Content-Disposition': cd,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Download failed' },
      { status: 500 }
    );
  }
}
