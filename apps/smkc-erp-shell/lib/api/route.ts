/**
 * withRoute — plug-and-play Next.js Route Handler wrapper.
 *
 * Usage in any app/api route handler file:
 *
 *   export const GET = withRoute(async () => {
 *     const data = await apiServer.get<MyType>('/some/backend/path')
 *     return data
 *   })
 *
 *   export const POST = withRoute(async (req) => {
 *     const body = await req.json() as CreatePayload
 *     const data = await apiServer.post<MyType>('/some/backend/path', body)
 *     return data
 *   }, { requireAuth: true })
 *
 * The wrapper:
 *  - Wraps the handler in try/catch
 *  - Returns a consistent ApiResponse shape: { success, data, message }
 *  - Handles SmkcApiError with its statusCode
 *  - Optionally validates the Bearer token from the session
 */
import { NextRequest, NextResponse } from 'next/server'
import { SmkcApiError, type ApiResponse } from '@smkc/types'

type RouteHandler<T> = (
  req: NextRequest,
  ctx: { params: Promise<Record<string, string>> }
) => Promise<T>

interface RouteOptions {
  /** When true, returns 401 if no valid Bearer token is present */
  requireAuth?: boolean
}

function extractBearer(req: NextRequest): string | null {
  const auth = req.headers.get('Authorization') ?? req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7).trim()
  return token.length > 0 ? token : null
}

function isTokenExpired(token: string): boolean {
  // Mock token format: "mock-<userId>-<issuedAtMs>"
  // Enforce an 8-hour session window server-side.
  const parts = token.split('-')
  const issuedAt = Number(parts[parts.length - 1])
  if (!Number.isFinite(issuedAt)) return true
  return Date.now() - issuedAt > 8 * 60 * 60 * 1000
}

export function withRoute<T>(
  handler: RouteHandler<T>,
  options: RouteOptions = {}
): RouteHandler<NextResponse> {
  return async (req, ctx) => {
    try {
      if (options.requireAuth) {
        const token = extractBearer(req)
        if (!token) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, message: 'Unauthorized', data: null, errorCode: 'UNAUTHORIZED' },
            { status: 401 }
          )
        }
        if (isTokenExpired(token)) {
          return NextResponse.json<ApiResponse<null>>(
            { success: false, message: 'Session expired', data: null, errorCode: 'SESSION_EXPIRED' },
            { status: 401 }
          )
        }
      }

      const result = await handler(req, ctx)

      return NextResponse.json<ApiResponse<T>>({
        success: true,
        message: 'OK',
        data: result,
      })
    } catch (err) {
      if (err instanceof SmkcApiError) {
        const status = err.statusCode > 0 ? err.statusCode : 502
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            message: err.message,
            data: null,
            errorCode: err.errorCode,
          },
          { status }
        )
      }

      const message = err instanceof Error ? err.message : 'Internal server error'
      return NextResponse.json<ApiResponse<null>>(
        { success: false, message, data: null, errorCode: 'INTERNAL_ERROR' },
        { status: 500 }
      )
    }
  }
}
