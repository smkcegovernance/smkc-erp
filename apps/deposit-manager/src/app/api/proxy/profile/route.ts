import { NextRequest } from 'next/server';
import { proxyRequest } from '../helper';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return Response.json(
      {
        Success: false,
        Message: 'userId is required',
        Data: null,
      },
      { status: 400 }
    );
  }

  const encodedUserId = encodeURIComponent(userId);
  // Prefer path-based route to avoid query-string action matching issues on older Web API builds.
  const apiPath = `/api/auth/profile/${encodedUserId}`;
  return proxyRequest(request, apiPath, 'GET');
}
