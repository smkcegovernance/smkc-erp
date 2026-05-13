import { NextRequest, NextResponse } from 'next/server'
import { classifyUpstreamFetchError, fetchWithTimeout } from '@/lib/apiErrors'

function getApiBaseUrl(): string {
  const baseUrl = process.env.SMKC_API_BASE_URL ?? ''
  if (!baseUrl) throw new Error('SMKC_API_BASE_URL environment variable is not set')
  return baseUrl.replace(/\/+$/, '')
}

function copyResponseHeaders(source: Headers): Headers {
  const headers = new Headers()
  const ct = source.get('content-type')
  if (ct) headers.set('content-type', ct)
  return headers
}

async function readForwardBody(req: NextRequest): Promise<{ body: BodyInit | undefined; contentType: string | null }> {
  const contentType = req.headers.get('content-type')
  if (!contentType) return { body: undefined, contentType: null }
  const bytes = Buffer.from(await req.arrayBuffer())
  if (bytes.length === 0) return { body: undefined, contentType }
  return { body: bytes, contentType }
}

export async function proxyGadRequest(
  method: string,
  apiPath: string,
  req?: NextRequest
): Promise<NextResponse> {
  try {
    const { body, contentType } = req
      ? await readForwardBody(req)
      : { body: undefined, contentType: null }

    const headers = new Headers()
    if (contentType) headers.set('content-type', contentType)

    const url = `${getApiBaseUrl()}/api/gad/work-proposals${apiPath}`
    const response = await fetchWithTimeout(url, { method, headers, body, cache: 'no-store' })
    const responseBody = await response.arrayBuffer()
    return new NextResponse(responseBody, {
      status: response.status,
      headers: copyResponseHeaders(response.headers),
    })
  } catch (err) {
    const { code, message, status } = classifyUpstreamFetchError(err)
    return NextResponse.json({ success: false, message, errorCode: code }, { status })
  }
}

export function buildPath(segment: string, search: string): string {
  return search ? `${segment}${search}` : segment
}
